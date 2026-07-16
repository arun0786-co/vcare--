import { and, asc, eq, isNull } from "drizzle-orm";
import { isInBookingWindow } from "@/domain/booking/window";
import { QueueError } from "@/domain/errors";
import { freeSlots } from "@/domain/slots";
import type { Db } from "../db/client";
import { isUuid } from "../db/ids";
import { clinics, doctorSessions, doctors } from "../db/schema";
import { takenSlots } from "../queue/slot-check";
import { ensureSessions } from "../sessions/materialize";

export interface BookingOptions {
  sessions: { sessionId: string; startsAt: string; endsAt: string; freeSlots: string[] }[];
}

export async function getBookingOptions(db: Db, doctorId: string, date: string, now: Date): Promise<BookingOptions> {
  if (!isUuid(doctorId)) throw new QueueError("NOT_FOUND", "Doctor not found");
  const [doctor] = await db
    .select({ doctor: doctors, timezone: clinics.timezone })
    .from(doctors)
    .innerJoin(clinics, eq(clinics.id, doctors.clinicId))
    .where(and(eq(doctors.id, doctorId), eq(doctors.active, true)));
  if (!doctor) throw new QueueError("NOT_FOUND", "Doctor not found");
  if (!isInBookingWindow(date, now, doctor.timezone)) throw new QueueError("VALIDATION", "Bookings open 7 days ahead");

  await ensureSessions(db, doctorId, date, 1);
  const sessions = await db
    .select()
    .from(doctorSessions)
    .where(and(eq(doctorSessions.doctorId, doctorId), eq(doctorSessions.date, date), isNull(doctorSessions.closedAt)))
    .orderBy(asc(doctorSessions.startsAt));

  return {
    sessions: await Promise.all(
      sessions.map(async (s) => ({
        sessionId: s.id,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        freeSlots: freeSlots({
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          slotMinutes: doctor.doctor.slotMinutes,
          taken: await takenSlots(db, s.id),
          now,
        }).map((d) => d.toISOString()),
      })),
    ),
  };
}
