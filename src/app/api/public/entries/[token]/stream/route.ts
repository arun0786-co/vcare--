import { db } from "@/server/db/client";
import { handle } from "@/server/http";
import { findEntryByToken } from "@/server/queue/entries";
import { sseResponse } from "@/server/realtime/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (request: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params;
  const entry = await findEntryByToken(db, token);
  return sseResponse(entry.sessionId, request.signal);
});
