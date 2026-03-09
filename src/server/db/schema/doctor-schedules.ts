import { sql } from "drizzle-orm";
import { check, pgTable, smallint, time, uuid } from "drizzle-orm/pg-core";
import { id } from "./columns";
import { doctors } from "./doctors";

// Weekly hours. weekday follows Postgres extract(dow): 0 is Sunday.
export const doctorSchedules = pgTable(
  "doctor_schedules",
  {
    id: id(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id),
    weekday: smallint("weekday").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
  },
  () => [
    check("doctor_schedules_weekday", sql`weekday between 0 and 6`),
    check("doctor_schedules_order", sql`end_time > start_time`),
  ],
);
