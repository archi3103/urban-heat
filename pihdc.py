import glob
import os
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, random_split


torch.manual_seed(42)

# vars
emb_dim = 128
grid_size = 8
emb_path = 'final_emb_real.npy'
met_folder_path = 'dataset/met_feat/'
urban_folder_path = 'dataset/urban_feat/osm_features_100x100.csv'

batch_size = 32
learning_rate = 1e-4
num_epochs = 5



class embDataset (Dataset):
    def __init__(self, emb_path, urban_folder_path, met_folder_path):
        self.embs = np.load(emb_path)
        self.urban_df = pd.read_csv(urban_folder_path)
        self.coords = self.urban_df[['centroid_lon', 'centroid_lat']].values.astype(np.float32)

        # self.svf = self.urban_df['svf'].values.astype(np.float32)

        # svf not there in dataset so this is a temp fix
        # In your dataset initialization, replace self.svf with an approximation:
        # Higher building density and height -> lower SVF (openness)
        self.svf = 1.0 - np.clip(self.urban_df['building_density'] * (self.urban_df['avg_height'] / 50.0), 0.0, 0.9)

        self.met_files = sorted(glob.glob(os.path.join(met_folder_path, "*.csv")))
        self.num_grids = len(self.embs)
        self.num_days = len(self.met_files)

    def __len__(self):
        return self.num_grids * self.num_days

    def __getitem__(self, idx):
        grid_idx = idx % self.num_grids
        day_idx = idx // self.num_grids
        emb = torch.tensor(self.embs[grid_idx], dtype=torch.float32)

        x, y = self.coords[grid_idx]
        t = float(day_idx + 1)
        coord_3d = torch.tensor([x, y, t], dtype=torch.float32)

        svf_val = self.svf[grid_idx]
        svf_tensor = torch.tensor([svf_val], dtype=torch.float32).repeat(grid_size*grid_size).unsqueeze(-1) # (grid_size*grid_size, 1) abhi (64, 1)

        met_file = self.met_files[day_idx]
        met_df = pd.read_csv(met_file)

        temp_val = met_df.loc[grid_idx, 'LST_Avg_C']
        # normalized_temp = (temp_val - 20.0) / (50.0 - 20.0)

        # obs_temp = torch.tensor([normalized_temp], dtype=torch.float32).repeat(1, grid_size, grid_size)
        obs_temp = torch.tensor([temp_val], dtype=torch.float32).repeat(1, grid_size, grid_size)

        return emb, coord_3d, svf_tensor, obs_temp # (128,), (embs,coords, svf,t), (64, 1), (1, 8, 8)



class decoder(nn.Module):
    """
    Decodes single-cell embeddings into 8embs8 spatial patches for PINN physics:
    - T: temperature predsiction
    - R_net: net radiation
    - G: soil heat flux
    - H: sensible heat flux
    - LE: latent heat flux
    """

    def __init__(self, in_dim, hidden_dim, out_channels=5, grid_size=grid_size):
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
        embs = embeddings.unsqueeze(-1).unsqueeze(-1)  # (batch, 128, 1, 1)
        embs = embs.expand(B, -1, self.grid_size, self.grid_size) # (batch, 128, 8, 8)
        out = self.decoder(embs)   # (batch, 5, 8, 8)

        return out


