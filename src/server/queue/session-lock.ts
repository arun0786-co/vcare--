import { QueueError } from "@/domain/errors";
import type { Tx } from "../db/client";
import { loadSession, type SessionInfo } from "./session-info";

export type LockedSession = SessionInfo;

// Row-locks the session for the rest of the transaction. Every queue change takes
// this lock first, so changes to one session happen one after another.
export async function lockSession(tx: Tx, sessionId: string, clinicId?: string): Promise<LockedSession> {
  const session = await loadSession(tx, sessionId, { forUpdate: true });
  if (!session || (clinicId && session.clinicId !== clinicId)) throw new QueueError("NOT_FOUND", "Session not found");
  if (session.timing.closedAt) throw new QueueError("SESSION_CLOSED", "This session is closed");
  return session;
}
