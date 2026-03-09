import { sql } from "drizzle-orm";
import { integer, pgTable, smallint, text, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, tz } from "./columns";
import { doctorSessions } from "./doctor-sessions";
import { channel, entryStatus } from "./enums";

// Every patient in a session: online and phone bookings, and walk-ins.
export const queueEntries = pgTable(
  "queue_entries",
  {
    id: id(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => doctorSessions.id),
    ticketNo: integer("ticket_no").notNull(),
    channel: channel("channel").notNull(),
    status: entryStatus("status").notNull(),
    patientName: text("patient_name").notNull(),
    patientPhone: text("patient_phone"),
    scheduledAt: tz("scheduled_at"),
    checkedInAt: tz("checked_in_at"),
    startedAt: tz("started_at"),
    completedAt: tz("completed_at"),
    passedAt: tz("passed_at"),
    priorityAt: tz("priority_at"),
    priorityReason: text("priority_reason"),
    travelMinutes: smallint("travel_minutes"),
    publicToken: text("public_token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: tz("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("queue_entries_ticket").on(t.sessionId, t.ticketNo),
    uniqueIndex("queue_entries_slot")
      .on(t.sessionId, t.scheduledAt)
      .where(sql`scheduled_at is not null and status <> 'CANCELLED'`),
    uniqueIndex("queue_entries_one_in_consultation")
      .on(t.sessionId)
      .where(sql`status = 'IN_CONSULTATION'`),
  ],
);
