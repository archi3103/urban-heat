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
emb_path = 'final_emb_new.npy'
met_folder_path = 'dataset/met_feat/'
urban_folder_path = 'dataset/urban_feat/osm_features_100x100.csv'

batch_size = 32
learning_rate = 1e-4
num_epochs = 5





# class embDataset(Dataset):
#     def __init__(self, emb_path, urban_folder_path, met_folder_path=None):
#         self.embs = np.load(emb_path)
#         self.urban_df = pd.read_csv(urban_folder_path)
#         self.urban_df.columns = self.urban_df.columns.str.strip().str.lstrip(',')

#         # Load the first daily meteorological file
#         met_files = sorted(glob.glob(os.path.join(met_folder_path, "*.csv")))
#         self.met_df = pd.read_csv(met_files[0])

#         # Clean column names (strip spaces and any rogue leading commas)
#         self.met_df.columns = self.met_df.columns.str.strip().str.lstrip(',')

#         # Directly extract coordinates using your exact column names
#         self.coords = self.met_df[['EE_Lon', 'EE_Lat']].values.astype(np.float32)


#         # 2. Approximate SVF using built-up fraction since building height isn't available
#         self.svf = 1.0 - np.clip(self.urban_df['builtup_fraction'], 0.0, 0.9) if 'builtup_fraction' in self.urban_df.columns else np.full(len(self.embs), 0.5)

#         self.num_grids = len(self.embs)

#         # If your data is a single flat CSV containing all rows per grid/month,
#         # we index directly by len(self.urban_df).
#         # (If you still use multiple day files, you can keep your glob logic here).
#         self.num_samples = len(self.urban_df)

#     def __len__(self):
#         return self.num_samples

#     def __getitem__(self, idx):
#         # Map dataset index to your grid/row index
#         grid_idx = idx % self.num_grids
#         emb = torch.tensor(self.embs[grid_idx], dtype=torch.float32)

#         # Coordinates & time placeholder
#         x, y = self.coords[grid_idx]
#         t = 1.0  # Adjust if you have a continuous time/month column
#         coord_3d = torch.tensor([x, y, t], dtype=torch.float32)

#         # Pull row data from your CSV features
#         row = self.urban_df.iloc[grid_idx]

#         lst = row.get('LST_Avg_C', 30.0)
#         ndvi = row.get('NDVI', 0.3)
#         albedo = row.get('Albedo', 0.2)
#         solar_rad = row.get('Solar_Radiation', 500.0)
#         soil_moisture = row.get('Soil_Moisture', 0.2)

#         if pd.isna(lst):
#             lst = 30.0

#         # --- Base Physics Calculations ---
#         norm_temp = (lst - 20.0) / (50.0 - 20.0)
#         r_net_val = (1.0 - albedo) * (solar_rad / 1000.0) # Scaled metric for stability
#         g_val = r_net_val * (0.58 * np.exp(-2.13 * ndvi))
#         avail_energy = r_net_val - g_val
#         le_val = avail_energy * soil_moisture
#         h_val = avail_energy - le_val
#         # ---------------------------------

#         # Package into 5-channel base physics tensor and broadcast to 8x8 spatial grid shape: (5, 8, 8)
#         base_physics = torch.tensor([
#             [norm_temp],
#             [r_net_val],
#             [g_val],
#             [h_val],
#             [le_val]
#         ], dtype=torch.float32).repeat(1, grid_size, grid_size)

#         # Target observed temperature grid for data fidelity loss: (1, 8, 8)
#         obs_temp = torch.tensor([norm_temp], dtype=torch.float32).repeat(1, grid_size, grid_size)

#         # Sky view factor tensor
#         svf_val = self.svf[grid_idx]
#         svf_tensor = torch.tensor([svf_val], dtype=torch.float32).repeat(grid_size, grid_size).unsqueeze(0) # (1, 8, 8)

#         return emb, coord_3d, svf_tensor, obs_temp, base_physics



# class embDataset (Dataset):
#     def __init__(self, emb_path, urban_folder_path, met_folder_path):
#         self.embs = np.load(emb_path)
#         self.urban_df = pd.read_csv(urban_folder_path)
#         # Load the first daily meteorological file
#         met_files = sorted(glob.glob(os.path.join(met_folder_path, "*.csv")))
#         self.met_df = pd.read_csv(met_files[0])

#         # Clean column names (strip spaces and any rogue leading commas)
#         self.met_df.columns = self.met_df.columns.str.strip().str.lstrip(',')

