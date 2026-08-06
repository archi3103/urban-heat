import os
import glob
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader, Subset

torch.manual_seed(42)

# --- Configuration & Variables ---
met_folder_path = 'dataset/'  # Path to your daily CSV folder
batch_size = 256
learning_rate = 1e-3
num_epochs = 5

class TabularPINNDataset(Dataset):
    def __init__(self, folder_path):
        self.met_files = sorted(glob.glob(os.path.join(folder_path, "Ahmedabad_Daily_*.csv")))
        print(f"Found {len(self.met_files)} daily CSV files!")

        sample_df = pd.read_csv(self.met_files[0])
        sample_df.columns = sample_df.columns.str.strip().str.lstrip(',')
        self.num_grids = len(sample_df)
        self.num_days = len(self.met_files)

    def __len__(self):
        return self.num_grids * self.num_days

    def __getitem__(self, idx):
        day_idx = idx // self.num_grids
        grid_idx = idx % self.num_grids

        df_day = pd.read_csv(self.met_files[day_idx])
        df_day.columns = df_day.columns.str.strip().str.lstrip(',')
        row = df_day.iloc[grid_idx]

        # Helper to safely extract values
        def safe_val(col_name, scale=1.0):
            val = row.get(col_name, 0.0)
            if pd.isna(val):
                return 0.0
            return float(val) / scale

        lon = safe_val('EE_Lon')
        lat = safe_val('EE_Lat')
        albedo = safe_val('Albedo')
        ndvi = safe_val('NDVI')

        # Kept at scale=1.0 to preserve true W/m² energy units for physics equations
        r_net = safe_val('R_net_flux', 1.0)
        g_flux = safe_val('heat_storage', 1.0)
        h_flux = safe_val('H_flux', 1.0)
        le_flux = safe_val('LE_flux', 1.0)

        # Scale urban heat potential proxy into a realistic local W/m² anthropogenic range (0 to 50 W/m²)
        uhp_raw = row.get('urban_heat_potential', 0.0)
        q_f = 0.0 if pd.isna(uhp_raw) else float(uhp_raw) * 50.0

        lst = row.get('LST_Avg_C', 30.0)
        if pd.isna(lst):
            lst = 30.0
        norm_temp = (lst - 20.0) / (50.0 - 20.0)
        norm_temp = np.clip(norm_temp, 0.0, 1.0)

        # Extract SVF proxy from CSV row
        svf = safe_val('SVF_proxy', 1.0)

        # Pack features (including SVF for morphological loss)
        features = np.array([
            lon, lat, albedo, ndvi, r_net, g_flux, h_flux, le_flux, q_f, svf, float(day_idx)
        ], dtype=np.float32)

        features = np.nan_to_num(features, nan=0.0)
        target = np.array([norm_temp], dtype=np.float32)

        return torch.tensor(features), torch.tensor(target)


# --- 2. MLP PINN Architecture ---
class TabularPINN(nn.Module):
    def __init__(self, in_dim=11, hidden_dim=128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 6) # Outputs: [T, R_net, Q_f, G, H, LE]
        )

    def forward(self, x):
        preds = self.net(x)
        return {
            'T': preds[:, 0:1],
            'R_net': preds[:, 1:2],
            'Q_f': preds[:, 2:3],
            'G': preds[:, 3:4],
            'H': preds[:, 4:5],
            'LE': preds[:, 5:6]
        }

