import { date, integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { clinics } from "./clinics";
import { id, tz } from "./columns";
import { doctors } from "./doctors";

// One sitting of one doctor, e.g. Monday 10:00-13:00, plus its live state.
export const doctorSessions = pgTable(
  "doctor_sessions",
  {
    id: id(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    date: date("date", { mode: "string" }).notNull(),
    startsAt: tz("starts_at").notNull(),
    endsAt: tz("ends_at").notNull(),
    expectedStartAt: tz("expected_start_at"),
    doctorArrivedAt: tz("doctor_arrived_at"),
    pausedUntil: tz("paused_until"),
    pauseReason: text("pause_reason"),
    publicNote: text("public_note"),
    closedAt: tz("closed_at"),
    nextTicket: integer("next_ticket").notNull().default(1),
  },
  (t) => [unique("doctor_sessions_doctor_start").on(t.doctorId, t.startsAt)],
);