#         # Directly extract coordinates using your exact column names
#         self.coords = self.met_df[['EE_Lon', 'EE_Lat']].values.astype(np.float32)

#         # self.svf = self.urban_df['svf'].values.astype(np.float32)

#         # svf not there in dataset so this is a temp fix
#         # In your dataset initialization, replace self.svf with an approximation:
#         # Higher building density and height -> lower SVF (openness)
#         self.svf = 1.0 - np.clip(self.urban_df['building_density'] * (self.urban_df['avg_height'] / 50.0), 0.0, 0.9)

#         self.met_files = sorted(glob.glob(os.path.join(met_folder_path, "*.csv")))
#         self.num_grids = len(self.embs)
#         self.num_days = len(self.met_files)

#     def __len__(self):
#         return self.num_grids * self.num_days

#     def __getitem__(self, idx):
#         grid_idx = idx % self.num_grids
#         day_idx = idx // self.num_grids
#         emb = torch.tensor(self.embs[grid_idx], dtype=torch.float32)

#         x, y = self.coords[grid_idx]
#         t = float(day_idx + 1)
#         coord_3d = torch.tensor([x, y, t], dtype=torch.float32)

#         svf_val = self.svf[grid_idx]
#         svf_tensor = torch.tensor([svf_val], dtype=torch.float32).repeat(grid_size*grid_size).unsqueeze(-1) # (grid_size*grid_size, 1) abhi (64, 1)

#         met_file = self.met_files[day_idx]
#         met_df = pd.read_csv(met_file)

#         temp_val = met_df.loc[grid_idx, 'LST_Avg_C']
#         if pd.isna(temp_val):
#             # Fallback default value if data is missing for this grid cell
#             temp_val = 30.0
#         normalized_temp = (temp_val - 20.0) / (50.0 - 20.0)

#         obs_temp = torch.tensor([normalized_temp], dtype=torch.float32).repeat(1, grid_size, grid_size)
#         # obs_temp = torch.tensor([temp_val], dtype=torch.float32).repeat(1, grid_size, grid_size)

#         return emb, coord_3d, svf_tensor, obs_temp # (128,), (embs,coords, svf,t), (64, 1), (1, 8, 8)





class embDataset (Dataset):
    def __init__(self, emb_path, urban_folder_path, met_folder_path):
        self.embs = np.load(emb_path)
        self.urban_df = pd.read_csv(urban_folder_path)
        # Load the first daily meteorological file
        met_files = sorted(glob.glob(os.path.join(met_folder_path, "*.csv")))
        self.met_df = pd.read_csv(met_files[0])

        # Clean column names (strip spaces and any rogue leading commas)
        self.met_df.columns = self.met_df.columns.str.strip().str.lstrip(',')

        # Directly extract coordinates using your exact column names
        self.coords = self.met_df[['EE_Lon', 'EE_Lat']].values.astype(np.float32)

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
        emb = torch.tensor(self.embs[grid_idx], dtype=torch.float32)

        x, y = self.coords[grid_idx]
        t = 1.0
        coord_3d = torch.tensor([x, y, t], dtype=torch.float32)

        row = self.urban_df.iloc[grid_idx]
        lst = row.get('LST_Avg_C', 30.0)
        ndvi = row.get('NDVI', 0.3)
        albedo = row.get('Albedo', 0.2)
        solar_rad = row.get('Solar_Radiation', 500.0)
        soil_moisture = row.get('Soil_Moisture', 0.2)

        if pd.isna(lst):
            lst = 30.0

        # Package raw scalars into a small tensor to pass to the model: [lst, ndvi, albedo, solar_rad, soil_moisture]
        base_scalars = torch.tensor([lst, ndvi, albedo, solar_rad, soil_moisture], dtype=torch.float32)

        norm_temp = (lst - 20.0) / (50.0 - 20.0)
        obs_temp = torch.tensor([norm_temp], dtype=torch.float32).repeat(1, grid_size, grid_size)

        svf_val = self.svf[grid_idx]
        svf_tensor = torch.tensor([svf_val], dtype=torch.float32).repeat(grid_size, grid_size).unsqueeze(0)

        return emb, coord_3d, svf_tensor, obs_temp, base_scalars










