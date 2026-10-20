import { desc } from "drizzle-orm";
import type { DbOrTx } from "../db/client";
import { notifications } from "../db/schema";

export async function listRecentNotifications(db: DbOrTx, limit = 100) {
  return db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      toPhone: notifications.toPhone,
      status: notifications.status,
      body: notifications.body,
      createdAt: notifications.createdAt,
      sentAt: notifications.sentAt,
    })
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
