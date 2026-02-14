import { describe, expect, test } from "vitest";
import { percentile } from "@/domain/estimate/durations";

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