class decoder(nn.Module):
    def __init__(self, in_dim, hidden_dim, out_channels=5, grid_size=grid_size):
        super().__init__()
        self.grid_size = grid_size

        self.decoder = nn.Sequential(
            nn.Conv2d(in_dim, hidden_dim, 3, padding=1),
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU(),
            nn.Conv2d(hidden_dim, hidden_dim, 3, padding=1),
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU(),
            nn.Conv2d(hidden_dim, out_channels, 1),
        )
        # Initialize final layer weights close to zero so delta starts at 0
        nn.init.normal_(self.decoder[-1].weight, mean=0.0, std=0.01)
        nn.init.zeros_(self.decoder[-1].bias)

    def forward(self, embeddings, base_scalars):
        B = embeddings.shape[0]

        # 1. Unpack raw scalars to compute your exact base physics formulas on the fly
        lst = base_scalars[:, 0]
        ndvi = base_scalars[:, 1]
        albedo = base_scalars[:, 2]
        solar_rad = base_scalars[:, 3]
        soil_moisture = base_scalars[:, 4]

        # Apply your exact formulas vectorially across the batch
        norm_temp = (lst - 20.0) / (50.0 - 20.0)
        r_net_val = (1.0 - albedo) * (solar_rad / 1000.0)
        g_val = r_net_val * (0.58 * torch.exp(-2.13 * ndvi))
        avail_energy = r_net_val - g_val
        le_val = avail_energy * soil_moisture
        h_val = avail_energy - le_val

        # Stack and broadcast to spatial grid shape (batch, 5, 8, 8)
        base_physics = torch.stack([norm_temp, r_net_val, g_val, h_val, le_val], dim=1) # (batch, 5)
        base_physics = base_physics.unsqueeze(-1).unsqueeze(-1).expand(B, -1, self.grid_size, self.grid_size)

        # 2. Expand 1D embeddings to spatial grid
        embs_spatial = embeddings.unsqueeze(-1).unsqueeze(-1).expand(B, -1, self.grid_size, self.grid_size)

        # 3. Predict residual correction delta
        delta = self.decoder(embs_spatial)  # (batch, 5, 8, 8)

        # 4. Start precisely with the base physics values, letting delta correct them
        out = base_physics + delta

        return out



class PINN(nn.Module):
    def __init__(self, embedding_dim=128, decoder_hidden=256):
        super().__init__()
        self.decoder = decoder(in_dim=embedding_dim, hidden_dim=decoder_hidden)

    def forward(self, x, base_scalars):
        outputs = self.decoder(x, base_scalars)  # (batch, 128) -> (batch, 5, 8, 8)

        return {
            'output': outputs,
            'T':     outputs[:, 0:1, :, :],  # Temperature
            'R_net': outputs[:, 1:2, :, :],  # Net Radiation
            'G':     outputs[:, 2:3, :, :],  # Soil Heat Flux
            'H':     outputs[:, 3:4, :, :],  # Sensible Heat Flux
            'LE':    outputs[:, 4:5, :, :]   # Latent Heat Flux
            # all (batch, 1, 8, 8)
        }

# class PINNLoss:
#     """
#     Computes physics-informed loss components for spatial-temporal grid patches:
#     - L_data: Data fidelity (MSE between predsicted T and observed T)
#     - L_seb: Surface energy balance constraint (R_net = G + H + LE)
#     - L_pde: Heat diffusion equation spatial-temporal physics penalty
#     - L_morph: Urban morphological consistency penalty based on Sky View Factor (SVF) gradients
#     """
#     def __init__(self, config=None):
#         default_config = {
#             # "thermal_diffusivity": 0.5e-6,
#             "thermal_diffusivity": 0.01,
#             "rho_cp_d": 1.0,
#             "w_data": 10.0,
#             "w_seb": 10000.0,
#             "w_pde": 10000.0,
#             "w_morph": 1000.0
#         }
#         cfg = config or default_config
#         self.alpha = cfg["thermal_diffusivity"]
#         self.rho_cp_d = cfg["rho_cp_d"]
#         self.w_data = cfg["w_data"]
#         self.w_seb = cfg["w_seb"]
#         self.w_pde = cfg["w_pde"]
#         self.w_morph = cfg["w_morph"]

#     # def data_fidelity_loss(self, T_preds, T_obs):
#     #     return F.mse_loss(T_preds, T_obs)

#     def data_fidelity_loss(self, T_preds, T_obs):
#         mse = F.mse_loss(T_preds, T_obs)
#         return torch.sqrt(torch.clamp(mse, min=1e-8))

