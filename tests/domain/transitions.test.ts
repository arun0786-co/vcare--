import { describe, expect, test } from "vitest";
import { ENTRY_STATUSES } from "@/domain/queue/types";
import { assertTransition, canTransition } from "@/domain/queue/transitions";

const ALLOWED = new Set([
  "BOOKED->CHECKED_IN",
  "BOOKED->NO_SHOW",
  "BOOKED->CANCELLED",
  "CHECKED_IN->IN_CONSULTATION",
  "CHECKED_IN->NO_SHOW",
  "CHECKED_IN->CANCELLED",
  "IN_CONSULTATION->COMPLETED",
  "NO_SHOW->CHECKED_IN",
]);

describe("canTransition", () => {
  for (const from of ENTRY_STATUSES) {
    for (const to of ENTRY_STATUSES) {
      const key = `${from}->${to}`;
      test(key, () => {
        expect(canTransition(from, to)).toBe(ALLOWED.has(key));
      });
    }
  }
});

describe("assertTransition", () => {
  test("passes for an allowed change", () => {
    expect(() => assertTransition("BOOKED", "CHECKED_IN")).not.toThrow();
  });

  test("throws INVALID_TRANSITION otherwise", () => {
    expect(() => assertTransition("COMPLETED", "CHECKED_IN")).toThrow(
      expect.objectContaining({ code: "INVALID_TRANSITION" }),
    );
  });
});
