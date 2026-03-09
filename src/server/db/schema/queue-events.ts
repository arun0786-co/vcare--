import { bigserial, index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createdAt } from "./columns";
import { doctorSessions } from "./doctor-sessions";
import { entryStatus } from "./enums";
import { queueEntries } from "./queue-entries";
import { staffUsers } from "./staff";

// Append-only history of every queue change; doubles as the audit log.
export const queueEvents = pgTable(
  "queue_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => doctorSessions.id),
    entryId: uuid("entry_id").references(() => queueEntries.id),
    type: text("type").notNull(),
    fromStatus: entryStatus("from_status"),
    toStatus: entryStatus("to_status"),
    actorKind: text("actor_kind", { enum: ["STAFF", "PATIENT", "SYSTEM"] }).notNull(),
    actorStaffId: uuid("actor_staff_id").references(() => staffUsers.id),
    reason: text("reason"),
    payload: jsonb("payload"),
    createdAt: createdAt(),
  },
  (t) => [index("queue_events_session_time").on(t.sessionId, t.createdAt)],
);
