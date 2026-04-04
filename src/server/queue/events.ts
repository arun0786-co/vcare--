import type { EntryStatus } from "@/domain/queue/types";
import type { Tx } from "../db/client";
import { queueEvents } from "../db/schema";

export type StaffActor = { kind: "STAFF"; staffId: string };
export type Actor = StaffActor | { kind: "PATIENT" } | { kind: "SYSTEM" };

export async function recordEvent(
  tx: Tx,
  e: {
    sessionId: string;
    entryId?: string;
    type: string;
    from?: EntryStatus;
    to?: EntryStatus;
    actor: Actor;
    reason?: string | null;
    payload?: unknown;
    at: Date;
  },
): Promise<void> {
  await tx.insert(queueEvents).values({
    sessionId: e.sessionId,
    entryId: e.entryId,
    type: e.type,
    fromStatus: e.from,
    toStatus: e.to,
    actorKind: e.actor.kind,
    actorStaffId: e.actor.kind === "STAFF" ? e.actor.staffId : null,
    reason: e.reason ?? null,
    payload: e.payload ?? null,
    createdAt: e.at,
  });
}
