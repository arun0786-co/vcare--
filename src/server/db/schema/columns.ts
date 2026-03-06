import { timestamp, uuid } from "drizzle-orm/pg-core";

export const id = () => uuid("id").primaryKey().defaultRandom();

export const tz = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });

export const createdAt = () => tz("created_at").notNull().defaultNow();
