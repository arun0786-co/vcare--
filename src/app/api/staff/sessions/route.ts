import { eq } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import { clinicDateString } from "@/domain/time";
import { requireStaff } from "@/server/auth/require-staff";
import { db } from "@/server/db/client";
import { clinics } from "@/server/db/schema";
import { handle } from "@/server/http";
import { listSessionSummaries } from "@/server/queue/session-summaries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ?date=YYYY-MM-DD, defaulting to today in the clinic's timezone.
export const GET = handle(async (request: Request) => {
  const staff = await requireStaff(request);
  let date = new URL(request.url).searchParams.get("date");
  if (!date) {
    const [clinic] = await db.select({ timezone: clinics.timezone }).from(clinics).where(eq(clinics.id, staff.clinicId));
    date = clinicDateString(new Date(), clinic.timezone);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new QueueError("VALIDATION", "Use a date like 2026-10-26");
  return Response.json({ sessions: await listSessionSummaries(db, staff.clinicId, date) });
});
