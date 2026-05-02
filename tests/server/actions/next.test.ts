import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { doctorSessions } from "@/server/db/schema";
import { at } from "../../support/time";
import { entriesOf, entryById, setupSession } from "../fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;

beforeEach(async () => {
  s = await setupSession();
});

const walkIn = async (name: string, now: Date) =>
  (await s.act({ type: "ADD_WALK_IN", name }, now)).createdEntryId!;
const book = async (name: string, slot: string) =>
  (await s.act({ type: "ADD_PHONE_BOOKING", name, phone: "9876543210", scheduledAt: at(slot).toISOString() }, at("09:00")))
    .createdEntryId!;
const next = (expectedCurrentId: string | null, now: Date) => s.act({ type: "NEXT", expectedCurrentId }, now);
const session = async () => (await db.select().from(doctorSessions).where(eq(doctorSessions.id, s.sessionId)))[0];

test("nobody to call or finish", async () => {
  await expect(next(null, at("10:00"))).rejects.toMatchObject({ code: "EMPTY_QUEUE" });
});

test("follows queue order and marks the doctor arrived", async () => {
  const appt = await book("Anita", "10:30");
  await s.act({ type: "CHECK_IN", entryId: appt }, at("10:00"));
  const walk = await walkIn("Ravi", at("10:10"));

  await next(null, at("10:15"));
  expect(await entryById(walk)).toMatchObject({ status: "IN_CONSULTATION", startedAt: at("10:15") });
  expect(await entryById(appt)).toMatchObject({ status: "CHECKED_IN" });
  expect((await session()).doctorArrivedAt).toEqual(at("10:15"));
});

test("finishes the current patient and calls the next; with nobody waiting it only finishes", async () => {
  const w1 = await walkIn("Ravi", at("10:00"));
  const w2 = await walkIn("Meena", at("10:01"));
  await next(null, at("10:05"));
  await next(w1, at("10:12"));
  expect(await entryById(w1)).toMatchObject({ status: "COMPLETED", completedAt: at("10:12") });
  expect(await entryById(w2)).toMatchObject({ status: "IN_CONSULTATION", startedAt: at("10:12") });

  await next(w2, at("10:20"));
  expect(await entryById(w2)).toMatchObject({ status: "COMPLETED" });
  expect((await entriesOf(s.sessionId)).filter((e) => e.status === "IN_CONSULTATION")).toEqual([]);
});

test("passes over an absent booking whose place came first", async () => {
  const b = await book("Anita", "10:15");
  const w = await walkIn("Ravi", at("10:22"));
  await next(null, at("10:25"));
  expect(await entryById(b)).toMatchObject({ status: "BOOKED", passedAt: at("10:25") });
  expect(await entryById(w)).toMatchObject({ status: "IN_CONSULTATION" });
});

test("a stale view of who is inside is a conflict and changes nothing", async () => {
  const w1 = await walkIn("Ravi", at("10:00"));
  await walkIn("Meena", at("10:01"));
  await next(null, at("10:05"));
  await expect(next(null, at("10:06"))).rejects.toMatchObject({ code: "CONFLICT" });
  expect(await entryById(w1)).toMatchObject({ status: "IN_CONSULTATION", startedAt: at("10:05") });
});

test("two presses at once: exactly one patient advances", async () => {
  await walkIn("Ravi", at("10:00"));
  await walkIn("Meena", at("10:01"));
  const results = await Promise.allSettled([next(null, at("10:05")), next(null, at("10:05"))]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  const rejected = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
  expect(rejected.reason).toMatchObject({ code: "CONFLICT" });
  expect((await entriesOf(s.sessionId)).filter((e) => e.status === "IN_CONSULTATION")).toHaveLength(1);
});

test("calling a patient ends a break", async () => {
  await walkIn("Ravi", at("11:00"));
  await db.update(doctorSessions).set({ pausedUntil: at("11:30"), pauseReason: "tea" }).where(eq(doctorSessions.id, s.sessionId));
  await next(null, at("11:10"));
  expect(await session()).toMatchObject({ pausedUntil: null, pauseReason: null });
});
