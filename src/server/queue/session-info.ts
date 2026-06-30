import { eq } from "drizzle-orm";
import type { SessionTiming } from "@/domain/queue/types";
import type { DbOrTx } from "../db/client";
import { isUuid } from "../db/ids";
import { clinics, doctorSessions, doctors } from "../db/schema";

export interface SessionInfo {
  id: string;
  clinicId: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  date: string;
  timezone: string;
  graceMinutes: number;
  alertBufferMinutes: number;
  slotMinutes: number;
  defaultConsultMinutes: number;
  timing: SessionTiming;
  nextTicket: number;
}

// A session with its doctor's and clinic's settings. forUpdate row-locks it (needs a transaction).
export async function loadSession(db: DbOrTx, sessionId: string, opts: { forUpdate?: boolean } = {}): Promise<SessionInfo | null> {
  if (!isUuid(sessionId)) return null;
  const query = db
    .select({ session: doctorSessions, doctor: doctors, clinic: clinics })
    .from(doctorSessions)
    .innerJoin(doctors, eq(doctors.id, doctorSessions.doctorId))
    .innerJoin(clinics, eq(clinics.id, doctorSessions.clinicId))
    .where(eq(doctorSessions.id, sessionId));
  const [row] = opts.forUpdate ? await query.for("update", { of: doctorSessions }) : await query;
  if (!row) return null;

  const { session, doctor, clinic } = row;
  return {
    id: session.id,
    clinicId: session.clinicId,
    doctorId: doctor.id,
    doctorName: doctor.name,
    clinicName: clinic.name,
    date: session.date,
    timezone: clinic.timezone,
    graceMinutes: clinic.graceMinutes,
    alertBufferMinutes: clinic.alertBufferMinutes,
    slotMinutes: doctor.slotMinutes,
    defaultConsultMinutes: doctor.defaultConsultMinutes,
    timing: {
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      expectedStartAt: session.expectedStartAt,
      doctorArrivedAt: session.doctorArrivedAt,
      pausedUntil: session.pausedUntil,
      closedAt: session.closedAt,
    },
    nextTicket: session.nextTicket,
  };
}
