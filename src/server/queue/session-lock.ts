import { eq } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import type { SessionTiming } from "@/domain/queue/types";
import type { Tx } from "../db/client";
import { clinics, doctorSessions, doctors } from "../db/schema";
import { isUuid } from "../db/ids";

export interface LockedSession {
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

// Row-locks the session for the rest of the transaction. Every queue change takes
// this lock first, so changes to one session happen one after another.
export async function lockSession(tx: Tx, sessionId: string, clinicId?: string): Promise<LockedSession> {
  if (!isUuid(sessionId)) throw new QueueError("NOT_FOUND", "Session not found");
  const [row] = await tx
    .select({ session: doctorSessions, doctor: doctors, clinic: clinics })
    .from(doctorSessions)
    .innerJoin(doctors, eq(doctors.id, doctorSessions.doctorId))
    .innerJoin(clinics, eq(clinics.id, doctorSessions.clinicId))
    .where(eq(doctorSessions.id, sessionId))
    .for("update", { of: doctorSessions });
  if (!row || (clinicId && row.session.clinicId !== clinicId)) throw new QueueError("NOT_FOUND", "Session not found");
  if (row.session.closedAt) throw new QueueError("SESSION_CLOSED", "This session is closed");

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
