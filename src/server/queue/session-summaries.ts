import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { doctorSessions, doctors, queueEntries } from "../db/schema";
import { ensureClinicSessions } from "../sessions/materialize";
import type { SessionSummary } from "./views";

// The reception's list of sittings for one day. Creates them from the schedule on first look.
export async function listSessionSummaries(db: Db, clinicId: string, date: string): Promise<SessionSummary[]> {
  await ensureClinicSessions(db, clinicId, date, 1);
  const waiting = db
    .select({ sessionId: queueEntries.sessionId, count: sql<number>`count(*)::int`.as("count") })
    .from(queueEntries)
    .where(eq(queueEntries.status, "CHECKED_IN"))
    .groupBy(queueEntries.sessionId)
    .as("waiting");
  const rows = await db
    .select({ session: doctorSessions, doctorName: doctors.name, waitingCount: waiting.count })
    .from(doctorSessions)
    .innerJoin(doctors, eq(doctors.id, doctorSessions.doctorId))
    .leftJoin(waiting, eq(waiting.sessionId, doctorSessions.id))
    .where(and(eq(doctorSessions.clinicId, clinicId), eq(doctorSessions.date, date)))
    .orderBy(asc(doctorSessions.startsAt), asc(doctors.name));
  return rows.map((r) => ({
    id: r.session.id,
    doctorName: r.doctorName,
    startsAt: r.session.startsAt.toISOString(),
    endsAt: r.session.endsAt.toISOString(),
    closedAt: r.session.closedAt?.toISOString() ?? null,
    waitingCount: r.waitingCount ?? 0,
  }));
}
