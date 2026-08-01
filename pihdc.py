import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader

torch.manual_seed(42)

# vars
emb_dim = 128
emb_path = 'final_emb.npy'

class embDataset (Dataset):
    def __init__(self, emb_path):
        self.embs = np.load(emb_path)

    def __len__(self):
        return len (self.embs)

    def __getitem__(self, idx):
        emb = torch.tensor(self.embs[idx], dtype=torch.float32)
        return emb  # (128,)

class MultiHeadDecoder(nn.Module):
    """
    Decodes single-cell embeddings into 8x8 spatial patches for PINN physics:
    - T: temperature prediction
    - R_net: net radiation
    - G: soil heat flux
    - H: sensible heat flux
    - LE: latent heat flux
    """

    def __init__(self, in_dim, hidden_dim, out_channels=5, grid_size=8):
        super().__init__()
        self.grid_size = grid_size

        self.decoder = nn.Sequential(
            nn.Conv2d(in_dim, hidden_dim, 3, padding=1), # (batch, 128, 8, 8) -> (batch, 256, 8, 8)
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU(),
            nn.Conv2d(hidden_dim, hidden_dim, 3, padding=1), # (batch, 256, 8, 8) -> (batch, 256, 8, 8)
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU(),
            nn.Conv2d(hidden_dim, out_channels, 1),  # (batch, 256, 8, 8) -> (batch, 5, 8, 8)
        )

    def forward(self, embeddings):
        # embs : (batch, emb_dim)
        B = embeddings.shape[0]
        x = embeddings.unsqueeze(-1).unsqueeze(-1)  # (batch, 128, 1, 1)
        x = x.expand(B, -1, self.grid_size, self.grid_size) # (batch, 128, 8, 8)
        out = self.decoder(x)   # (batch, 5, 8, 8)

        return out


class PINN(nn.Module):
    def __init__(self, embedding_dim=128, decoder_hidden=256):
        super().__init__()
        self.decoder = MultiHeadDecoder(in_dim=embedding_dim, hidden_dim=decoder_hidden)

    def forward(self, x):
        outputs = self.decoder(x)  # (batch, 128) -> (batch, 5, 8, 8)

        return {
            'output': outputs,
            'T':     outputs[:, 0:1, :, :],  # Temperature
            'R_net': outputs[:, 1:2, :, :],  # Net Radiation
            'G':     outputs[:, 2:3, :, :],  # Soil Heat Flux
            'H':     outputs[:, 3:4, :, :],  # Sensible Heat Flux
            'LE':    outputs[:, 4:5, :, :]   # Latent Heat Flux
            # all (batch, 1, 8, 8)
        }


class PINNLoss:
    """
    Computes physics-informed loss components tailored for the embedding-to-patch workflow:
    - L_data: Data fidelity (MSE between predicted T and ground truth T)
    - L_seb: Surface energy balance constraint (R_net = G + H + LE)
    """
    def __init__(self, w_data=1.0, w_seb=0.5):
        self.w_data = w_data
        self.w_seb = w_seb

    def data_fidelity_loss(self, T_pred, T_obs):
        """
        MSE loss comparing predicted temperature patch against observed targets.
        T_pred, T_obs shapes: [B, 1, 8, 8]
        """
        return F.mse_loss(T_pred, T_obs)

    def surface_energy_balance_loss(self, R_net, G, H, LE):
        """
        Enforces physical conservation of energy: R_net - G - H - LE = 0
        All inputs shapes: [B, 1, 8, 8]
        """
        residual = R_net - (G + H + LE)
        return torch.mean(residual ** 2)

    def compute_total_loss(self, predictions, targets):
        """
        predictions: dictionary returned by SimplePIHDC forward pass
        targets: dictionary containing ground truth 'T_obs' [B, 1, 8, 8]
        """
        # 1. Calculate individual losses
        L_data = self.data_fidelity_loss(predictions['T'], targets['T_obs'])

        L_seb = self.surface_energy_balance_loss(
            predictions['R_net'],
            predictions['G'],
            predictions['H'],
            predictions['LE']
        )

        # 2. Combine with weights
        total_loss = (self.w_data * L_data) + (self.w_seb * L_seb)

        return {
            'total': total_loss,
            'L_data': L_data,
            'L_seb': L_seb
        }