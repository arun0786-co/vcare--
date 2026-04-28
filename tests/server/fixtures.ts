import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { notifications, queueEntries } from "@/server/db/schema";
import { applyAction } from "@/server/queue/apply-action";
import type { ActionContext } from "@/server/queue/context";
import { lockSession } from "@/server/queue/session-lock";
import { at } from "../support/time";
import { createSession, resetDb, seedClinic } from "./helpers";

// A clean database with one clinic and a Monday 10:00-13:00 session, plus a shortcut for staff actions.
export async function setupSession(opts: { date?: string; startsAt?: Date; endsAt?: Date } = {}) {
  await resetDb();
  const { clinicId, doctorId, staffId } = await seedClinic();
  const sessionId = await createSession(doctorId, opts.startsAt ?? at("10:00"), opts.endsAt ?? at("13:00"), opts.date);
  const act = (action: unknown, now: Date) =>
    applyAction(db, { sessionId, clinicId, actor: { kind: "STAFF", staffId }, action, now });
  // Runs fn inside a transaction with the session locked, like a handler would.
  const withCtx = <T>(now: Date, fn: (ctx: ActionContext) => Promise<T>) =>
    db.transaction(async (tx) => fn({ tx, session: await lockSession(tx, sessionId), actor: { kind: "STAFF", staffId }, now }));
  return { clinicId, doctorId, staffId, sessionId, act, withCtx };
}

export async function entriesOf(sessionId: string) {
  return db.select().from(queueEntries).where(eq(queueEntries.sessionId, sessionId)).orderBy(asc(queueEntries.ticketNo));
}

export async function entryById(id: string) {
  const [row] = await db.select().from(queueEntries).where(eq(queueEntries.id, id));
  return row;
}

export async function notificationsOf(entryId: string) {
  return db.select().from(notifications).where(eq(notifications.entryId, entryId));
}
