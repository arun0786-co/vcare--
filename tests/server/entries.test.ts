import { beforeEach, describe, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { loadEntries, toView, type EntryRow } from "@/server/queue/entries";
import { at } from "../support/time";
import { createSession, insertRawEntry, resetDb, seedClinic } from "./helpers";

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

describe("with a database", () => {
  let sessionId: string;
  let otherSessionId: string;

  beforeEach(async () => {
    await resetDb();
    const { doctorId } = await seedClinic();
    sessionId = await createSession(doctorId, at("10:00"), at("13:00"));
    otherSessionId = await createSession(doctorId, at("17:00"), at("20:00"));
  });

  test("loadEntries returns one session's entries by ticket", async () => {
    await insertRawEntry(sessionId, { ticketNo: 2 });
    await insertRawEntry(sessionId, { ticketNo: 1 });
    await insertRawEntry(otherSessionId, { ticketNo: 1 });
    expect((await loadEntries(db, sessionId)).map((e) => e.ticketNo)).toEqual([1, 2]);
  });
});
