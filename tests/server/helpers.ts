import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { clinics, doctorSchedules, doctorSessions, doctors, staffUsers } from "@/server/db/schema";

export async function resetDb(): Promise<void> {
  await db.execute(sql`
    truncate notifications, queue_events, queue_entries, doctor_sessions, doctor_schedules,
      staff_sessions, staff_users, doctors, clinics restart identity cascade
  `);
}

// A clinic with one doctor who works Mondays 10:00-13:00 and 17:00-20:00 IST, and one receptionist.
export async function seedClinic(slug = "test"): Promise<{ clinicId: string; doctorId: string; staffId: string }> {
  const [clinic] = await db.insert(clinics).values({ slug, name: `Clinic ${slug}` }).returning();
  const [doctor] = await db
    .insert(doctors)
    .values({ clinicId: clinic.id, name: `Dr ${slug}` })
    .returning();
  await db.insert(doctorSchedules).values([
    { doctorId: doctor.id, weekday: 1, startTime: "10:00", endTime: "13:00" },
    { doctorId: doctor.id, weekday: 1, startTime: "17:00", endTime: "20:00" },
  ]);
  const [staff] = await db
    .insert(staffUsers)
    .values({ clinicId: clinic.id, name: "Reception", email: `reception@${slug}.test`, passwordHash: "x", role: "RECEPTIONIST" })
    .returning();
  return { clinicId: clinic.id, doctorId: doctor.id, staffId: staff.id };
}

export async function createSession(doctorId: string, startsAt: Date, endsAt: Date, date = "2026-10-26"): Promise<string> {
  const [doctor] = await db.select().from(doctors).where(eq(doctors.id, doctorId));
  const [session] = await db
    .insert(doctorSessions)
    .values({ doctorId, clinicId: doctor.clinicId, date, startsAt, endsAt })
    .returning();
  return session.id;
}
