"""
Key Components
--------------
1. ThermalCNNEncoder       — U-Net-style CNN for thermal patches
2. MeteoLSTMEncoder         — LSTM for sequential weather data
3. DeepONetMorphologyBranch — DeepONet for coordinate + SVF features
4. CrossModalFusion         — Multi-head cross-attention fusion
5. MultiHeadDecoder         — Predicts T, R_net, G, H, LE
6. PIHDC (full model)       — End-to-end model wrapping all above
7. PhysicsInformedLoss      — L_data, L_seb, L_pde, L_morph
8. train_one_epoch()        — Sample training-loop skeleton

"""

# ═══════════════════════════════════════════════════════════════════════
#                        IMPORTS & CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════

import torch
import torch.nn as nn
import torch.nn.functional as F

from typing import Dict, Tuple, Optional

# ── Reproducibility ──────────────────────────────────────────────────
torch.manual_seed(42)

# ── Global hyper-parameters (easy to tweak) ─────────────────────────
CONFIG = {
    # Thermal patch dimensions
    "thermal_channels": 1,  # ig its the number of features we input
    "thermal_h": 128,   # depends on spatial resolution of data we chose
    "thermal_w": 128,   # ye bhi

    # CNN encoder
    "cnn_base_channels": 32,       # channels in first conv layer
    "cnn_embed_dim": 256,          # output feature channels

    # Meteorological LSTM
    "meteo_time_steps": 24,        # e.g., 24 hourly steps  # depends on the temporal resolution of data we chose
    "meteo_features": 6,           # e.g., T_air, RH, wind, pressure, solar, precip # no. of features i suppose
    "lstm_hidden_dim": 128,
    "lstm_num_layers": 2,

    # DeepONet Morphology
    "deepon_trunk_dim": 128,       # output dim of coordinate trunk net
    "deepon_branch_dim": 64,       # output dim of SVF branch net
    "deepon_embed_dim": 64,        # final morphology embedding dim

    # Fusion
    "fusion_d_model": 128,         # common projection dim for attention

    # Decoder
    "decoder_hidden": 256,         # hidden channels in decoder convs
    "decoder_outputs": 5,          # T, R_net, G, H, LE

    # Physics (FIXED PHY CONSTANTS - BUT I DONT KNOW WHAT THEY ARE LOL)
    "thermal_diffusivity": 0.5e-6, # alpha for heat equation [m²/s] (typical urban)
    "rho_cp_d": 1.2e6,             # volumetric heat capacity * depth [J/(m²·K)]

    # Grid
    "spatial_grid": 8, # CAN VARY            # 8×8 coarse grid for DeepONet / decoder
    "num_collocation_pts": 64,     # 8×8 = 64 points    # depends on spatial_grid

    # Loss weights (HYPERPARAMETERS)
    "w_data": 1.0,
    "w_seb": 0.5,
    "w_pde": 0.3,
    "w_morph": 0.1,
}

# ========================================================================
# 1. THERMAL CNN ENCODER
# ========================================================================

class ThermalCNNEncoder(nn.Module):
    """
    Processes thermal satellite imagery patches.
    Input: [B, 1, 128, 128] grayscale thermal image     # AGAIN, THESE TENSOR SHAPES CAN BE CHANGED
    Output: [B, 256, 8, 8] spatial feature map
    """

    def __init__(self, in_channels=1, base_ch=32, out_ch=256):
        super().__init__()
        # Encoder path (downsampling)
        self.enc1 = self._block(in_channels, base_ch)      # [B, 32, 64, 64]
        self.enc2 = self._block(base_ch, base_ch*2)         # [B, 64, 32, 32]
        self.enc3 = self._block(base_ch*2, base_ch*4)       # [B, 128, 16, 16]
        self.enc4 = self._block(base_ch*4, out_ch)          # [B, 256, 8, 8]
        self.pool = nn.MaxPool2d(2)

    def _block(self, in_ch, out_ch):
        return nn.Sequential(
            nn.Conv2d(in_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),  # inplace true why?
            nn.Conv2d(out_ch, out_ch, 3, padding=1),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )

    def forward(self, x):
        # x: [B, 1, 128, 128]
        x1 = self.pool(self.enc1(x))  # [B, 32, 64, 64]
        x2 = self.pool(self.enc2(x1)) # [B, 64, 32, 32]
        x3 = self.pool(self.enc3(x2)) # [B, 128, 16, 16]
        x4 = self.pool(self.enc4(x3)) # [B, 256, 8, 8]
        return x4