#     def surface_energy_balance_loss(self, R_net, G, H, LE):
#         residual = R_net - G - H - LE
#         residual = torch.clamp(residual, min=-1e3, max=1e3) # Safety clamp
#         return torch.mean(residual ** 2)

#     def heat_equation_pde_loss(self, T_preds, R_net, G, H, LE):
#         S = (R_net - G - H - LE) / self.rho_cp_d
#         S = torch.clamp(S, min=-1e2, max=1e2) # Safety clamp

#         d2T_dx2 = T_preds[:, :, :, 2:] - 2 * T_preds[:, :, :, 1:-1] + T_preds[:, :, :, :-2]
#         d2T_dy2 = T_preds[:, :, 2:, :] - 2 * T_preds[:, :, 1:-1, :] + T_preds[:, :, :-2, :]

#         laplacian_T = d2T_dx2[:, :, :-2, :] + d2T_dy2[:, :, :, :-2]
#         laplacian_T = torch.clamp(laplacian_T, min=-1e3, max=1e3) # Safety clamp

#         S_trimmed = S[:, :, 1:-1, 1:-1]
#         pde_residual = - (self.alpha * laplacian_T) - S_trimmed
#         pde_residual = torch.clamp(pde_residual, min=-1e3, max=1e3) # Safety clamp

#         return torch.mean(pde_residual ** 2)


#     def morphological_consistency_loss(self, T_preds, svf):
#         """
#         Penalizes positive correlation between temperature gradients and Sky View Factor (SVF) gradients.
#         T_preds: [B, 1, 8, 8]
#         svf: [B, 1, 8, 8] (or [B, 64, 1] reshaped internally)
#         """
#         if svf.dim() == 3 and svf.shape[1] == 64:
#             svf_grid = svf.transpose(1, 2).reshape(-1, 1, 8, 8)
#         else:
#             svf_grid = svf

#         # Compute differences
#         dT_dx = T_preds[:, :, :, 1:] - T_preds[:, :, :, :-1]   # [B, 1, 8, 7]
#         dT_dy = T_preds[:, :, 1:, :] - T_preds[:, :, :-1, :]   # [B, 1, 7, 8]
#         dSVF_dx = svf_grid[:, :, :, 1:] - svf_grid[:, :, :, :-1] # [B, 1, 8, 7]
#         dSVF_dy = svf_grid[:, :, 1:, :] - svf_grid[:, :, :-1, :] # [B, 1, 7, 8]

#         # Slice both to the common inner 7x7 spatial overlap region [:, :, :-1, :-1]
#         dT_dx_inner = dT_dx[:, :, :-1, :]     # [B, 1, 7, 7]
#         dT_dy_inner = dT_dy[:, :, :, :-1]     # [B, 1, 7, 7]
#         dSVF_dx_inner = dSVF_dx[:, :, :-1, :] # [B, 1, 7, 7]
#         dSVF_dy_inner = dSVF_dy[:, :, :, :-1] # [B, 1, 7, 7]

#         # Compute dot product on the matched 7x7 shapes
#         dot = dT_dx_inner * dSVF_dx_inner + dT_dy_inner * dSVF_dy_inner
#         # return torch.mean(torch.relu(dot) ** 2)
#         return torch.mean(dot ** 2)

#     def compute_total_loss(self, prediction, targets, svf):
#         """
#         Computes weighted total loss across all components.
#         """
#         L_data = self.data_fidelity_loss(prediction['T'], targets['T_obs'])
#         L_seb = self.surface_energy_balance_loss(
#             prediction['R_net'], prediction['G'], prediction['H'], prediction['LE']
#         )
#         L_pde = self.heat_equation_pde_loss(
#             prediction['T'], prediction['R_net'], prediction['G'], prediction['H'], prediction['LE']
#         )
#         L_morph = self.morphological_consistency_loss(prediction['T'], svf)

#         total = (self.w_data * L_data +
#                  self.w_seb * L_seb +
#                  self.w_pde * L_pde +
#                  self.w_morph * L_morph)

#         # # Put this inside compute_total_loss or right before it:
#         # print(f"Pred T range: {prediction['T'].min().item():.2f} to {prediction['T'].max().item():.2f}")
#         # print(f"Pred R_net range: {prediction['R_net'].min().item():.2f} to {prediction['R_net'].max().item():.2f}")
#         # print(f"Pred G range: {prediction['G'].min().item():.2f} to {prediction['G'].max().item():.2f}")
#         # print(f"Pred H range: {prediction['H'].min().item():.2f} to {prediction['H'].max().item():.2f}")
#         # print(f"Pred LE range: {prediction['LE'].min().item():.2f} to {prediction['LE'].max().item():.2f}")

