import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { doctorSessions } from "@/server/db/schema";
import { lockSession } from "@/server/queue/session-lock";
import { at } from "../support/time";
import { createSession, resetDb, seedClinic } from "./helpers";

let clinicId: string;
let sessionId: string;

beforeEach(async () => {
  await resetDb();
  const seeded = await seedClinic();
  clinicId = seeded.clinicId;
  sessionId = await createSession(seeded.doctorId, at("10:00"), at("13:00"));
});

test("loads the session with clinic and doctor settings", async () => {
  const s = await db.transaction((tx) => lockSession(tx, sessionId, clinicId));
  expect(s).toMatchObject({
    id: sessionId,
    clinicId,
    date: "2026-10-26",
    timezone: "Asia/Kolkata",
    graceMinutes: 10,
    alertBufferMinutes: 10,
    slotMinutes: 15,
    defaultConsultMinutes: 8,
    clinicName: "Clinic test",
    doctorName: "Dr test",
    nextTicket: 1,
    timing: { startsAt: at("10:00"), endsAt: at("13:00"), doctorArrivedAt: null, closedAt: null },
  });
});

test("unknown, malformed or another clinic's session is NOT_FOUND", async () => {
  const other = await seedClinic("other");
  for (const [id, clinic] of [
    ["6f1c1f3e-8a2b-4c3d-9e4f-5a6b7c8d9e0f", clinicId],
    ["nope", clinicId],
    [sessionId, other.clinicId],
  ]) {
    await expect(db.transaction((tx) => lockSession(tx, id, clinic))).rejects.toMatchObject({ code: "NOT_FOUND" });
  }
});

test("closed session is SESSION_CLOSED", async () => {
  await db.update(doctorSessions).set({ closedAt: at("13:05") }).where(eq(doctorSessions.id, sessionId));
  await expect(db.transaction((tx) => lockSession(tx, sessionId, clinicId))).rejects.toMatchObject({
    code: "SESSION_CLOSED",
  });
});

test("without a clinic id any clinic's session loads", async () => {
  const s = await db.transaction((tx) => lockSession(tx, sessionId));
  expect(s.id).toBe(sessionId);
});