# ========================================================================
# 2. METEOROLOGICAL LSTM ENCODER
# ========================================================================

class MeteoLSTMEncoder(nn.Module):
    """
    Processes sequential weather data.
    Input: [B, T, F] where T=time steps, F=weather features
    Output: [B, hidden_dim] temporal context vector
    """

    def __init__(self, input_dim=6, hidden_dim=128, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.1 if num_layers > 1 else 0.0
        )
        self.fc = nn.Linear(hidden_dim, hidden_dim)

    def forward(self, x):
        assert x.dim() == 3, f"Meteo input must be 3D [B, T, F], got {x.shape}"
        # lstm_out: [B, T, hidden_dim], (h_n, c_n): hidden states
        _, (h_n, _) = self.lstm(x)
        # Take the top layer's final hidden state
        final_hidden = h_n[-1]  # [B, hidden_dim]
        out = F.relu(self.fc(final_hidden))
        return out  # [B, 128]

# ========================================================================
# 3. URBAN MORPHOLOGY DEEPONET BRANCH
# ========================================================================

class DeepONetMorphologyBranch(nn.Module):
    """
    DeepONet architecture for morphology-aware spatial features.
    Trunk net: processes (x, y, t) coordinates
    Branch net: processes SVF values
    Output: [B, N, embed_dim] morphology embeddings at N points
    """

    def __init__(self, coord_dim=3, svf_dim=1, trunk_dim=128, branch_dim=64, embed_dim=64):     #svf dim is basically no. of feas and it can be changed
        super().__init__()
        self.trunk_net = nn.Sequential(
            nn.Linear(coord_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 128),
            nn.ReLU(),
            nn.Linear(128, embed_dim)
        )
        self.branch_net = nn.Sequential(
            nn.Linear(svf_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 64),
            nn.ReLU(),
            nn.Linear(64, embed_dim)
        )

    def forward(self, coords, svf):
        # coords: [B, N, 3], svf: [B, N, 1]
        trunk_out = self.trunk_net(coords)   # [B, N, embed_dim]
        branch_out = self.branch_net(svf)    # [B, N, embed_dim]
        # Classic DeepONet: element-wise product
        output = trunk_out * branch_out       # [B, N, embed_dim]
        return output

# ========================================================================
# 4. MULTI-MODAL CROSS-ATTENTION FUSION
# ========================================================================

class CrossModalFusion(nn.Module):
    """
    Fuses CNN spatial features, LSTM temporal features, and DeepONet
    morphology features using cross-attention.
    """

    def __init__(self, cnn_dim, lstm_dim, deepon_dim, d_model=128, nhead=4):
        super().__init__()
        self.d_model = d_model
        self.nhead = nhead

        # Project each modality to common dimension
        self.proj_cnn = nn.Linear(cnn_dim, d_model)
        self.proj_lstm = nn.Linear(lstm_dim, d_model)
        self.proj_deepon = nn.Linear(deepon_dim, d_model)

        # Multi-head self-attention over all tokens
        self.attention = nn.MultiheadAttention(d_model, nhead, batch_first=True)

        # Layer norm and feed-forward
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_model * 4),
            nn.GELU(),
            nn.Linear(d_model * 4, d_model)
        )

        self.n_cnn_tokens = 64  # 8x8 grid

    def forward(self, cnn_feat, lstm_feat, deepon_feat):
        # cnn_feat: [B, 256, 8, 8]
        # lstm_feat: [B, 128]
        # deepon_feat: [B, 64, 64]

        B = cnn_feat.shape[0]

        # Reshape CNN to tokens: [B, 64, 256]
        cnn_tokens = cnn_feat.flatten(2).transpose(1, 2)

        # Expand LSTM to token: [B, 1, 128]
        lstm_token = lstm_feat.unsqueeze(1)

        # DeepONet tokens: [B, 64, 64]
        deepon_token = deepon_feat.unsqueeze(1)

        # Project to common dim
        cnn_tokens = self.proj_cnn(cnn_tokens)      # [B, 64, d_model]
        lstm_token = self.proj_lstm(lstm_token)      # [B, 1, d_model]
        deepon_tokens = self.proj_deepon(deepon_token) # [B, 64, d_model]

        # Concatenate: [B, 129, d_model]
        all_tokens = torch.cat([cnn_tokens, lstm_token, deepon_tokens], dim=1)

        # Self-attention
        attn_out, _ = self.attention(all_tokens, all_tokens, all_tokens)
        all_tokens = self.norm1(all_tokens + attn_out)  # residual

        # FFN
        ffn_out = self.ffn(all_tokens)
        all_tokens = self.norm2(all_tokens + ffn_out)  # residual

        # Extract CNN tokens (first 64) - these carry spatial info enriched with all modalities
        spatial_tokens = all_tokens[:, :self.n_cnn_tokens, :]  # [B, 64, d_model]

        return spatial_tokens

