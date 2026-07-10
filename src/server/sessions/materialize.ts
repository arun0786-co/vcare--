import { and, eq, sql } from "drizzle-orm";
import type { DbOrTx } from "../db/client";
import { doctors } from "../db/schema";

// Creates the doctor's sessions for each day in [fromDate, fromDate + days) from the
// weekly schedule. Wall times are read in the clinic's timezone. Safe to repeat.
export async function ensureSessions(db: DbOrTx, doctorId: string, fromDate: string, days: number): Promise<void> {
  await db.execute(sql`
    insert into doctor_sessions (doctor_id, clinic_id, date, starts_at, ends_at)
    select d.id, d.clinic_id, day::date,
      (day::date + s.start_time) at time zone c.timezone,
      (day::date + s.end_time) at time zone c.timezone
    from doctors d
    join clinics c on c.id = d.clinic_id
    join doctor_schedules s on s.doctor_id = d.id
    cross join generate_series(${fromDate}::timestamp, ${fromDate}::timestamp + make_interval(days => ${days} - 1), interval '1 day') as day
    where d.id = ${doctorId} and d.active and extract(dow from day) = s.weekday
    on conflict (doctor_id, starts_at) do nothing
  `);
}

export async function ensureClinicSessions(db: DbOrTx, clinicId: string, fromDate: string, days: number): Promise<void> {
  const rows = await db
    .select({ id: doctors.id })
    .from(doctors)
    .where(and(eq(doctors.clinicId, clinicId), eq(doctors.active, true)));
  for (const { id } of rows) await ensureSessions(db, id, fromDate, days);
}
