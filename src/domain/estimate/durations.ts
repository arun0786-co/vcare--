// Linear interpolation between the closest ranks, p in [0, 1].
export function percentile(values: number[], p: number): number {
  if (values.length === 0) throw new Error("percentile of an empty list");
  const sorted = [...values].sort((a, b) => a - b);
  const pos = p * (sorted.length - 1);
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
}
