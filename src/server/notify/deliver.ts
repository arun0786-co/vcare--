import { asc, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { notifications } from "../db/schema";
import type { NotificationSender } from "./sender";

const BATCH = 50;
const MAX_ATTEMPTS = 3;

// Sends what the outbox holds. SKIP LOCKED lets two workers run without sending a message twice.
export async function deliverPending(db: Db, sender: NotificationSender, now: Date): Promise<number> {
  return db.transaction(async (tx) => {
    const pending = await tx
      .select()
      .from(notifications)
      .where(eq(notifications.status, "PENDING"))
      .orderBy(asc(notifications.createdAt))
      .limit(BATCH)
      .for("update", { skipLocked: true });

    let delivered = 0;
    for (const n of pending) {
      const attempts = n.attempts + 1;
      try {
        await sender.send({ to: n.toPhone, body: n.body });
        await tx
          .update(notifications)
          .set({ status: "SENT", channel: sender.channel, sentAt: now, attempts })
          .where(eq(notifications.id, n.id));
        delivered += 1;
      } catch (err) {
        await tx
          .update(notifications)
          .set({
            status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
            attempts,
            lastError: err instanceof Error ? err.message : String(err),
          })
          .where(eq(notifications.id, n.id));
      }
    }
    return delivered;
  });
}
