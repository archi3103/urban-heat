"""
gsoe_core.py
============
Core torch modules for TAPAS Generative Scenario Optimization Engine (GSOE).

Contains:
    - ScenarioGenerator      : conditional net that fuses baseline embedding + action vector
    - FrozenSurrogateWrapper : loads/freezes the pretrained decoder + heat-dynamics core
    - GSOEEvaluator          : runs baseline vs scenario, computes delta-T and cost metrics

All modules are device-agnostic (CPU/GPU) and shape-checked with assertions.
"""

from __future__ import annotations

import copy
from dataclasses import dataclass, field
from typing import Dict, Optional

import torch
import torch.nn as nn
import torch.nn.functional as F


# --------------------------------------------------------------------------- #
# 1. Scenario Generator
# --------------------------------------------------------------------------- #
class ScenarioGenerator(nn.Module):
    """
    Conditional generator that maps (baseline_embedding, action_vector) -> modified_embedding.

    The action vector encodes cooling interventions, e.g.:
        [tree_cover_pct, albedo_delta, roof_insulation_r_value, water_body_pct, ...]

    Design: FiLM-style conditioning (feature-wise linear modulation). The action vector
    is encoded into a (gamma, beta) pair that scales/shifts the baseline embedding after
    each residual block. This lets small, continuous action changes produce smooth,
    differentiable perturbations of the embedding space -- important since the frozen
    surrogate downstream is sensitive to embedding geometry.

    Args:
        embedding_dim: dimensionality of the baseline spatial-temporal embedding.
        action_dim:    dimensionality of the action vector (num intervention knobs).
        hidden_dim:    width of internal MLP layers.
        num_blocks:    number of FiLM-conditioned residual blocks.
    """

    def __init__(
        self,
        embedding_dim: int,
        action_dim: int,
        hidden_dim: int = 256,
        num_blocks: int = 3,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.action_dim = action_dim

        # Encode the action vector once; each block reads its own FiLM head off this.
        self.action_encoder = nn.Sequential(
            nn.Linear(action_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.GELU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.GELU(),
        )

        self.input_proj = nn.Linear(embedding_dim, hidden_dim)

        self.blocks = nn.ModuleList(
            [_FiLMResidualBlock(hidden_dim, dropout=dropout) for _ in range(num_blocks)]
        )
        self.film_heads = nn.ModuleList(
            [nn.Linear(hidden_dim, 2 * hidden_dim) for _ in range(num_blocks)]
        )

        self.output_proj = nn.Linear(hidden_dim, embedding_dim)

        # Residual gate: start near-identity so an all-zero action vector (no
        # intervention) reproduces the baseline embedding almost exactly.
        self.output_gate = nn.Parameter(torch.tensor(0.01))

    def forward(self, baseline_embedding: torch.Tensor, action_vector: torch.Tensor) -> torch.Tensor:
        """
        Args:
            baseline_embedding: (B, embedding_dim)
            action_vector:      (B, action_dim)
        Returns:
            modified_embedding: (B, embedding_dim)
        """
        assert baseline_embedding.dim() == 2, f"expected (B, D), got {baseline_embedding.shape}"
        assert action_vector.dim() == 2, f"expected (B, A), got {action_vector.shape}"
        assert baseline_embedding.shape[-1] == self.embedding_dim, (
            f"embedding_dim mismatch: {baseline_embedding.shape[-1]} vs {self.embedding_dim}"
        )
        assert action_vector.shape[-1] == self.action_dim, (
            f"action_dim mismatch: {action_vector.shape[-1]} vs {self.action_dim}"
        )
        assert baseline_embedding.shape[0] == action_vector.shape[0], "batch size mismatch"

        action_code = self.action_encoder(action_vector)  # (B, hidden)
        h = self.input_proj(baseline_embedding)  # (B, hidden)

        for block, film_head in zip(self.blocks, self.film_heads):
            gamma, beta = film_head(action_code).chunk(2, dim=-1)  # each (B, hidden)
            h = block(h, gamma, beta)

        delta = self.output_proj(h)  # (B, embedding_dim)
        modified_embedding = baseline_embedding + self.output_gate * delta
        assert modified_embedding.shape == baseline_embedding.shape
        return modified_embedding


class _FiLMResidualBlock(nn.Module):
    """Linear -> FiLM modulate -> GELU -> Linear, with a residual skip."""

    def __init__(self, hidden_dim: int, dropout: float = 0.1):
        super().__init__()
        self.fc1 = nn.Linear(hidden_dim, hidden_dim)
        self.norm1 = nn.LayerNorm(hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.norm2 = nn.LayerNorm(hidden_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, gamma: torch.Tensor, beta: torch.Tensor) -> torch.Tensor:
        residual = x
        h = self.norm1(self.fc1(x))
        h = gamma * h + beta  # FiLM modulation from action vector
        h = F.gelu(h)
        h = self.dropout(h)
        h = self.norm2(self.fc2(h))
        return residual + h


# --------------------------------------------------------------------------- #
# 2. Frozen Surrogate Wrapper
# --------------------------------------------------------------------------- #
@dataclass
class SurrogateOutput:
    """Container for one surrogate forward pass."""
    temperature_field: torch.Tensor          # (B, H, W) or (B, N) -- T(x, y, t)
    fluxes: Dict[str, torch.Tensor] = field(default_factory=dict)  # Rn, G, H, LE each (B, ...)


class FrozenSurrogateWrapper(nn.Module):
    """
    Wraps the pretrained Multi-head Decoder + Physics-Informed Heat Dynamics Core.

    Guarantees:
        - All parameters are frozen (requires_grad_(False)) and the module is put in eval()
          mode permanently (no BatchNorm/Dropout drift during GSOE optimization).
        - `load_pretrained` performs a strict-mode-optional state_dict load so this wrapper
          can be dropped into an existing checkpoint pipeline.
        - Forward pass is wrapped in `torch.no_grad()` by default via `predict()`, but the
          raw `forward()` remains differentiable (needed so gradients CAN flow back through
          embeddings if you later want a gradient-based scenario generator trainer; NSGA-II
          itself doesn't need this, but we don't want to foreclose that use case).

    Args:
        decoder: the pretrained nn.Module implementing forward(embedding) -> raw outputs.
                 Must already be architected to output a dict or tuple that
                 `output_adapter` can parse into (temperature_field, fluxes).
        output_adapter: callable mapping the decoder's raw output -> SurrogateOutput.
                        Defaults to an identity adapter assuming the decoder already
                        returns a dict with keys {'temperature', 'Rn', 'G', 'H', 'LE'}.
    """

    def __init__(self, decoder: nn.Module, output_adapter: Optional[callable] = None):
        super().__init__()
        self.decoder = decoder
        self._output_adapter = output_adapter or self._default_adapter
        self.freeze()

    @staticmethod
    def _default_adapter(raw: Dict[str, torch.Tensor]) -> SurrogateOutput:
        assert "temperature" in raw, "decoder output missing 'temperature' key"
        fluxes = {k: v for k, v in raw.items() if k in ("Rn", "G", "H", "LE")}
        return SurrogateOutput(temperature_field=raw["temperature"], fluxes=fluxes)

    def freeze(self) -> None:
        """Freeze every parameter and lock the module into eval mode."""
        for p in self.decoder.parameters():
            p.requires_grad_(False)
        self.decoder.eval()

    def train(self, mode: bool = True):
        # Override so any accidental .train() call upstream (e.g. a shared training loop)
        # cannot silently unfreeze BatchNorm/Dropout behaviour of the surrogate.
        return super().train(False)

    @classmethod
    def load_pretrained(
        cls,
        decoder: nn.Module,
        checkpoint_path: str,
        map_location: str = "cpu",
        strict: bool = True,
        output_adapter: Optional[callable] = None,
    ) -> "FrozenSurrogateWrapper":
        state_dict = torch.load(checkpoint_path, map_location=map_location)
        if "state_dict" in state_dict:  # common lightning/checkpoint convention
            state_dict = state_dict["state_dict"]
        decoder.load_state_dict(state_dict, strict=strict)
        return cls(decoder, output_adapter=output_adapter)

    def forward(self, embedding: torch.Tensor) -> SurrogateOutput:
        assert embedding.dim() == 2, f"expected (B, D) embedding, got {embedding.shape}"
        raw = self.decoder(embedding)
        return self._output_adapter(raw)

    @torch.no_grad()
    def predict(self, embedding: torch.Tensor) -> SurrogateOutput:
        """Inference-only convenience wrapper (no grad tracking, minor speed win)."""
        return self.forward(embedding)


# --------------------------------------------------------------------------- #
# 3. GSOE Evaluator
# --------------------------------------------------------------------------- #
class GSOEEvaluator:
    """
    Orchestrates one GSOE evaluation step:
        baseline_embedding, action_vector
            -> ScenarioGenerator -> modified_embedding
            -> FrozenSurrogateWrapper -> scenario prediction
        compares against the (cached) baseline prediction to produce
        cooling and cost metrics used as optimization objectives.

    Args:
        generator: ScenarioGenerator instance.
        surrogate: FrozenSurrogateWrapper instance.
        action_cost_fn: callable(action_vector: Tensor (B, A)) -> Tensor (B,)
                        Domain-specific cost/effort model (e.g. $/sq-ft, install effort).
                        Defaults to an L1-weighted cost proxy.
        device: torch device string.
    """

    def __init__(
        self,
        generator: ScenarioGenerator,
        surrogate: FrozenSurrogateWrapper,
        action_cost_fn: Optional[callable] = None,
        device: str = "cpu",
    ):
        self.device = torch.device(device)
        self.generator = generator.to(self.device)
        self.surrogate = surrogate.to(self.device)
        self.action_cost_fn = action_cost_fn or self._default_cost_fn

        # Cached per-sample baseline predictions, set by `set_baseline`.
        self._baseline_embedding: Optional[torch.Tensor] = None
        self._baseline_output: Optional[SurrogateOutput] = None

    @staticmethod
    def _default_cost_fn(action_vector: torch.Tensor) -> torch.Tensor:
        """
        Simple default: cost grows with magnitude of intervention, weighted so that
        structural changes (e.g. roof insulation, assumed at index -1) cost more than
        vegetative/albedo changes. Replace with a real cost model in production.
        """
        weights = torch.ones(action_vector.shape[-1], device=action_vector.device)
        if action_vector.shape[-1] >= 4:
            weights[-1] = 2.5  # roof insulation assumed most capex-intensive
        return (action_vector.abs() * weights).sum(dim=-1)

    def set_baseline(self, baseline_embedding: torch.Tensor) -> None:
        """Cache the baseline embedding and its frozen-surrogate prediction."""
        baseline_embedding = baseline_embedding.to(self.device)
        self._baseline_embedding = baseline_embedding
        self._baseline_output = self.surrogate.predict(baseline_embedding)

    def evaluate(self, action_vector: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Run one scenario evaluation against the cached baseline.

        Args:
            action_vector: (B, action_dim)
        Returns:
            dict with:
                'delta_t_mean' (B,)  mean cooling across the field (positive = cooler)
                'delta_t_peak' (B,)  peak-cell cooling (worst-case hot spot improvement)
                'scenario_peak_temp' (B,) peak temperature under the scenario (objective to minimize)
                'cost' (B,) intervention cost/effort
                'scenario_output': SurrogateOutput for the scenario
        """
        if self._baseline_embedding is None:
            raise RuntimeError("call set_baseline() before evaluate()")

        action_vector = action_vector.to(self.device)
        assert action_vector.shape[0] == self._baseline_embedding.shape[0], (
            "action_vector batch size must match baseline batch size"
        )

        modified_embedding = self.generator(self._baseline_embedding, action_vector)
        with torch.no_grad():
            scenario_output = self.surrogate(modified_embedding)

        baseline_T = self._baseline_output.temperature_field  # (B, ...)
        scenario_T = scenario_output.temperature_field  # (B, ...)
        assert baseline_T.shape == scenario_T.shape, (
            f"surrogate output shape drifted: {baseline_T.shape} vs {scenario_T.shape}"
        )

        flat_baseline = baseline_T.flatten(start_dim=1)
        flat_scenario = scenario_T.flatten(start_dim=1)
        delta_t = flat_baseline - flat_scenario  # positive = cooling achieved

        cost = self.action_cost_fn(action_vector)

        return {
            "delta_t_mean": delta_t.mean(dim=1),
            "delta_t_peak": delta_t.max(dim=1).values,
            "scenario_peak_temp": flat_scenario.max(dim=1).values,
            "cost": cost,
            "scenario_output": scenario_output,
        }
