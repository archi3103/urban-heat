import os
import glob
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
import torch.nn as nn

# paths
met_folder_path = 'dataset/met_feat/'
urban_folder_path = 'dataset/urban_feat/osm_features_100x100.csv'
met_tensor_path = 'ahmedabad_data_90days.npy'


class AhmDataset (Dataset):
    def __init__(self, urban_folder_path, met_tensor_path):
        self.urban_df = pd.read_csv(urban_folder_path)
        self.grid_ids = self.urban_df['grid_id'].values
        drop_cols = ['grid_id', 'dominant_landcover', 'edge_cell']
        self.urban_df_final = self.urban_df.drop(columns=drop_cols).values.astype(np.float32)

        # Normalize static features (zero mean, unit variance) to stabilize training
        mean = np.mean(self.urban_df_final, axis=0)
        std = np.std(self.urban_df_final, axis=0)
        self.urban_df_final = (self.urban_df_final - mean) / (std + 1e-8)

        self.met_tensor = np.load(met_tensor_path)

    def __len__(self):
        return len(self.grid_ids)

    def __getitem__(self, idx):
        x_urban = torch.tensor(self.urban_df_final[idx], dtype=torch.float32) # (num_urban_Features,)
        x_met = torch.tensor(self.met_tensor[idx], dtype=torch.float32) # Shape: (90, 11)

        return x_urban, x_met



class urbanencoder(nn.Module):
    def __init__(self, input_dim_urban, emb_dim):
        super().__init__()
        self.enc = nn.Sequential(
            nn.Linear(input_dim_urban, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, emb_dim),
            nn.LayerNorm(emb_dim)
        )

    def forward(self, x):
        # x: (batch, num_urban_feat)
        return self.enc(x)  # (batch, emb_dim)



class metencoder(nn.Module):
    def __init__(self, input_dim_met, hidden_dim, emb_dim):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size = input_dim_met,
            hidden_size = hidden_dim,
            batch_first = True
        )
        self.fc = nn.Linear(hidden_dim, emb_dim)

    def forward(self, x):
        # x: (batch, num_days, num_feats_met) abhi (batch, 90, 11)
        lstm_out, (h_n, c_n) = self.lstm(x)
        emb = self.fc(lstm_out)
        return emb  # (bacth, num_days, emb_dim)


class crossattention(nn.Module):
    def __init__(self, emb_dim, num_heads):
        super().__init__()
        self.cross_attn = nn.MultiheadAttention(
            embed_dim = emb_dim,
            num_heads = num_heads,
            batch_first = True
        )

        self.fusion_mlp = nn.Sequential(
            nn.Linear(emb_dim * 3, emb_dim),
            nn.ReLU(),
            nn.Linear(emb_dim, emb_dim),
            nn.LayerNorm(emb_dim)
        )


    def forward(self, urban_emb, met_emb):
        # urban_emb : (batch, emb_dim)
        # met_emb : (bacth, num_days, emb_dim)

        q = urban_emb.unsqueeze(1) # (batch, 1, emb_dim)
        attn_out, _ = self.cross_attn(query=q, key=met_emb, value=met_emb)  # ()
        attn_out = attn_out.squeeze(1)  # (batch, emb_dim)

        met_pooled = met_emb.mean(dim=1)
        combined = torch.cat([urban_emb, met_pooled, attn_out], dim=-1) # (batch, emb_dim * 3)
        fused = self.fusion_mlp(combined) # (batch, emb_dim)

        return fused


# hyperparams
batch_size = 32
emb_dim = 128
num_heads = 4

# emb gen
dataset = AhmDataset(urban_folder_path, met_tensor_path)
dataloader = DataLoader(dataset, batch_size = batch_size, shuffle = False)


sample_urban, sample_met = dataset[0]
input_dim_urban = sample_urban.shape[0]
input_dim_met = sample_met.shape[1]

urban_enc = urbanencoder(input_dim_urban=input_dim_urban, emb_dim=emb_dim)
met_enc = metencoder(input_dim_met=input_dim_met, hidden_dim=emb_dim, emb_dim=emb_dim)
fusion_module = crossattention(emb_dim=emb_dim, num_heads=num_heads)


urban_enc.eval()
met_enc.eval()
fusion_module.eval()

fused_emb = []

# Generate and save embeddings without tracking gradients
with torch.no_grad():
    for x_urban, x_met in dataloader:
        # x_urban : (batch, num_urban_feats)
        # x_met : (batch, num_days, num_met_feats)
        u_emb = urban_enc(x_urban) # (batch, emb_dim)
        m_emb = met_enc(x_met)  # (batch, days, emb_dim)
        fused = fusion_module(u_emb, m_emb) # (batch, emb_dim)
        fused_emb.append(fused.cpu().numpy()) # so each element here is (b, emb_dim)

final_emb = np.concatenate(fused_emb, axis=0)   # (number_grids, emb_dim)

np.save('final_emb.npy', final_emb)

print(f"Final embedding shape: {final_emb.shape}")
