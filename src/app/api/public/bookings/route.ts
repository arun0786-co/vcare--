import { parseBookingRequest } from "@/domain/booking/request";
import { createOnlineBooking } from "@/server/booking/create-booking";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  const input = parseBookingRequest(await request.json());
  return Response.json(await createOnlineBooking(db, input, new Date()), { status: 201 });
});