# ========================================================================
# 5. MULTI-HEAD DECODER
# ========================================================================

class MultiHeadDecoder(nn.Module):
    """
    Decodes fused representation into:
    - T(x,y,t): temperature prediction
    - R_net: net radiation
    - G: soil heat flux
    - H: sensible heat flux
    - LE: latent heat flux
    """

    def __init__(self, in_dim, hidden_dim, out_channels=5, grid_size=8):
        super().__init__()
        self.grid_size = grid_size

        self.decoder = nn.Sequential(
            # Reshape to [B, in_dim, grid, grid] then conv
            nn.Conv2d(in_dim, hidden_dim, 3, padding=1),
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU(),
            nn.Conv2d(hidden_dim, hidden_dim, 3, padding=1),
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU(),
            nn.Conv2d(hidden_dim, out_channels, 1),  # 1x1 conv to get output channels
        )

    def forward(self, spatial_tokens):
        # spatial_tokens: [B, 64, d_model]
        B = spatial_tokens.shape[0]

        # Reshape to spatial grid: [B, d_model, 8, 8]
        x = spatial_tokens.transpose(1, 2).reshape(B, -1, self.grid_size, self.grid_size)

        # Conv decoder: [B, d_model, 8, 8] → [B, 5, 8, 8]
        out = self.decoder(x)

        return out  # [B, 5, 8, 8]

# ========================================================================
# 6. COMPLETE PIHDC MODEL
# ========================================================================

class PIHDC(nn.Module):
    """
    Complete Physics-Informed Heat Dynamics Core model.
    Combines all encoders, fusion, and decoder.
    """

    def __init__(self, config=None):
        super().__init__()
        cfg = config or CONFIG

        # Encoders
        self.thermal_encoder = ThermalCNNEncoder(
            in_channels=cfg["thermal_channels"],
            base_ch=cfg["cnn_base_channels"],
            out_ch=cfg["cnn_embed_dim"]
        )

        self.meteo_encoder = MeteoLSTMEncoder(
            input_dim=cfg["meteo_features"],
            hidden_dim=cfg["lstm_hidden_dim"],
            num_layers=cfg["lstm_num_layers"]
        )

        self.morphology_encoder = DeepONetMorphologyBranch(
            coord_dim=3,  # x, y, t
            svf_dim=1,
            trunk_dim=cfg["deepon_trunk_dim"],
            branch_dim=cfg["deepon_branch_dim"],
            embed_dim=cfg["deepon_embed_dim"]
        )

        # Fusion
        self.fusion = CrossModalFusion(
            cnn_dim=cfg["cnn_embed_dim"],
            lstm_dim=cfg["lstm_hidden_dim"],
            deepon_dim=cfg["deepon_embed_dim"],
            d_model=cfg["fusion_d_model"],
            nhead=4
        )

        # Decoder
        self.decoder = MultiHeadDecoder(
            in_dim=cfg["fusion_d_model"],
            hidden_dim=cfg["decoder_hidden"],
            out_channels=cfg["decoder_outputs"],
            grid_size=cfg["spatial_grid"]
        )

    def forward(self, thermal_patch, meteo_seq, coords, svf):
        """
        thermal_patch: [B, 1, 128, 128]
        meteo_seq: [B, T, F]
        coords: [B, N, 3] with requires_grad=True for PDE loss
        svf: [B, N, 1]

        Returns: dict with:
            'T': [B, 5, 8, 8] (first channel is temperature)
            'R_net', 'G', 'H', 'LE': each [B, 8, 8]
        """
        # Encode each modality
        cnn_feat = self.thermal_encoder(thermal_patch)       # [B, 256, 8, 8]
        lstm_feat = self.meteo_encoder(meteo_seq)            # [B, 128]
        deepon_feat = self.morphology_encoder(coords, svf)   # [B, 64, 64]

        # Fuse
        spatial_tokens = self.fusion(cnn_feat, lstm_feat, deepon_feat)  # [B, 64, 128]

        # Decode
        outputs = self.decoder(spatial_tokens)               # [B, 5, 8, 8]

        return {
            'output': outputs,          # [B, 5, 8, 8]
            'T': outputs[:, 0:1, :, :], # [B, 1, 8, 8]
            'R_net': outputs[:, 1:2, :, :],
            'G': outputs[:, 2:3, :, :],
            'H': outputs[:, 3:4, :, :],
            'LE': outputs[:, 4:5, :, :],
        }

