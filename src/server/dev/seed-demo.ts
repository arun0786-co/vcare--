import { and, eq } from "drizzle-orm";
import { hashPassword } from "../auth/password";
import type { Db } from "../db/client";
import { clinics, doctorSchedules, doctors, staffUsers } from "../db/schema";

const MON_TO_SAT = [1, 2, 3, 4, 5, 6];
const MORNING = { startTime: "10:00", endTime: "13:00" };
const EVENING = { startTime: "17:00", endTime: "20:00" };

const DOCTORS = [
  { name: "Dr. Meera Nair", specialty: "General Physician", hours: [MORNING, EVENING] },
  { name: "Dr. Arjun Rao", specialty: "Paediatrics", hours: [MORNING] },
];

const STAFF = [
  { name: "Reception", email: "reception@demo.test", role: "RECEPTIONIST" as const },
  { name: "Dr. Meera Nair", email: "meera@demo.test", role: "DOCTOR" as const },
];

// A demo clinic for local use. Safe to run repeatedly; it resets weekly hours and passwords.
export async function seedDemo(db: Db, password: string): Promise<void> {
  await db.transaction(async (tx) => {
    const [clinic] = await tx
      .insert(clinics)
      .values({ slug: "demo", name: "Demo Clinic", timezone: "Asia/Kolkata" })
      .onConflictDoUpdate({ target: clinics.slug, set: { name: "Demo Clinic" } })
      .returning();

    for (const d of DOCTORS) {
      let [doctor] = await tx.select().from(doctors).where(and(eq(doctors.clinicId, clinic.id), eq(doctors.name, d.name)));
      doctor ??= (await tx.insert(doctors).values({ clinicId: clinic.id, name: d.name, specialty: d.specialty }).returning())[0];
      await tx.delete(doctorSchedules).where(eq(doctorSchedules.doctorId, doctor.id));
      await tx
        .insert(doctorSchedules)
        .values(MON_TO_SAT.flatMap((weekday) => d.hours.map((h) => ({ doctorId: doctor.id, weekday, ...h }))));
    }

    const passwordHash = await hashPassword(password);
    for (const s of STAFF) {
      await tx
        .insert(staffUsers)
        .values({ clinicId: clinic.id, ...s, passwordHash })
        .onConflictDoUpdate({ target: staffUsers.email, set: { passwordHash, name: s.name, role: s.role } });
    }
  });
}
