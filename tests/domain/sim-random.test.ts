import { describe, expect, test } from "vitest";
import { mulberry32, randomInt } from "@/sim/random";

describe("mulberry32", () => {
  test("same seed, same sequence; values in [0, 1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 1000 }, () => a());
    expect(xs).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(mulberry32(43)()).not.toBe(xs[0]);
  });
});

test("randomInt stays within inclusive bounds and hits both ends", () => {
  const rng = mulberry32(1);
  const xs = Array.from({ length: 2000 }, () => randomInt(rng, -3, 5));
  expect(Math.min(...xs)).toBe(-3);
  expect(Math.max(...xs)).toBe(5);
});
