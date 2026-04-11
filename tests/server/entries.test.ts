import { describe, expect, test } from "vitest";
import { toView, type EntryRow } from "@/server/queue/entries";
import { at } from "../support/time";

const row = (overrides: Partial<EntryRow> = {}): EntryRow => ({
  id: "e1",
  sessionId: "s1",
  ticketNo: 3,
  channel: "ONLINE",
  status: "BOOKED",
  patientName: "Anita",
  patientPhone: "+919876543210",
  scheduledAt: at("10:30"),
  checkedInAt: null,
  startedAt: null,
  completedAt: null,
  passedAt: null,
  priorityAt: null,
  priorityReason: null,
  travelMinutes: 20,
  publicToken: "t",
  createdAt: at("09:00"),
  updatedAt: at("09:00"),
  ...overrides,
});

describe("toView", () => {
  test("keeps queue fields and drops personal ones", () => {
    expect(toView(row())).toEqual({
      id: "e1",
      ticketNo: 3,
      channel: "ONLINE",
      status: "BOOKED",
      scheduledAt: at("10:30"),
      checkedInAt: null,
      startedAt: null,
      passedAt: null,
      priorityAt: null,
      travelMinutes: 20,
      hasPhone: true,
    });
  });

  test("no phone", () => {
    expect(toView(row({ patientPhone: null })).hasPhone).toBe(false);
  });
});
