import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { doctorSessions, queueEvents } from "@/server/db/schema";
import { insertEntry } from "@/server/queue/insert-entry";
import { at } from "../support/time";
import { notificationsOf, setupSession } from "./fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;

beforeEach(async () => {
  s = await setupSession();
});

test("walk-in: normalized phone, checked in now, numbered tickets, link message", async () => {
  const first = await s.withCtx(at("10:05"), (ctx) =>
    insertEntry(ctx, { channel: "WALK_IN", name: "Ravi", phone: "098765 43210", scheduledAt: null }),
  );
  const second = await s.withCtx(at("10:06"), (ctx) =>
    insertEntry(ctx, { channel: "WALK_IN", name: "Meena", phone: null, scheduledAt: null }),
  );

  expect(first).toMatchObject({
    ticketNo: 1,
    status: "CHECKED_IN",
    checkedInAt: at("10:05"),
    patientPhone: "+919876543210",
  });
  expect(first.publicToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
  expect(second).toMatchObject({ ticketNo: 2, patientPhone: null });

  const [link] = await notificationsOf(first.id);
  expect(link).toMatchObject({ kind: "LINK", status: "PENDING", toPhone: "+919876543210", dedupeKey: `LINK:${first.id}` });
  expect(link.body).toContain("ticket 1");
  expect(link.body).toContain(`/q/${first.publicToken}`);
  expect(await notificationsOf(second.id)).toEqual([]);

  const [session] = await db.select().from(doctorSessions).where(eq(doctorSessions.id, s.sessionId));
  expect(session.nextTicket).toBe(3);
  const events = await db.select().from(queueEvents).where(eq(queueEvents.entryId, first.id));
  expect(events).toMatchObject([{ type: "ENTRY_CREATED", toStatus: "CHECKED_IN", actorStaffId: s.staffId }]);
});

test("booking: BOOKED at its slot, slot time in the message", async () => {
  const b = await s.withCtx(at("09:00"), (ctx) =>
    insertEntry(ctx, { channel: "PHONE", name: "Anita", phone: "9876543210", scheduledAt: at("10:30"), travelMinutes: 20 }),
  );
  expect(b).toMatchObject({ status: "BOOKED", scheduledAt: at("10:30"), checkedInAt: null, travelMinutes: 20 });
  const [link] = await notificationsOf(b.id);
  expect(link.body).toContain("slot 10:30 AM");
});

test.each([
  ["a bad phone", { channel: "WALK_IN" as const, name: "X", phone: "12345", scheduledAt: null }],
  ["a booking without phone", { channel: "PHONE" as const, name: "X", phone: null, scheduledAt: at("10:30") }],
  ["a booking without slot", { channel: "PHONE" as const, name: "X", phone: "9876543210", scheduledAt: null }],
  ["a walk-in with a slot", { channel: "WALK_IN" as const, name: "X", phone: null, scheduledAt: at("10:30") }],
  ["an odd travel time", { channel: "PHONE" as const, name: "X", phone: "9876543210", scheduledAt: at("10:30"), travelMinutes: 25 }],
])("rejects %s", async (_label, input) => {
  await expect(s.withCtx(at("09:00"), (ctx) => insertEntry(ctx, input))).rejects.toMatchObject({ code: "VALIDATION" });
});

test("the slot must be free", async () => {
  const input = { channel: "PHONE" as const, name: "A", phone: "9876543210", scheduledAt: at("10:30") };
  await s.withCtx(at("09:00"), (ctx) => insertEntry(ctx, input));
  await expect(s.withCtx(at("09:00"), (ctx) => insertEntry(ctx, input))).rejects.toMatchObject({ code: "SLOT_TAKEN" });
});
