import { beforeEach, expect, test } from "vitest";
import { asc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { doctorSessions } from "@/server/db/schema";
import { ensureSessions } from "@/server/sessions/materialize";
import { resetDb, seedClinic } from "./helpers";

let doctorId: string;

beforeEach(async () => {
  await resetDb();
  ({ doctorId } = await seedClinic());
});

test("monday schedule in IST becomes UTC sessions", async () => {
  await ensureSessions(db, doctorId, "2026-10-26", 7);
  const rows = await db.select().from(doctorSessions).orderBy(asc(doctorSessions.startsAt));
  expect(rows.map((r) => [r.date, r.startsAt.toISOString(), r.endsAt.toISOString()])).toEqual([
    ["2026-10-26", "2026-10-26T04:30:00.000Z", "2026-10-26T07:30:00.000Z"],
    ["2026-10-26", "2026-10-26T11:30:00.000Z", "2026-10-26T14:30:00.000Z"],
  ]);
});

test("running again creates nothing new", async () => {
  await ensureSessions(db, doctorId, "2026-10-26", 7);
  await ensureSessions(db, doctorId, "2026-10-20", 14);
  const rows = await db.select().from(doctorSessions);
  expect(rows.map((r) => r.date).sort()).toEqual(["2026-10-26", "2026-10-26", "2026-11-02", "2026-11-02"]);
});
