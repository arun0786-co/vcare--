import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { doctorSessions } from "@/server/db/schema";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;
const session = async () => (await db.select().from(doctorSessions).where(eq(doctorSessions.id, s.sessionId)))[0];

beforeEach(async () => {
  s = await setupSession();
});

describe("DOCTOR_LATE", () => {
  test("records the expected start", async () => {
    await s.act({ type: "DOCTOR_LATE", expectedStartAt: at("10:45").toISOString() }, at("09:50"));
    expect((await session()).expectedStartAt).toEqual(at("10:45"));
  });

  test("must be in the future and before the doctor arrives", async () => {
    await expect(s.act({ type: "DOCTOR_LATE", expectedStartAt: at("09:30").toISOString() }, at("09:50"))).rejects.toMatchObject({
      code: "VALIDATION",
    });
    await db.update(doctorSessions).set({ doctorArrivedAt: at("10:00") }).where(eq(doctorSessions.id, s.sessionId));
    await expect(s.act({ type: "DOCTOR_LATE", expectedStartAt: at("10:45").toISOString() }, at("10:05"))).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });
});

describe("DOCTOR_ARRIVED", () => {
  test("records arrival once", async () => {
    await s.act({ type: "DOCTOR_ARRIVED" }, at("10:12"));
    await s.act({ type: "DOCTOR_ARRIVED" }, at("10:20"));
    expect((await session()).doctorArrivedAt).toEqual(at("10:12"));
  });
});

describe("START_BREAK", () => {
  test("finishes the patient inside and pauses until the given time", async () => {
    const w = (await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("11:00"))).createdEntryId!;
    await s.act({ type: "NEXT", expectedCurrentId: null }, at("11:01"));
    await s.act({ type: "START_BREAK", until: at("11:30").toISOString(), reason: "tea" }, at("11:10"));
    expect(await entryById(w)).toMatchObject({ status: "COMPLETED", completedAt: at("11:10") });
    expect(await session()).toMatchObject({ pausedUntil: at("11:30"), pauseReason: "tea" });
  });

  test("end time must be within the next four hours", async () => {
    for (const until of [at("11:00"), at("15:11")]) {
      await expect(s.act({ type: "START_BREAK", until: until.toISOString() }, at("11:10"))).rejects.toMatchObject({
        code: "VALIDATION",
      });
    }
  });
});
