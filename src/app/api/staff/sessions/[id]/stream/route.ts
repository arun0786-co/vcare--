import { QueueError } from "@/domain/errors";
import { requireStaff } from "@/server/auth/require-staff";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";
import { loadSession } from "@/server/queue/session-info";
import { sseResponse } from "@/server/realtime/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const staff = await requireStaff(request);
  const { id } = await params;
  const session = await loadSession(db, id);
  if (!session || session.clinicId !== staff.clinicId) throw new QueueError("NOT_FOUND", "Session not found");
  return sseResponse(session.id, request.signal);
});
