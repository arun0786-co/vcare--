import { describe, expect, test } from "vitest";
import { freeSlots, isFreeSlot } from "@/domain/slots";
import { at } from "../support/time";

const grid = { startsAt: at("10:00"), endsAt: at("11:00"), slotMinutes: 15, taken: [] as Date[], now: at("09:00") };

describe("freeSlots", () => {
  test("every slot that fits in the session", () => {
    expect(freeSlots(grid)).toEqual([at("10:00"), at("10:15"), at("10:30"), at("10:45")]);
  });

  test("drops taken slots", () => {
    expect(freeSlots({ ...grid, taken: [at("10:15")] })).toEqual([at("10:00"), at("10:30"), at("10:45")]);
  });

  test("drops slots that already started", () => {
    expect(freeSlots({ ...grid, now: at("10:20") })).toEqual([at("10:30"), at("10:45")]);
  });

  test("a partial slot at the end is not offered", () => {
    expect(freeSlots({ ...grid, endsAt: at("10:40") })).toEqual([at("10:00"), at("10:15")]);
  });
});

describe("isFreeSlot", () => {
  test("accepts a free grid slot", () => {
    expect(isFreeSlot(grid, at("10:30"))).toBe(true);
  });

  test.each([
    ["off the grid", at("10:07"), grid],
    ["at session end", at("11:00"), grid],
    ["before session", at("09:45"), grid],
    ["taken", at("10:15"), { ...grid, taken: [at("10:15")] }],
    ["already started", at("10:15"), { ...grid, now: at("10:20") }],
  ])("rejects a slot %s", (_label, candidate, g) => {
    expect(isFreeSlot(g, candidate)).toBe(false);
  });
});
