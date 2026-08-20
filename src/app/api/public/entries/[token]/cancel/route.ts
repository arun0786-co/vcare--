import { cancelByToken } from "@/server/booking/cancel-by-token";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";
import { getPatientStatus } from "@/server/queue/patient-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (_request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  await cancelByToken(db, token, new Date());
  return Response.json(await getPatientStatus(db, token, new Date()));
});
