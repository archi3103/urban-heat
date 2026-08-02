import os
import glob
import pandas as pd
import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
import torch.nn as nn

# vars
met_folder_path = 'dataset/met_feat/'
urban_folder_path = 'dataset/osm_features_100x100.csv'


met_files = sorted(glob.glob(os.path.join(met_folder_path, "*.csv")))

dfs = [pd.read_csv(f) for f in met_files]

feature_cols = [c for c in dfs[0].columns if c not in ['grid_id', 'date']]
grid_ids = dfs[0]['grid_id'].values

num_grids = len(grid_ids)
num_days = len(met_files)
num_features = len(feature_cols)

# master array: (Num_Grids, Time_Steps, Num_Features)
master_tensor = np.zeros((num_grids, num_days, num_features), dtype=np.float32)

for day_idx, df in enumerate(dfs):
    df_sorted = df.sort_values('grid_id')
    master_tensor[:, day_idx, :] = df_sorted[feature_cols].values

np.save('ahmedabad_90days_tensor_final.npy', master_tensor)
print(f"shape: {master_tensor.shape}")