# ========================================================================
# 7. PHYSICS-INFORMED LOSS FUNCTIONS
# ========================================================================

class PIHDCLoss:
    """
    Computes all physics-informed loss components:
    - L_data: Data fidelity (MSE on temperature)
    - L_seb: Surface energy balance (R_net = G + H + LE)
    - L_pde: Heat equation residual (dT/dt - alpha*Lap(T) - S = 0)
    - L_morph: Morphological consistency (T gradient vs SVF)
    """

    def __init__(self, config=None):
        cfg = config or CONFIG
        self.alpha = cfg["thermal_diffusivity"]
        self.rho_cp_d = cfg["rho_cp_d"]
        self.w_data = cfg["w_data"]
        self.w_seb = cfg["w_seb"]
        self.w_pde = cfg["w_pde"]
        self.w_morph = cfg["w_morph"]

    def data_fidelity_loss(self, T_pred, T_obs):
        """
        MSE between predicted and observed LST.
        T_pred: [B, 1, 8, 8] or [B, 8, 8]
        T_obs: [B, 1, 8, 8] or [B, 8, 8]
        """
        return F.mse_loss(T_pred, T_obs)

    def surface_energy_balance_loss(self, R_net, G, H, LE):
        """
        Enforce: R_net = G + H + LE
        All inputs: [B, 1, 8, 8]
        """
        residual = R_net - G - H - LE
        return torch.mean(residual ** 2)

    def heat_equation_pde_loss(self, T_pred, coords, R_net, G, H, LE):
        """
        Enforce: ∂T/∂t - α∇²T - S = 0
        where S = (R_net - G - H - LE) / (ρ·cp·d)

        T_pred: [B, 1, 8, 8] → flatten to [B, 64]
        coords: [B, 64, 3] with requires_grad=True
        """
        B, N, _ = coords.shape

        # Flatten T to [B, N]
        T_flat = T_pred.reshape(B, N)

        # Compute source term from SEB
        S = (R_net.reshape(B, N) - G.reshape(B, N) - H.reshape(B, N) - LE.reshape(B, N)) / self.rho_cp_d

        # First derivatives using autograd
        ones = torch.ones_like(T_flat)
        dT_dcoords = torch.autograd.grad(
            T_flat, coords, grad_outputs=ones,
            create_graph=True, retain_graph=True
        )[0]  # [B, N, 3]

        dT_dx = dT_dcoords[:, :, 0]
        dT_dy = dT_dcoords[:, :, 1]
        dT_dt = dT_dcoords[:, :, 2]

        # Second derivatives for Laplacian
        d2T_dx2 = torch.autograd.grad(
            dT_dx, coords, grad_outputs=ones,
            create_graph=True, retain_graph=True
        )[0][:, :, 0]

        d2T_dy2 = torch.autograd.grad(
            dT_dy, coords, grad_outputs=ones,
            create_graph=True, retain_graph=True
        )[0][:, :, 1]

        laplacian_T = d2T_dx2 + d2T_dy2

        # PDE residual: ∂T/∂t - α∇²T - S = 0
        residual = dT_dt - self.alpha * laplacian_T - S

        return torch.mean(residual ** 2)

    def morphological_consistency_loss(self, T_pred, svf):
        """
        Penalize positive correlation between T and SVF gradients.
        High SVF (open sky) → lower T (more cooling)

        T_pred: [B, 1, 8, 8]
        svf: [B, 64, 1] → reshape to [B, 1, 8, 8]
        """
        svf_grid = svf.transpose(1, 2).reshape(-1, 1, 8, 8)

        # Finite difference gradients
        dT_dx = T_pred[:, :, :, 1:] - T_pred[:, :, :, :-1]
        dT_dy = T_pred[:, :, 1:, :] - T_pred[:, :, :-1, :]
        dSVF_dx = svf_grid[:, :, :, 1:] - svf_grid[:, :, :, :-1]
        dSVF_dy = svf_grid[:, :, 1:, :] - svf_grid[:, :, :-1, :]

        # Compute dot product of gradients (where both defined)
        # Resize to common shape
        # min_h = min(dT_dx.shape[2], dSVF_dx.shape[2])
        # min_w = min(dT_dx.shape[3], dSVF_dx.shape[3])

        # dT_dx = dT_dx[:, :, :min_h, :min_w]
        # dT_dy = dT_dy[:, :, :min_h, :min_w]
        # dSVF_dx = dSVF_dx[:, :, :min_h, :min_w]
        # dSVF_dy = dSVF_dy[:, :, :min_h, :min_w]

        dT_dx = dT_dx[:, :, :7, :7]
        dT_dy = dT_dy[:, :, :7, :7]
        dSVF_dx = dSVF_dx[:, :, :7, :7]
        dSVF_dy = dSVF_dy[:, :, :7, :7]

        # Dot product: should be negative (T decreases when SVF increases)
        dot = dT_dx * dSVF_dx + dT_dy * dSVF_dy

        # Penalize positive dot product
        return torch.mean(torch.relu(dot) ** 2)

    def compute_total_loss(self, predictions, targets, coords, svf):
        """
        predictions: dict from PIHDC forward pass
        targets: dict with 'T_obs' (observed temperature)
        coords: [B, N, 3] with requires_grad=True
        svf: [B, N, 1]
        """
        # Individual losses
        L_data = self.data_fidelity_loss(predictions['T'], targets['T_obs'])
        L_seb = self.surface_energy_balance_loss(
            predictions['R_net'], predictions['G'],
            predictions['H'], predictions['LE']
        )
        L_pde = self.heat_equation_pde_loss(
            predictions['T'], coords,
            predictions['R_net'], predictions['G'],
            predictions['H'], predictions['LE']
        )
        L_morph = self.morphological_consistency_loss(predictions['T'], svf)

        # Weighted total
        total = (self.w_data * L_data + self.w_seb * L_seb + self.w_pde * L_pde + self.w_morph * L_morph)

        return {
            'total': total,
            'L_data': L_data,
            'L_seb': L_seb,
            'L_pde': L_pde,
            'L_morph': L_morph,
        }

