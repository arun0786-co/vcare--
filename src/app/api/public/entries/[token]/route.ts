import { parseTravelUpdate } from "@/domain/booking/request";
import { setTravelMinutes } from "@/server/booking/set-travel";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";
import { getPatientStatus } from "@/server/queue/patient-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ token: string }> };

export const GET = handle(async (_request: Request, { params }: Ctx) => {
  const { token } = await params;
  return Response.json(await getPatientStatus(db, token, new Date()));
});

export const PATCH = handle(async (request: Request, { params }: Ctx) => {
  const { token } = await params;
  const { travelMinutes } = parseTravelUpdate(await request.json());
  await setTravelMinutes(db, token, travelMinutes, new Date());
  return Response.json(await getPatientStatus(db, token, new Date()));
});
