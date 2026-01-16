import { expect, test } from "vitest";
import { at, minutesAfter } from "../support/time";

test("at builds IST wall-clock times", () => {
  expect(at("10:30").toISOString()).toBe("2026-10-26T05:00:00.000Z");
  expect(at("09:00", "2026-10-27").toISOString()).toBe("2026-10-27T03:30:00.000Z");
});

test("minutesAfter adds minutes", () => {
  expect(minutesAfter(at("10:30"), 15)).toEqual(at("10:45"));
});
