import { describe, expect, test } from "vitest";
import { durationStats, percentile } from "@/domain/estimate/durations";

describe("percentile", () => {
  test("linear interpolation on sorted values", () => {
    expect(percentile([4, 6, 8, 10, 12], 0.5)).toBe(8);
    expect(percentile([4, 6, 8, 10, 12], 0.25)).toBe(6);
    expect(percentile([10, 20, 30, 40, 50, 60], 0.5)).toBe(35);
    expect(percentile([10, 20, 30, 40, 50, 60], 0.25)).toBe(22.5);
  });

  test("does not need sorted input", () => {
    expect(percentile([12, 4, 10, 6, 8], 0.5)).toBe(8);
  });

  test("single value and empty input", () => {
    expect(percentile([7], 0.25)).toBe(7);
    expect(() => percentile([], 0.5)).toThrow();
  });
});

describe("durationStats", () => {
  test("median and 25th percentile from enough samples", () => {
    expect(durationStats([4, 6, 8, 10, 12], 8)).toEqual({ median: 8, p25: 6, samples: 5 });
    expect(durationStats([10, 20, 30, 40, 50, 60], 8)).toEqual({ median: 35, p25: 22.5, samples: 6 });
  });

  test("clamps each sample to 1-60 minutes", () => {
    expect(durationStats([0.2, 90, 5, 5, 5], 8)).toEqual({ median: 5, p25: 5, samples: 5 });
  });

  test("falls back to the doctor default with fewer than 5 samples", () => {
    expect(durationStats([5, 6, 7], 8)).toEqual({ median: 8, p25: 6, samples: 3 });
    expect(durationStats([], 10)).toEqual({ median: 10, p25: 7.5, samples: 0 });
  });
});
