import { expect, test } from "vitest";
import { simulateSession } from "@/sim/simulate";

test("same seed, same result", () => {
  expect(simulateSession({ seed: 7 })).toEqual(simulateSession({ seed: 7 }));
});

test("with the doctor 45 minutes late, alerted patients wait less than baseline", () => {
  const r = simulateSession({ seed: 1, doctorLateMinutes: 45, lateAnnounced: true });
  expect(r.alerts.avgWaitMinutes).toBeLessThan(r.baseline.avgWaitMinutes);
});
