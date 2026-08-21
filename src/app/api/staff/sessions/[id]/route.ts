import { requireStaff } from "@/server/auth/require-staff";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";
import { getSessionBoard } from "@/server/queue/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const staff = await requireStaff(request);
  const { id } = await params;
  return Response.json(await getSessionBoard(db, id, staff.clinicId, new Date()));
});