# ========================================================================
# 8. SAMPLE TRAINING LOOP
# ========================================================================

def train_one_epoch(model, dataloader, optimizer, loss_fn, device, epoch):
    """..."""

    model.train()

    epoch_losses = {k: 0.0 for k in ['total', 'L_data', 'L_seb', 'L_pde', 'L_morph']}

    for batch_idx, batch in enumerate(dataloader):
        # Unpack batch
        thermal_patch = batch['thermal_patch'].to(device)
        meteo_seq = batch['meteo_seq'].to(device)
        coords = batch['coords'].to(device)
        svf = batch['svf'].to(device)
        T_obs = batch['T_obs'].to(device)

        # CRITICAL: Enable gradient tracking on coordinates for PDE loss
        coords.requires_grad_(True)

        # Forward pass
        predictions = model(thermal_patch, meteo_seq, coords, svf)

        # Compute losses
        targets = {'T_obs': T_obs}
        losses = loss_fn.compute_total_loss(predictions, targets, coords, svf)

        # Backward pass
        optimizer.zero_grad()
        losses['total'].backward()
        optimizer.step()

        # Accumulate losses
        for k in epoch_losses:
            epoch_losses[k] += losses[k].item()

    # Average over batches
    n_batches = len(dataloader)
    for k in epoch_losses:
        epoch_losses[k] /= n_batches

    return epoch_losses




