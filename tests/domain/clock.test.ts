import { expect, test } from "vitest";
import { addMinutes, laterOf, minutesBetween } from "@/domain/clock";
import { at } from "../support/time";

test("addMinutes", () => {
  expect(addMinutes(at("10:00"), 15)).toEqual(at("10:15"));
  expect(addMinutes(at("10:00"), -10)).toEqual(at("09:50"));
  expect(addMinutes(at("10:00"), 1.5).toISOString()).toBe("2026-10-26T04:31:30.000Z");
});

test("minutesBetween", () => {
  expect(minutesBetween(at("10:00"), at("10:45"))).toBe(45);
  expect(minutesBetween(at("10:45"), at("10:00"))).toBe(-45);
});

test("laterOf", () => {
  expect(laterOf(at("10:00"), at("10:30"))).toEqual(at("10:30"));
  expect(laterOf(at("11:00"), at("10:30"))).toEqual(at("11:00"));
});
