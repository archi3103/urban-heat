"""
gsoe_optimization.py
=====================
pymoo integration for the TAPAS GSOE. Wraps a single-sample GSOEEvaluator
into a multi-objective problem solvable with NSGA-II, treating the
intervention Action Vector as the decision variable.

Objectives (both minimized, per pymoo convention):
    f1 = -delta_t_mean        (maximize mean cooling  == minimize its negative)
    f2 = cost                 (minimize intervention cost/effort)

A third, optional objective (peak temperature) can be toggled on via
`use_peak_temp_objective=True` for a 3-objective Pareto front.

Decision variables: the Action Vector, e.g.
    x = [tree_cover_pct, albedo_delta, water_body_pct, roof_insulation_r]
bounded by physically realistic ranges (see `xl`/`xu` in the example run).
"""

from __future__ import annotations

from typing import Optional, Sequence

import numpy as np
import torch
from pymoo.core.problem import Problem
from pymoo.algorithms.moo.nsga2 import NSGA2
from pymoo.optimize import minimize
from pymoo.operators.crossover.sbx import SBX
from pymoo.operators.mutation.pm import PM
from pymoo.operators.sampling.rnd import FloatRandomSampling

from gsoe_core import GSOEEvaluator


class GSOEProblem(Problem):
    """
    pymoo Problem wrapping the GSOE evaluator for ONE baseline sample at a time
    (pymoo populations are batched over candidate solutions, not over city
    samples -- if you need to optimize many locations at once, instantiate one
    GSOEProblem per location, or extend this class to vmap over both axes).

    Args:
        evaluator: a GSOEEvaluator with `set_baseline` already called.
        n_var: dimensionality of the action vector.
        xl, xu: lower/upper bounds per action dimension (array-like, len n_var).
        use_peak_temp_objective: if True, adds scenario peak temperature as a
                                  third minimization objective.
        n_constr: number of inequality constraints (default 0). Extend
                   `_evaluate` if you need e.g. "total intervention area <= X".
    """

    def __init__(
        self,
        evaluator: GSOEEvaluator,
        n_var: int,
        xl: Sequence[float],
        xu: Sequence[float],
        use_peak_temp_objective: bool = False,
        n_constr: int = 0,
    ):
        self.evaluator = evaluator
        self.use_peak_temp_objective = use_peak_temp_objective
        n_obj = 3 if use_peak_temp_objective else 2

        xl = np.asarray(xl, dtype=float)
        xu = np.asarray(xu, dtype=float)
        assert xl.shape == (n_var,) and xu.shape == (n_var,), "bounds must match n_var"
        assert np.all(xu > xl), "upper bounds must exceed lower bounds"

        super().__init__(n_var=n_var, n_obj=n_obj, n_constr=n_constr, xl=xl, xu=xu)

    def _evaluate(self, X: np.ndarray, out: dict, *args, **kwargs) -> None:
        """
        Args:
            X: (pop_size, n_var) candidate action vectors from pymoo.
        Sets:
            out["F"]: (pop_size, n_obj) objective values.
        """
        pop_size = X.shape[0]
        device = self.evaluator.device

        # Broadcast the single cached baseline to match the candidate population size.
        action_batch = torch.as_tensor(X, dtype=torch.float32, device=device)

        baseline_embedding = self.evaluator._baseline_embedding
        assert baseline_embedding is not None, "evaluator.set_baseline() was not called"
        if baseline_embedding.shape[0] == 1 and pop_size > 1:
            # Repeat baseline across the population so batch sizes line up for the
            # generator/surrogate forward pass.
            expanded_baseline = baseline_embedding.expand(pop_size, -1).contiguous()
            expanded_baseline_out = self.evaluator._baseline_output
            self.evaluator._baseline_embedding = expanded_baseline
            self.evaluator._baseline_output = _repeat_surrogate_output(
                expanded_baseline_out, pop_size
            )

        with torch.no_grad():
            metrics = self.evaluator.evaluate(action_batch)

        f1 = -metrics["delta_t_mean"].cpu().numpy()  # minimize negative cooling
        f2 = metrics["cost"].cpu().numpy()

        if self.use_peak_temp_objective:
            f3 = metrics["scenario_peak_temp"].cpu().numpy()
            out["F"] = np.column_stack([f1, f2, f3])
        else:
            out["F"] = np.column_stack([f1, f2])

        # Restore the un-expanded baseline so `evaluator` stays reusable for
        # single-sample calls (e.g. re-checking the final Pareto set one at a time).
        self.evaluator._baseline_embedding = baseline_embedding
        self.evaluator._baseline_output = self.evaluator._baseline_output


def _repeat_surrogate_output(output, n: int):
    """Repeat a batch-size-1 SurrogateOutput to batch-size n along dim 0."""
    from gsoe_core import SurrogateOutput

    temp = output.temperature_field.expand(n, *output.temperature_field.shape[1:]).contiguous()
    fluxes = {
        k: v.expand(n, *v.shape[1:]).contiguous() for k, v in output.fluxes.items()
    }
    return SurrogateOutput(temperature_field=temp, fluxes=fluxes)


def run_nsga2(
    problem: GSOEProblem,
    pop_size: int = 40,
    n_gen: int = 50,
    seed: int = 1,
    verbose: bool = False,
):
    """
    Convenience runner: NSGA-II with SBX crossover + polynomial mutation,
    reasonable defaults for a continuous action-vector search space.

    Returns:
        pymoo Result object. `.X` = Pareto-optimal action vectors (n_solutions, n_var),
        `.F` = corresponding objective values (n_solutions, n_obj).
    """
    algorithm = NSGA2(
        pop_size=pop_size,
        sampling=FloatRandomSampling(),
        crossover=SBX(prob=0.9, eta=15),
        mutation=PM(eta=20),
        eliminate_duplicates=True,
    )
    result = minimize(
        problem,
        algorithm,
        termination=("n_gen", n_gen),
        seed=seed,
        verbose=verbose,
    )
    return result
