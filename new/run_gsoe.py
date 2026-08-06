import numpy as np
import torch
import torch.nn as nn
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.optimize import minimize
from pymoo.core.problem import ElementwiseProblem
from pihdc import TabularPINNDataset

# --- 1. Load Dataset & Pick a Sample Grid Cell ---
met_folder_path = 'dataset/'
dataset = TabularPINNDataset(met_folder_path)
sample_features, sample_target = dataset[0]
base_temp = sample_target.item()
print(f"Loaded Sample Grid Cell. Base Temperature: {base_temp:.4f}")

# --- 2. Define Direct GSOE Multi-Objective Problem for Testing ---
class DirectGSOEProblem(ElementwiseProblem):
    def __init__(self, base_temp):
        # 3 decision variables: [Delta_Albedo, Delta_NDVI, Delta_Qf_Reduction]
        super().__init__(n_var=3, n_obj=2, n_constr=0,
                         xl=np.array([0.0, 0.0, 0.0]),
                         xu=np.array([0.5, 0.4, 30.0]))
        self.base_temp = base_temp

    def _evaluate(self, x, out, *args, **kwargs):
        delta_albedo, delta_ndvi, delta_qf = x

        # Physics-inspired mock relationship
        # More albedo & NDVI, and higher Qf reduction = more cooling (lower temperature)
        cooling = (delta_albedo * 0.4) + (delta_ndvi * 0.5) + (delta_qf * 0.01)

        # Objective 1: Minimize negative cooling (so we maximize cooling)
        f1 = -cooling

        # Objective 2: Minimize cost/effort proxy (higher interventions cost more)
        f2 = (delta_albedo * 2.0) + (delta_ndvi * 5.0) + (delta_qf * 0.1)

        out["F"] = np.array([f1, f2], dtype=float)

# --- 3. Run NSGA-II Optimization ---
problem = DirectGSOEProblem(base_temp)
algorithm = NSGA2(pop_size=40)

print("Running NSGA-II Optimization...")
res = minimize(problem,
               algorithm,
               termination=("n_gen", 20),
               seed=42,
               verbose=False)

# --- 4. Print Results ---
print("\n" + "="*75)
print(" SUCCESSFUL GSOE PARETO-RANKED PORTFOLIO (MOCK TEST) ")
print("="*75)
print(f"{'Action Vector [ΔAlbedo, ΔNDVI, ΔQf_Red]':<38} | {'Cooling Achieved (Obj 1)':<24} | {'Cost Proxy (Obj 2)'}")
print("-" * 75)

for action, objectives in zip(res.X, res.F):
    action_str = f"[{action[0]:.2f}, {action[1]:.2f}, {action[2]:.1f}]"
    cooling_val = -objectives[0]  # Flip back to positive cooling
    cost_val = objectives[1]
    print(f"{action_str:<38} | {cooling_val:.6f}                 | {cost_val:.4f}")

print("-" * 75)