class TabularPINNLoss:
    def __init__(self):
        self.alpha = 0.01          # Thermal diffusivity coefficient
        self.rho_cp_d = 1.0
        self.w_data = 1.0
        self.w_seb = 1.0
        self.w_pde = 10.0           # Weight for heat equation PDE
        self.w_morph = 1.0         # Weight for morphological consistency

    def data_fidelity_loss(self, T_pred, T_obs):
        return torch.sqrt(torch.clamp(F.mse_loss(T_pred, T_obs), min=1e-8))

    def surface_energy_balance_loss(self, R_net, Q_f, G, H, LE):
        residual = (R_net + Q_f) - (G + H + LE)
        return torch.mean(residual ** 2)

    def heat_equation_pde_loss(self, T, coords, R_net, Q_f, G, H, LE):
        S = ((R_net + Q_f) - (G + H + LE)) / self.rho_cp_d

        dT_coords = torch.autograd.grad(
            outputs=T.sum(),
            inputs=coords,
            create_graph=True,
            retain_graph=True
        )[0]

        dT_dx = dT_coords[:, 0:1]
        dT_dy = dT_coords[:, 1:2]

        d2T_dx2 = torch.autograd.grad(outputs=dT_dx.sum(), inputs=coords, create_graph=True, retain_graph=True)[0][:, 0:1]
        d2T_dy2 = torch.autograd.grad(outputs=dT_dy.sum(), inputs=coords, create_graph=True, retain_graph=True)[0][:, 1:2]

        laplacian_T = d2T_dx2 + d2T_dy2

        pde_residual = - (self.alpha * laplacian_T) - S
        return torch.mean(pde_residual ** 2)

    def morphological_consistency_loss(self, T, coords, svf):
        dT_coords = torch.autograd.grad(
            outputs=T.sum(),
            inputs=coords,
            create_graph=True,
            retain_graph=True
        )[0]

        dT_dx = dT_coords[:, 0:1]
        dT_dy = dT_coords[:, 1:2]

        dSVF_coords = torch.autograd.grad(
            outputs=svf.sum(),
            inputs=coords,
            create_graph=True,
            retain_graph=True
        )[0]

        dSVF_dx = dSVF_coords[:, 0:1]
        dSVF_dy = dSVF_coords[:, 1:2]

        dot = (dT_dx * dSVF_dx) + (dT_dy * dSVF_dy)
        return torch.mean(dot ** 2)

    def compute_total_loss(self, preds, targets, features, svf):
        L_data = self.data_fidelity_loss(preds['T'], targets['T_obs'])
        L_seb = self.surface_energy_balance_loss(
            preds['R_net'], preds['Q_f'], preds['G'], preds['H'], preds['LE']
        )
        L_pde = self.heat_equation_pde_loss(
            preds['T'], features, preds['R_net'], preds['Q_f'], preds['G'], preds['H'], preds['LE']
        )
        L_morph = self.morphological_consistency_loss(preds['T'], features, svf)

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

# --- 4. Training Pipeline ---
dataset = TabularPINNDataset(met_folder_path)
print("Dataset size:", len(dataset))

indices = torch.randperm(len(dataset)).tolist()
train_size = int(0.8 * len(dataset))

train_indices = indices[:train_size]
test_indices = indices[train_size:]

train_dataset = Subset(dataset, train_indices)
test_dataset = Subset(dataset, test_indices)

train_dataloader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
test_dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

# device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
# print(device)

# model = TabularPINN().to(device)
# criterion = TabularPINNLoss()
# optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

def train(dataloader, model, loss_fn, optimizer):
    model.train()
    for batch, (features, targets) in enumerate(dataloader):
        features = features.clone().detach().to(device).requires_grad_(True)
        targets = targets.to(device)

        svf = features[:, 9:10]

        preds = model(features)
        loss_dict = loss_fn.compute_total_loss(preds, {'T_obs': targets}, features, svf)
        loss = loss_dict['total']

        loss.backward()
        optimizer.step()
        optimizer.zero_grad()

        if batch % 100 == 0:
            print(f"loss: {loss.item():.6f} | Data: {loss_dict['L_data'].item():.6f} | "
                  f"SEB: {loss_dict['L_seb'].item():.6e} | PDE: {loss_dict['L_pde'].item():.6e} | "
                  f"Morph: {loss_dict['L_morph'].item():.6e}")

def test(dataloader, model, loss_fn):
    model.eval()
    test_loss_accum = {'total': 0.0, 'L_data': 0.0, 'L_seb': 0.0, 'L_pde': 0.0, 'L_morph': 0.0}
    num_batches = len(dataloader)

    with torch.no_grad():
        for features, targets in dataloader:
            features = features.clone().detach().to(device).requires_grad_(True)
            targets = targets.to(device)

            svf = features[:, 9:10]

            preds = model(features)
            loss_dict = loss_fn.compute_total_loss(preds, {'T_obs': targets}, features, svf)

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

# for epoch in range(num_epochs):
#     print(f"--- Epoch {epoch+1}/{num_epochs} ---")
#     train(train_dataloader, model, criterion, optimizer)
#     test(test_dataloader, model, criterion)


# # --- Save Model Checkpoint (ADD IT HERE) ---
# os.makedirs('saved_models', exist_ok=True)
# model_save_path = 'saved_models/pinn_ahmedabad_1.pth'

# torch.save({
#     'epoch': num_epochs,
#     'model_state_dict': model.state_dict(),
#     'optimizer_state_dict': optimizer.state_dict(),
# }, model_save_path)

# print(f"Model weights successfully saved to {model_save_path}!")



# --- Wrap the execution logic at the very bottom of pihdc.py ---
if __name__ == "__main__":
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(device)

    model = TabularPINN().to(device)
    criterion = TabularPINNLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)

    for epoch in range(num_epochs):
        print(f"--- Epoch {epoch+1}/{num_epochs} ---")
        train(train_dataloader, model, criterion, optimizer)
        test(test_dataloader, model, criterion)

    # Save Checkpoint
    os.makedirs('saved_models', exist_ok=True)
    model_save_path = 'saved_models/tabular_pinn_ahmedabad.pth'
    torch.save({
        'epoch': num_epochs,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }, model_save_path)
    print(f"Model weights successfully saved to {model_save_path}!")