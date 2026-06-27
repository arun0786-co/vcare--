import { and, desc, eq, gte, isNotNull } from "drizzle-orm";
import { addMinutes, minutesBetween } from "@/domain/clock";
import { durationStats } from "@/domain/estimate/durations";
import { DEFAULTS, type DurationStats } from "@/domain/queue/types";
import type { DbOrTx } from "../db/client";
import { doctorSessions, doctors, queueEntries } from "../db/schema";

// Consultation lengths from the doctor's own recent history.
export async function loadDurationStats(db: DbOrTx, doctorId: string, now: Date): Promise<DurationStats> {
  const since = addMinutes(now, -DEFAULTS.durationWindowDays * 24 * 60);
  const [doctor] = await db.select({ defaultMinutes: doctors.defaultConsultMinutes }).from(doctors).where(eq(doctors.id, doctorId));
  const rows = await db
    .select({ startedAt: queueEntries.startedAt, completedAt: queueEntries.completedAt })
    .from(queueEntries)
    .innerJoin(doctorSessions, eq(doctorSessions.id, queueEntries.sessionId))
    .where(
      and(
        eq(doctorSessions.doctorId, doctorId),
        eq(queueEntries.status, "COMPLETED"),
        isNotNull(queueEntries.startedAt),
        isNotNull(queueEntries.completedAt),
        gte(queueEntries.completedAt, since),
      ),
    )
    .orderBy(desc(queueEntries.completedAt))
    .limit(DEFAULTS.durationSampleLimit);
  const samples = rows.map((r) => minutesBetween(r.startedAt!, r.completedAt!));
  return durationStats(samples, doctor?.defaultMinutes ?? DEFAULTS.defaultConsultMinutes);
}
