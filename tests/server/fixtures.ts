import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { notifications, queueEntries } from "@/server/db/schema";
import { applyAction } from "@/server/queue/apply-action";
import { at } from "../support/time";
import { createSession, resetDb, seedClinic } from "./helpers";

// A clean database with one clinic and a Monday 10:00-13:00 session, plus a shortcut for staff actions.
export async function setupSession(opts: { date?: string; startsAt?: Date; endsAt?: Date } = {}) {
  await resetDb();
  const { clinicId, doctorId, staffId } = await seedClinic();
  const sessionId = await createSession(doctorId, opts.startsAt ?? at("10:00"), opts.endsAt ?? at("13:00"), opts.date);
  const act = (action: unknown, now: Date) =>
    applyAction(db, { sessionId, clinicId, actor: { kind: "STAFF", staffId }, action, now });
  return { clinicId, doctorId, staffId, sessionId, act };
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
