import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { queueEntries, queueEvents } from "@/server/db/schema";
import { lockSession } from "@/server/queue/session-lock";
import { transitionEntry } from "@/server/queue/transition";
import { at } from "../support/time";
import { createSession, insertRawEntry, resetDb, seedClinic } from "./helpers";

let sessionId: string;
let staffId: string;

beforeEach(async () => {
  await resetDb();
  const seeded = await seedClinic();
  staffId = seeded.staffId;
  sessionId = await createSession(seeded.doctorId, at("10:00"), at("13:00"));
});

const withCtx = <T>(fn: (ctx: Parameters<typeof transitionEntry>[0]) => Promise<T>) =>
  db.transaction(async (tx) => {
    const session = await lockSession(tx, sessionId);
    return fn({ tx, session, actor: { kind: "STAFF", staffId }, now: at("10:05") });
  });

test("changes status, applies the patch and records the event", async () => {
  const e = await insertRawEntry(sessionId, { ticketNo: 1, status: "BOOKED", channel: "PHONE", scheduledAt: at("10:30") });
  const updated = await withCtx((ctx) =>
    transitionEntry(ctx, e, "CHECKED_IN", { type: "CHECK_IN", patch: { checkedInAt: at("10:05") } }),
  );
  expect(updated).toMatchObject({ status: "CHECKED_IN", checkedInAt: at("10:05"), updatedAt: at("10:05") });
  const events = await db.select().from(queueEvents).where(eq(queueEvents.entryId, e.id));
  expect(events).toMatchObject([
    { type: "CHECK_IN", fromStatus: "BOOKED", toStatus: "CHECKED_IN", actorKind: "STAFF", actorStaffId: staffId },
  ]);
});

test("rejects a change the rules do not allow", async () => {
  const e = await insertRawEntry(sessionId, { ticketNo: 1, status: "COMPLETED" });
  await expect(withCtx((ctx) => transitionEntry(ctx, e, "CHECKED_IN", { type: "CHECK_IN" }))).rejects.toMatchObject({
    code: "INVALID_TRANSITION",
  });
});

test("a stale row is a conflict", async () => {
  const e = await insertRawEntry(sessionId, { ticketNo: 1, status: "BOOKED", channel: "PHONE", scheduledAt: at("10:30") });
  await db.update(queueEntries).set({ status: "CANCELLED" }).where(eq(queueEntries.id, e.id));
  await expect(withCtx((ctx) => transitionEntry(ctx, e, "CHECKED_IN", { type: "CHECK_IN" }))).rejects.toMatchObject({
    code: "CONFLICT",
  });
});
