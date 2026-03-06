import { pgEnum } from "drizzle-orm/pg-core";
import { CHANNELS, ENTRY_STATUSES } from "@/domain/queue/types";

export const entryStatus = pgEnum("entry_status", ENTRY_STATUSES);
export const channel = pgEnum("channel", CHANNELS);
export const staffRole = pgEnum("staff_role", ["ADMIN", "RECEPTIONIST", "DOCTOR"]);
export const notificationKind = pgEnum("notification_kind", ["LINK", "LEAVE_NOW", "DELAY"]);
export const notificationStatus = pgEnum("notification_status", ["PENDING", "SENT", "FAILED"]);
