import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id } from "./columns";

export const clinics = pgTable("clinics", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  graceMinutes: integer("grace_minutes").notNull().default(10),
  alertBufferMinutes: integer("alert_buffer_minutes").notNull().default(10),
  createdAt: createdAt(),
});
