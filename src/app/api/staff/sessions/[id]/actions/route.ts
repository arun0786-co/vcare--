import { requireStaff } from "@/server/auth/require-staff";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";
import { applyAction } from "@/server/queue/apply-action";
import { getSessionBoard } from "@/server/queue/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Applies one staff action and answers with the fresh board, so the screen updates without a second request.
export const POST = handle(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const staff = await requireStaff(request);
  const { id } = await params;
  const action = await request.json();
  const { createdEntryId } = await applyAction(db, {
    sessionId: id,
    clinicId: staff.clinicId,
    actor: { kind: "STAFF", staffId: staff.staffId },
    action,
    now: new Date(),
  });
  const board = await getSessionBoard(db, id, staff.clinicId, new Date());
  return Response.json({ board, createdEntryId });
});
