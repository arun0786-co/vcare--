import { index, integer, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, tz } from "./columns";
import { notificationKind, notificationStatus } from "./enums";
import { queueEntries } from "./queue-entries";

// Outbox: alerts are written here first and delivered by the worker.
// dedupe_key makes re-planning the same alert a no-op.
export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => queueEntries.id),
    kind: notificationKind("kind").notNull(),
    dedupeKey: text("dedupe_key").notNull().unique(),
    toPhone: text("to_phone").notNull(),
    channel: text("channel"),
    body: text("body").notNull(),
    payload: jsonb("payload"),
    status: notificationStatus("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: createdAt(),
    sentAt: tz("sent_at"),
  },
  (t) => [index("notifications_status").on(t.status)],
);