def generate_dummy_data(batch_size=4, device='cpu'):
    """Generate dummy data for testing model shapes."""
    cfg = CONFIG

    data = {
        'thermal_patch': torch.randn(batch_size, cfg['thermal_channels'], cfg['thermal_h'], cfg['thermal_w']),
        'meteo_seq': torch.randn(batch_size, cfg['meteo_time_steps'], cfg['meteo_features']),
        'coords': torch.rand(batch_size, cfg['num_collocation_pts'], 3),
        # coords: x in [0,1], y in [0,1], t in [0,1] (normalized)
        'svf': torch.rand(batch_size, cfg['num_collocation_pts'], 1) * 0.5 + 0.2,
        # SVF in [0.2, 0.7] (typical urban range)
        'T_obs': torch.randn(batch_size, 1, cfg['spatial_grid'], cfg['spatial_grid']) * 10 + 305,
        # T_obs in ~[295, 315] K (typical LST range)
    }

    return {k: v.to(device) for k, v in data.items()}



def test_model_shapes():
    """Test all tensor shapes through the model."""
    device = 'cpu'

    print("=" * 60)
    print("  PIHDC SHAPE VERIFICATION TEST")
    print("=" * 60)

    # Create model
    model = PIHDC().to(device)
    loss_fn = PIHDCLoss()

    # Generate dummy data
    data = generate_dummy_data(batch_size=4, device=device)

    print(f"\n[Input Shapes]")
    print(f"  thermal_patch: {data['thermal_patch'].shape}")
    print(f"  meteo_seq:     {data['meteo_seq'].shape}")
    print(f"  coords:        {data['coords'].shape}")
    print(f"  svf:           {data['svf'].shape}")
    print(f"  T_obs:         {data['T_obs'].shape}")

    # Enable grad on coords
    data['coords'].requires_grad_(True)

    # Forward pass
    print(f"\n[Forward Pass]")
    predictions = model(data['thermal_patch'], data['meteo_seq'],
                        data['coords'], data['svf'])

    for k, v in predictions.items():
        print(f"  {k}: {v.shape}")

    # Test losses
    print(f"\n[Loss Computation]")
    targets = {'T_obs': data['T_obs']}
    losses = loss_fn.compute_total_loss(predictions, targets, data['coords'], data['svf'])

    for k, v in losses.items():
        print(f"  {k}: {v.item():.6f}")

    # Test backward
    print(f"\n[Backward Pass]")
    losses['total'].backward()
    print(f"  Backward pass successful!")

    # Check gradients
    for name, param in model.named_parameters():
        if param.grad is not None:
            print(f"  {name}: grad norm = {param.grad.norm().item():.6f}")

    print(f"\n{'=' * 60}")
    print(f"  ALL TESTS PASSED ✓")
    print(f"{'=' * 60}")



# ========================================================================
# 8. EXECUTION / TEST WRAPPER (How to run it)
# ========================================================================
if __name__ == "__main__":
    print("=" * 60)
    print(" RUNNING TAPAS PIHDC MODULE TEST")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # 1. Initialize model and loss function
    model = PIHDC().to(device)
    loss_fn = PIHDCLoss()

    # 2. Create mock/dummy inputs matching your team's upcoming tensor contract
    batch_size = 2
    N_pts = 64

    thermal_patch = torch.randn(batch_size, 1, 128, 128, device=device)
    meteo_seq     = torch.randn(batch_size, 24, 6, device=device) # 24 time steps, 6 weather features
    coords        = torch.randn(batch_size, N_pts, 3, device=device) # x, y, t coordinates
    svf           = torch.randn(batch_size, N_pts, 1, device=device) # Sky View Factor
    T_obs         = torch.randn(batch_size, 1, 8, 8, device=device)  # Ground-truth temperature map

    # Enable gradients for PINN spatial-temporal tracking
    coords.requires_grad_(True)

    # 3. Forward Pass
    print("\nExecuting Forward Pass...")
    preds = model(thermal_patch, meteo_seq, coords, svf)
    print("Predictions output map shapes:")
    for key, val in preds.items():
        print(f"  - {key}: {val.shape}")

    # 4. Loss and Backward Pass (Testing autograd physics constraints)
    print("\nComputing Physics Losses & Backward Pass...")
    targets = {'T_obs': T_obs}
    losses = loss_fn.compute_total_loss(preds, targets, coords, svf)

    for loss_name, loss_val in losses.items():
        print(f"  - {loss_name}: {loss_val.item():.4f}")

    losses['total'].backward()
    print("\n Backward pass executed successfully with zero errors!")
    print("=" * 60)

