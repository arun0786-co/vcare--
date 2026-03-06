import { boolean, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { clinics } from "./clinics";
import { id } from "./columns";

export const doctors = pgTable("doctors", {
  id: id(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  name: text("name").notNull(),
  specialty: text("specialty"),
  slotMinutes: integer("slot_minutes").notNull().default(15),
  defaultConsultMinutes: integer("default_consult_minutes").notNull().default(8),
  active: boolean("active").notNull().default(true),
});
