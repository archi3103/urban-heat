import numpy as np
embs = np.load('final_emb_new.npy')
print("Are there NaNs in embeddings:", np.isnan(embs).any())
print("Are there Infs in embeddings:", np.isinf(embs).any())
print("Min value:", np.nanmin(embs), "Max value:", np.nanmax(embs))