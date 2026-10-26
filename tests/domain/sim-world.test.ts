import { describe, expect, test } from "vitest";
import { runWorld } from "@/sim/world";
import { DEFAULT_SIM, type SimPatients } from "@/sim/types";
import { at } from "../support/time";

// One walk-in at 10:00 (10 min) and one booking at 10:30 (20 min away, 10 min consult).
const patients: SimPatients = {
  walkIns: [{ id: "w1", arrival: at("10:00"), duration: 10 }],
  booked: [{ id: "b1", slot: at("10:30"), travel: 20, actualTravel: 20, duration: 10 }],
};

describe("doctor on time", () => {
  test("baseline: arrives 5 minutes early and is seen on arrival", () => {
    const r = runWorld(patients, DEFAULT_SIM, "baseline");
    expect(r.details).toEqual([
      { id: "b1", slot: at("10:30"), arrival: at("10:25"), start: at("10:25"), waitMinutes: 0, lostSlot: false, alertExpectedAt: null },
    ]);
    expect(r.etaMaeMinutes).toBeNull();
  });

  test("alerts: told to leave at 10:00, arrives 10:20, seen on arrival", () => {
    const r = runWorld(patients, DEFAULT_SIM, "alerts");
    expect(r.details[0]).toEqual({
      id: "b1",
      slot: at("10:30"),
      arrival: at("10:20"),
      start: at("10:20"),
      waitMinutes: 0,
      lostSlot: false,
      alertExpectedAt: at("10:30"),
    });
    expect(r.etaMaeMinutes).toBe(10);
  });
});

describe("doctor 45 minutes late, announced at 09:30", () => {
  const late = { ...DEFAULT_SIM, doctorLateMinutes: 45, lateAnnounced: true };

  test("baseline waits 30 minutes behind the walk-in", () => {
    const r = runWorld(patients, late, "baseline");
    expect(r.details[0]).toMatchObject({ arrival: at("10:25"), start: at("10:55"), waitMinutes: 30, lostSlot: false });
    expect(r).toMatchObject({ bookedPatients: 1, avgWaitMinutes: 30, maxWaitMinutes: 30, lostSlots: 0 });
  });

  test("alerts: leaves at 10:21, arrives 10:41, waits 14 and keeps the slot", () => {
    const r = runWorld(patients, late, "alerts");
    expect(r.details[0]).toMatchObject({
      arrival: at("10:41"),
      start: at("10:55"),
      waitMinutes: 14,
      lostSlot: false,
      alertExpectedAt: at("10:53"),
    });
    expect(r.etaMaeMinutes).toBe(2);
  });
});

test("an overrunning morning plays out until every patient is seen", () => {
  // 40 walk-ins of 10 minutes from 09:45 push the 12:30 booking past 16:00.
  const crowd: SimPatients = {
    walkIns: Array.from({ length: 40 }, (_, i) => ({ id: `w${i}`, arrival: at("09:45"), duration: 10 })),
    booked: [{ id: "b1", slot: at("12:30"), travel: 30, actualTravel: 30, duration: 10 }],
  };
  for (const world of ["alerts", "baseline"] as const) {
    const r = runWorld(crowd, { ...DEFAULT_SIM, doctorLateMinutes: 30, lateAnnounced: true }, world);
    expect(r.details[0].start! > at("16:00")).toBe(true);
    expect(r.lostSlots).toBe(0);
  }
});
