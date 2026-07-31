import { and, asc, inArray } from "drizzle-orm";
import type { AlertHistory } from "@/domain/notify/plan";
import type { DbOrTx } from "../db/client";
import { notifications } from "../db/schema";

// What each patient has already been told, read back from the outbox.
export async function loadAlertHistory(db: DbOrTx, entryIds: string[]): Promise<Map<string, AlertHistory>> {
  const history = new Map<string, AlertHistory>();
  if (entryIds.length === 0) return history;
  const rows = await db
    .select({ entryId: notifications.entryId, kind: notifications.kind, payload: notifications.payload })
    .from(notifications)
    .where(and(inArray(notifications.entryId, entryIds), inArray(notifications.kind, ["LEAVE_NOW", "DELAY"])))
    .orderBy(asc(notifications.createdAt));
  for (const row of rows) {
    const earlyAt = new Date((row.payload as { earlyAt: string }).earlyAt);
    const h = history.get(row.entryId) ?? { leaveNowEarlyAt: null, lastAlertEarlyAt: null, delayCount: 0 };
    if (row.kind === "LEAVE_NOW") h.leaveNowEarlyAt = earlyAt;
    else h.delayCount += 1;
    h.lastAlertEarlyAt = earlyAt;
    history.set(row.entryId, h);
  }
  return history;
}