#         return {
#             'total': total,
#             'L_data': L_data,
#             'L_seb': L_seb,
#             'L_pde': L_pde,
#             'L_morph': L_morph
#         }



class PINNLoss:
    def __init__(self, config=None):
        default_config = {
            "thermal_diffusivity": 0.01,
            "rho_cp_d": 1.0,
            "w_data": 1.0,
            "w_seb": 500.0,
            "w_pde": 500.0,
            "w_morph": 100
        }
        cfg = config or default_config
        self.alpha = cfg["thermal_diffusivity"]
        self.rho_cp_d = cfg["rho_cp_d"]
        self.w_data = cfg["w_data"]
        self.w_seb = cfg["w_seb"]
        self.w_pde = cfg["w_pde"]
        self.w_morph = cfg["w_morph"]

    # def data_fidelity_loss(self, T_preds, T_obs):
    #     mse = F.mse_loss(T_preds, T_obs)
    #     return torch.sqrt(torch.clamp(mse, min=1e-8))

    def data_fidelity_loss(self, T_preds, T_obs):
        # T_preds shape is [B, 1, 8, 8]
        # T_obs shape is [B, 1, 8, 8] (but completely flat/constant)

        # 1. Calculate the spatial average of your predicted 8x8 patch
        T_preds_mean = T_preds.mean(dim=(2, 3)) # Collapses to [B, 1]

        # 2. Extract the scalar target value from the flat observation
        T_obs_scalar = T_obs.mean(dim=(2, 3))   # Collapses to [B, 1]

        # 3. Only penalize the *average* patch temperature, allowing physics to create spatial texture
        mse = F.mse_loss(T_preds_mean, T_obs_scalar)
        return torch.sqrt(torch.clamp(mse, min=1e-8))

    def surface_energy_balance_loss(self, R_net, G, H, LE):
        residual = R_net - G - H - LE
        return torch.mean(residual ** 2)

    def heat_equation_pde_loss(self, T_preds, R_net, G, H, LE):
        S = (R_net - G - H - LE) / self.rho_cp_d

        # Second spatial derivatives
        d2T_dx2 = T_preds[:, :, :, 2:] - 2 * T_preds[:, :, :, 1:-1] + T_preds[:, :, :, :-2] # [B, 1, 8, 6]
        d2T_dy2 = T_preds[:, :, 2:, :] - 2 * T_preds[:, :, 1:-1, :] + T_preds[:, :, :-2, :] # [B, 1, 6, 8]

        # Properly match inner spatial dimensions for 6x6 overlap
        laplacian_T = d2T_dx2[:, :, 1:-1, :] + d2T_dy2[:, :, :, 1:-1] # [B, 1, 6, 6]
        S_trimmed = S[:, :, 1:-1, 1:-1]                                # [B, 1, 6, 6]

        pde_residual = - (self.alpha * laplacian_T) - S_trimmed
        return torch.mean(pde_residual ** 2)

    def morphological_consistency_loss(self, T_preds, svf):
        if svf.dim() == 3 and svf.shape[1] == 64:
            svf_grid = svf.transpose(1, 2).reshape(-1, 1, 8, 8)
        else:
            svf_grid = svf

        dT_dx = T_preds[:, :, :, 1:] - T_preds[:, :, :, :-1]
        dT_dy = T_preds[:, :, 1:, :] - T_preds[:, :, :-1, :]
        dSVF_dx = svf_grid[:, :, :, 1:] - svf_grid[:, :, :, :-1]
        dSVF_dy = svf_grid[:, :, 1:, :] - svf_grid[:, :, :-1, :]

        dT_dx_inner = dT_dx[:, :, :-1, :]
        dT_dy_inner = dT_dy[:, :, :, :-1]
        dSVF_dx_inner = dSVF_dx[:, :, :-1, :]
        dSVF_dy_inner = dSVF_dy[:, :, :, :-1]

        dot = dT_dx_inner * dSVF_dx_inner + dT_dy_inner * dSVF_dy_inner
        return torch.mean(dot ** 2)

    def compute_total_loss(self, prediction, targets, svf):
        L_data = self.data_fidelity_loss(prediction['T'], targets['T_obs'])
        L_seb = self.surface_energy_balance_loss(
            prediction['R_net'], prediction['G'], prediction['H'], prediction['LE']
        )
        L_pde = self.heat_equation_pde_loss(
            prediction['T'], prediction['R_net'], prediction['G'], prediction['H'], prediction['LE']
        )
        L_morph = self.morphological_consistency_loss(prediction['T'], svf)

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


