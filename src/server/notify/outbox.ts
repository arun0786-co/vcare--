import type { DbOrTx } from "../db/client";
import { notifications } from "../db/schema";

export type NotificationKind = "LINK" | "LEAVE_NOW" | "DELAY";

// Returns false when an alert with the same dedupe key already exists.
export async function enqueueNotification(
  tx: DbOrTx,
  n: { entryId: string; kind: NotificationKind; dedupeKey: string; toPhone: string; body: string; payload?: unknown },
  now: Date,
): Promise<boolean> {
  const inserted = await tx
    .insert(notifications)
    .values({ ...n, payload: n.payload ?? null, createdAt: now })
    .onConflictDoNothing({ target: notifications.dedupeKey })
    .returning({ id: notifications.id });
  return inserted.length > 0;
}
