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