# --- Diagnostic Check ---
# Let's inspect what data your dataset is actually holding
print("Dataset size:", len(dataset))
# Depending on how your dataset class stores obs_temp, inspect a sample:
# (If dataset.obs_temp is a tensor, this will show unique values)
if hasattr(dataset, 'obs_temp'):
    print("Sample unique T_obs values:", torch.unique(dataset.obs_temp)[:10])
else:
    # If it fetches via __getitem__, grab the first item's target temperature
    sample_obs = dataset[0][3]  # index 3 is obs_temp based on your dataloader unpacking
    print("First sample obs_temp shape/value:", sample_obs.shape, sample_obs.mean().item())
# ------------------------




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
    for batch, (embs, coords, svf, obs_temp, base_physics) in enumerate(dataloader):
        embs, coords, svf, obs_temp, base_physics = embs.to(device), coords.to(device), svf.to(device), obs_temp.to(device), base_physics.to(device)

        # Compute predsiction error
        preds = model(embs, base_physics)
        targets = {'T_obs': obs_temp}
        loss_dict = loss_fn.compute_total_loss(preds, targets, svf)

        # print(f"Data: {loss_dict['L_data'].item()} | SEB: {loss_dict['L_seb'].item()} | PDE: {loss_dict['L_pde'].item()} | Morph: {loss_dict['L_morph'].item()}")

        loss = loss_dict['total']

        # Backpropagation
        loss.backward()
        if batch % 100 == 0:
            print("Grad check:", model.decoder.decoder[-1].weight.grad.abs().mean().item())
            # Temporary debug block to paste right before loss.backward()
            # print("Main loss requires_grad:", loss.requires_grad)
            # print("SEB requires_grad:", loss_dict['L_seb'].requires_grad)
            # print("PDE requires_grad:", loss_dict['L_pde'].requires_grad)
            # print("Morph requires_grad:", loss_dict['L_morph'].requires_grad)
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)    # gradient clipping
        optimizer.step()
        optimizer.zero_grad()

        # if batch % 100 == 0:
        #     loss_val, current = loss.item(), (batch + 1) * len(embs)
        #     print(f"loss: {loss_val:>7f}  [{current:>5d}/{size:>5d}] | "
        #           f"Data: {loss_dict['L_data'].item():.4f} | "
        #           f"SEB: {loss_dict['L_seb'].item():.4f} | "
        #           f"PDE: {loss_dict['L_pde'].item():.4f} | "
        #           f"Morph: {loss_dict['L_morph'].item():.4f}"
        #     )


        if batch % 100 == 0:
            loss_val, current = loss.item(), (batch + 1) * len(embs)
            print(f"loss: {loss_val:>7f}  [{current:>5d}/{size:>5d}] | "
                  f"Data: {loss_dict['L_data'].item():.6f} | "
                  f"SEB: {loss_dict['L_seb'].item():.6e} | "
                  f"PDE: {loss_dict['L_pde'].item():.6e} | "
                  f"Morph: {loss_dict['L_morph'].item():.6e}"
            )
            with torch.no_grad():
                # Re-compute base physics for this batch to compare
                lst = base_physics[:, 0] # adjust index if base_physics stores scalars differently
                # Or just check the range of the model outputs vs targets
                print(f" | T_pred range: [{preds['T'].min().item():.3f}, {preds['T'].max().item():.3f}]"
                      f" | T_obs range: [{obs_temp.min().item():.3f}, {obs_temp.max().item():.3f}]")

def test(dataloader, model, loss_fn):
    size = len(dataloader.dataset)
    test_loss_accum = {'total': 0.0, 'L_data': 0.0, 'L_seb': 0.0, 'L_pde': 0.0, 'L_morph': 0.0}
    num_batches = len(dataloader)
    model.eval()

    with torch.no_grad():
        for embs, coords, svf, obs_temp, base_physics in dataloader:
            embs, coords, svf, obs_temp, base_physics = embs.to(device), coords.to(device), svf.to(device), obs_temp.to(device), base_physics.to(device)
            preds = model(embs, base_physics)
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

