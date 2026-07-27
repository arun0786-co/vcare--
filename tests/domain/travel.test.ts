import { expect, test } from "vitest";
import { validTravelMinutes } from "@/domain/booking/travel";

test("allowed options and none", () => {
  for (const m of [10, 20, 30, 45, 60]) expect(validTravelMinutes(m)).toBe(m);
  expect(validTravelMinutes(null)).toBeNull();
  expect(validTravelMinutes(undefined)).toBeNull();
});

test.each([0, 25, 90, -10, 20.5])("rejects %s", (m) => {
  expect(() => validTravelMinutes(m)).toThrow(expect.objectContaining({ code: "VALIDATION" }));
});
