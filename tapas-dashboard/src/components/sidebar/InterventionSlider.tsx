"use client";

import type { InterventionConfig } from "@/types";

interface InterventionSliderProps {
  config: InterventionConfig;
  value: number;
  onChange: (value: number) => void;
}

const ACCENT_CLASSES: Record<InterventionConfig["accent"], string> = {
  "thermal-hot":
    "[&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(220,38,38,0.5)] accent-red-500",
  "thermal-cool":
    "[&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(37,99,235,0.5)] accent-blue-500",
  "thermal-neutral":
    "[&::-webkit-slider-thumb]:bg-violet-400 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(167,139,250,0.5)] accent-violet-400",
};

/**
 * Styled range input for a single intervention parameter.
 * Wire onChange to model re-run or debounced API calls.
 */
export function InterventionSlider({
  config,
  value,
  onChange,
}: InterventionSliderProps) {
  const accentClass = ACCENT_CLASSES[config.accent];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={`slider-${config.key}`}
          className="text-sm font-medium text-slate-200"
        >
          {config.label}
        </label>
        <span className="font-mono text-sm tabular-nums text-slate-300">
          {value.toFixed(config.step < 1 ? 2 : 0)}
          <span className="ml-1 text-xs text-slate-500">{config.unit}</span>
        </span>
      </div>

      <input
        id={`slider-${config.key}`}
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full ${accentClass}`}
        aria-valuemin={config.min}
        aria-valuemax={config.max}
        aria-valuenow={value}
        aria-describedby={`desc-${config.key}`}
      />

      <p id={`desc-${config.key}`} className="text-xs leading-relaxed text-slate-500">
        {config.description}
      </p>
    </div>
  );
}