class PINN(nn.Module):
    def __init__(self, embedding_dim=128, decoder_hidden=256):
        super().__init__()
        self.decoder = decoder(in_dim=embedding_dim, hidden_dim=decoder_hidden)

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
    Computes physics-informed loss components for spatial-temporal grid patches:
    - L_data: Data fidelity (MSE between predsicted T and observed T)
    - L_seb: Surface energy balance constraint (R_net = G + H + LE)
    - L_pde: Heat diffusion equation spatial-temporal physics penalty
    - L_morph: Urban morphological consistency penalty based on Sky View Factor (SVF) gradients
    """
    def __init__(self, config=None):
        default_config = {
            "thermal_diffusivity": 0.5e-6,
            "rho_cp_d": 1.2e6,
            "w_data": 1.0,
            "w_seb": 0.5,
            "w_pde": 0.1,
            "w_morph": 0.05
        }
        cfg = config or default_config
        self.alpha = cfg["thermal_diffusivity"]
        self.rho_cp_d = cfg["rho_cp_d"]
        self.w_data = cfg["w_data"]
        self.w_seb = cfg["w_seb"]
        self.w_pde = cfg["w_pde"]
        self.w_morph = cfg["w_morph"]

    def data_fidelity_loss(self, T_preds, T_obs):
        return F.mse_loss(T_preds, T_obs)

    def surface_energy_balance_loss(self, R_net, G, H, LE):
        residual = R_net - G - H - LE
        return torch.mean(residual ** 2)

    def heat_equation_pde_loss(self, T_preds, R_net, G, H, LE):
        """
        Enforces Heat Equation via finite-difference spatial Laplacian and SEB source term:
        - Laplacian (∇²T) calculated using neighboring piembsel differences on 8embs8 patches.
        - Source term S = (R_net - G - H - LE) / (ρ * cp * d)
        """
        # 1. Compute Source Term from SEB outputs
        S = (R_net - G - H - LE) / self.rho_cp_d

        # 2. Approembsimate spatial second derivatives (Laplacian) via finite differences
        d2T_dx2 = T_preds[:, :, :, 2:] - 2 * T_preds[:, :, :, 1:-1] + T_preds[:, :, :, :-2]
        d2T_dy2 = T_preds[:, :, 2:, :] - 2 * T_preds[:, :, 1:-1, :] + T_preds[:, :, :-2, :]

        # Trim to matching inner shape
        laplacian_T = d2T_dx2[:, :, :-2, :] + d2T_dy2[:, :, :, :-2]
        S_trimmed = S[:, :, 1:-1, 1:-1]

        # 3. PDE Residual: - α(∇²T) - S = 0
        pde_residual = - (self.alpha * laplacian_T) - S_trimmed

        return torch.mean(pde_residual ** 2)

    def morphological_consistency_loss(self, T_preds, svf):
        """
        Penalizes positive correlation between temperature gradients and Sky View Factor (SVF) gradients.
        T_preds: [B, 1, 8, 8]
        svf: [B, 1, 8, 8] (or [B, 64, 1] reshaped internally)
        """
        if svf.dim() == 3 and svf.shape[1] == 64:
            svf_grid = svf.transpose(1, 2).reshape(-1, 1, 8, 8)
        else:
            svf_grid = svf

        # Compute differences
        dT_dx = T_preds[:, :, :, 1:] - T_preds[:, :, :, :-1]   # [B, 1, 8, 7]
        dT_dy = T_preds[:, :, 1:, :] - T_preds[:, :, :-1, :]   # [B, 1, 7, 8]
        dSVF_dx = svf_grid[:, :, :, 1:] - svf_grid[:, :, :, :-1] # [B, 1, 8, 7]
        dSVF_dy = svf_grid[:, :, 1:, :] - svf_grid[:, :, :-1, :] # [B, 1, 7, 8]

        # Slice both to the common inner 7x7 spatial overlap region [:, :, :-1, :-1]
        dT_dx_inner = dT_dx[:, :, :-1, :]     # [B, 1, 7, 7]
        dT_dy_inner = dT_dy[:, :, :, :-1]     # [B, 1, 7, 7]
        dSVF_dx_inner = dSVF_dx[:, :, :-1, :] # [B, 1, 7, 7]
        dSVF_dy_inner = dSVF_dy[:, :, :, :-1] # [B, 1, 7, 7]

        # Compute dot product on the matched 7x7 shapes
        dot = dT_dx_inner * dSVF_dx_inner + dT_dy_inner * dSVF_dy_inner
        return torch.mean(torch.relu(dot) ** 2)

    def compute_total_loss(self, predsictions, targets, svf):
        """
        Computes weighted total loss across all components.
        """
        L_data = self.data_fidelity_loss(predsictions['T'], targets['T_obs'])
        L_seb = self.surface_energy_balance_loss(
            predsictions['R_net'], predsictions['G'], predsictions['H'], predsictions['LE']
        )
        L_pde = self.heat_equation_pde_loss(
            predsictions['T'], predsictions['R_net'], predsictions['G'], predsictions['H'], predsictions['LE']
        )
        L_morph = self.morphological_consistency_loss(predsictions['T'], svf)

        total = (self.w_data * L_data +
                 self.w_seb * L_seb +
                 self.w_pde * L_pde +
                 self.w_morph * L_morph)

        return {
            'total': total,
            'L_data': L_data,
            'L_seb': L_seb,
            'L_pde': L_pde,
            'L_morph': L_morph
        }



# TRAINING

dataset = embDataset(emb_path, urban_folder_path, met_folder_path)

train_size = int(0.8 * len(dataset))
test_size = len(dataset) - train_size

train_dataset, test_dataset = random_split(dataset, [train_size, test_size])

train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
test_dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(device)


model = PINN(emb_dim).to(device)
criterion = PINNLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)



def train(dataloader, model, loss_fn, optimizer):
    size = len(dataloader.dataset)
    model.train()
    for batch, (embs, coords, svf, obs_temp) in enumerate(dataloader):
        embs, coords, svf, obs_temp = embs.to(device), coords.to(device), svf.to(device), obs_temp.to(device)

        # Compute predsiction error
        preds = model(embs)
        targets = {'T_obs': obs_temp}
        loss_dict = loss_fn.compute_total_loss(preds, targets, svf)
        loss = loss_dict['total']

        # Backpropagation
        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

        if batch % 100 == 0:
            loss_val, current = loss.item(), (batch + 1) * len(embs)
            print(f"loss: {loss_val:>7f}  [{current:>5d}/{size:>5d}] | "
                  f"Data: {loss_dict['L_data'].item():.4f} | "
                  f"SEB: {loss_dict['L_seb'].item():.4f} | "
                  f"PDE: {loss_dict['L_pde'].item():.4f} | "
                  f"Morph: {loss_dict['L_morph'].item():.4f}"
            )


def test(dataloader, model, loss_fn):
    size = len(dataloader.dataset)
    test_loss_accum = {'total': 0.0, 'L_data': 0.0, 'L_seb': 0.0, 'L_pde': 0.0, 'L_morph': 0.0}
    num_batches = len(dataloader)
    model.eval()

    with torch.no_grad():
        for embs, coords, svf, obs_temp in dataloader:
            embs, coords, svf, obs_temp = embs.to(device), coords.to(device), svf.to(device), obs_temp.to(device)
            preds = model(embs)
            targets = {'T_obs' : obs_temp}
            loss_dict = loss_fn.compute_total_loss(preds, targets, svf)

            for key in test_loss_accum:
                test_loss_accum[key] += loss_dict[key].item()

        for key in test_loss_accum:
            test_loss_accum[key] /= num_batches

        print(f"Test Evaluation Results:")
        print(f"  -> Total Loss : {test_loss_accum['total']:.4f}")
        print(f"  -> Data Loss  : {test_loss_accum['L_data']:.4f}")
        print(f"  -> SEB Loss   : {test_loss_accum['L_seb']:.4f}")
        print(f"  -> PDE Loss   : {test_loss_accum['L_pde']:.4f}")
        print(f"  -> Morph Loss : {test_loss_accum['L_morph']:.4f}\n")



for epoch in range(num_epochs):
    print(f"--- Epoch {epoch+1}/{num_epochs} ---")
    train(train_dataloader, model, criterion, optimizer)
    test(test_dataloader, model, criterion)

