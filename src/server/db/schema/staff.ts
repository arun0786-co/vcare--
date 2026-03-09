import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { clinics } from "./clinics";
import { createdAt, id, tz } from "./columns";
import { staffRole } from "./enums";

export const staffUsers = pgTable("staff_users", {
  id: id(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: staffRole("role").notNull(),
});

// id is the sha256 of the cookie token, so a leaked table does not leak sessions.
export const staffSessions = pgTable("staff_sessions", {
  id: text("id").primaryKey(),
  staffUserId: uuid("staff_user_id")
    .notNull()
    .references(() => staffUsers.id),
  expiresAt: tz("expires_at").notNull(),
  createdAt: createdAt(),
});
