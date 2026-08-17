import { QueueError } from "@/domain/errors";
import { getBookingOptions } from "@/server/booking/booking-options";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request, { params }: { params: Promise<{ doctorId: string }> }) => {
  const { doctorId } = await params;
  const date = new URL(request.url).searchParams.get("date");
  if (!date) throw new QueueError("VALIDATION", "Pick a date");
  return Response.json(await getBookingOptions(db, doctorId, date, new Date()));
});
