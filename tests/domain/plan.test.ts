import { describe, expect, test } from "vitest";
import { planLeaveNow, type AlertHistory } from "@/domain/notify/plan";
import type { Eta } from "@/domain/queue/types";
import { booking } from "../support/entries";
import { at } from "../support/time";

const NO_HISTORY: AlertHistory = { leaveNowEarlyAt: null, lastAlertEarlyAt: null, delayCount: 0 };
const b = booking({ id: "b", scheduledAt: at("11:00"), travelMinutes: 20 });
const eta = (early: string, expected = early): Eta => ({
  entryId: "b",
  position: 1,
  earlyAt: at(early),
  expectedAt: at(expected),
});

describe("planLeaveNow", () => {
  test("due at early estimate minus travel minus buffer", () => {
    expect(planLeaveNow(b, eta("11:00"), NO_HISTORY, at("10:29"), 10)).toBeNull();
    expect(planLeaveNow(b, eta("11:00", "11:04"), NO_HISTORY, at("10:30"), 10)).toEqual({
      entryId: "b",
      kind: "LEAVE_NOW",
      dedupeKey: "LEAVE_NOW:b",
      expectedAt: at("11:04"),
      earlyAt: at("11:00"),
      leaveAt: at("10:30"),
    });
  });

  test("fires straight away when the patient is already late to leave", () => {
    expect(planLeaveNow(b, eta("11:00"), NO_HISTORY, at("10:50"), 10)?.kind).toBe("LEAVE_NOW");
  });

  test("only once", () => {
    const sent = { ...NO_HISTORY, leaveNowEarlyAt: at("11:00"), lastAlertEarlyAt: at("11:00") };
    expect(planLeaveNow(b, eta("11:00"), sent, at("10:40"), 10)).toBeNull();
  });

  test.each([
    ["already checked in", { ...b, status: "CHECKED_IN" as const, checkedInAt: at("10:00") }],
    ["no phone", { ...b, hasPhone: false }],
    ["no travel time", { ...b, travelMinutes: null }],
  ])("not for a patient with %s", (_label, e) => {
    expect(planLeaveNow(e, eta("11:00"), NO_HISTORY, at("10:40"), 10)).toBeNull();
  });
});
