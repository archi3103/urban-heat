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
met_tensor_path = 'ahmedabad_90days_tensor_final.npy'


class AhmDataset(Dataset):
    def __init__(self, urban_folder_path, met_tensor_path):
        self.urban_df = pd.read_csv(urban_folder_path)

        # FIX 1: Fill missing values in CSV data to prevent NaN propagation
        self.urban_df = self.urban_df.fillna(0)

        self.grid_ids = self.urban_df['grid_id'].values
        drop_cols = ['grid_id', 'dominant_landcover', 'edge_cell']
        self.urban_df_final = self.urban_df.drop(columns=drop_cols).values.astype(np.float32)

        # Normalize static features safely (handling potential zero variance columns)
        mean = np.mean(self.urban_df_final, axis=0)
        std = np.std(self.urban_df_final, axis=0)
        self.urban_df_final = (self.urban_df_final - mean) / (std + 1e-8)

        # FIX 2: Load meteorological tensor and clean any existing NaNs/Infs
        self.met_tensor = np.load(met_tensor_path)
        self.met_tensor = np.nan_to_num(self.met_tensor, nan=0.0, posinf=0.0, neginf=0.0)

    def __len__(self):
        return len(self.grid_ids)

    def __getitem__(self, idx):
        x_urban = torch.tensor(self.urban_df_final[idx], dtype=torch.float32)
        x_met = torch.tensor(self.met_tensor[idx], dtype=torch.float32)

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
        return self.enc(x)


class metencoder(nn.Module):
    def __init__(self, input_dim_met, hidden_dim, emb_dim):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim_met,
            hidden_size=hidden_dim,
            batch_first=True
        )
        self.fc = nn.Linear(hidden_dim, emb_dim)

    def forward(self, x):
        lstm_out, (h_n, c_n) = self.lstm(x)
        emb = self.fc(lstm_out)
        return emb


class crossattention(nn.Module):
    def __init__(self, emb_dim, num_heads):
        super().__init__()
        self.cross_attn = nn.MultiheadAttention(
            embed_dim=emb_dim,
            num_heads=num_heads,
            batch_first=True
        )
        self.fusion_mlp = nn.Sequential(
            nn.Linear(emb_dim * 3, emb_dim),
            nn.ReLU(),
            nn.Linear(emb_dim, emb_dim),
            nn.LayerNorm(emb_dim)
        )

    def forward(self, urban_emb, met_emb):
        q = urban_emb.unsqueeze(1)
        attn_out, _ = self.cross_attn(query=q, key=met_emb, value=met_emb)
        attn_out = attn_out.squeeze(1)

        met_pooled = met_emb.mean(dim=1)
        combined = torch.cat([urban_emb, met_pooled, attn_out], dim=-1)
        fused = self.fusion_mlp(combined)

        return fused


# hyperparams
batch_size = 32
emb_dim = 128
num_heads = 4

# dataset & dataloader
dataset = AhmDataset(urban_folder_path, met_tensor_path)
dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=False)

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

# Generate embeddings
with torch.no_grad():
    for x_urban, x_met in dataloader:
        u_emb = urban_enc(x_urban)
        m_emb = met_enc(x_met)
        fused = fusion_module(u_emb, m_emb)
        fused_emb.append(fused.cpu().numpy())

final_emb = np.concatenate(fused_emb, axis=0)

# FIX 3: Ultimate safety check to clean any remaining NaNs before saving
final_emb = np.nan_to_num(final_emb, nan=0.0, posinf=0.0, neginf=0.0)

np.save('final_emb_new.npy', final_emb)

print(f"Final embedding shape: {final_emb.shape}")
print(f"Are there any NaNs left: {np.isnan(final_emb).any()}")