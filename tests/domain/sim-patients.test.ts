import { expect, test } from "vitest";
import { generatePatients } from "@/sim/patients";
import { DEFAULT_SIM } from "@/sim/types";
import { at } from "../support/time";

test("same seed, same patients", () => {
  expect(generatePatients(DEFAULT_SIM)).toEqual(generatePatients(DEFAULT_SIM));
  expect(generatePatients({ ...DEFAULT_SIM, seed: 2 })).not.toEqual(generatePatients(DEFAULT_SIM));
});

test("bookings every 30 minutes from 10:00 with plausible travel", () => {
  const { booked } = generatePatients(DEFAULT_SIM);
  expect(booked.map((b) => b.slot)).toEqual(["10:00", "10:30", "11:00", "11:30", "12:00", "12:30"].map((t) => at(t)));
  for (const b of booked) {
    expect([10, 20, 30, 45, 60]).toContain(b.travel);
    expect(b.actualTravel - b.travel).toBeGreaterThanOrEqual(-3);
    expect(b.actualTravel - b.travel).toBeLessThanOrEqual(5);
  }
});

test("walk-ins arrive between 09:45 and 12:30 with whole-minute durations of 2-40", () => {
  const { walkIns, booked } = generatePatients({ ...DEFAULT_SIM, walkInsPerHour: 10 });
  expect(walkIns.length).toBeGreaterThan(10);
  for (const w of walkIns) {
    expect(w.arrival >= at("09:45") && w.arrival < at("12:30")).toBe(true);
  }
  for (const p of [...walkIns, ...booked]) {
    expect(Number.isInteger(p.duration)).toBe(true);
    expect(p.duration).toBeGreaterThanOrEqual(2);
    expect(p.duration).toBeLessThanOrEqual(40);
  }
});
