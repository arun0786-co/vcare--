import { DEFAULTS, type DurationStats } from "../queue/types";

// Linear interpolation between the closest ranks, p in [0, 1].
export function percentile(values: number[], p: number): number {
  if (values.length === 0) throw new Error("percentile of an empty list");
  const sorted = [...values].sort((a, b) => a - b);
  const pos = p * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
}

export function durationStats(samplesMinutes: number[], defaultMinutes: number): DurationStats {
  const samples = samplesMinutes.map((m) =>
    Math.min(DEFAULTS.durationClampMax, Math.max(DEFAULTS.durationClampMin, m)),
  );
  if (samples.length < DEFAULTS.durationMinSamples) {
    return { median: defaultMinutes, p25: defaultMinutes * 0.75, samples: samples.length };
  }
  return { median: percentile(samples, 0.5), p25: percentile(samples, 0.25), samples: samples.length };
}
