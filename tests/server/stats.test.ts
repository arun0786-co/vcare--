import { beforeEach, expect, test } from "vitest";
import { addMinutes } from "@/domain/clock";
import { db } from "@/server/db/client";
import { loadDurationStats } from "@/server/queue/stats";
import { at } from "../support/time";
import { createSession, insertRawEntry, resetDb, seedClinic } from "./helpers";

let doctorId: string;
let sessionId: string;

beforeEach(async () => {
  await resetDb();
  ({ doctorId } = await seedClinic());
  sessionId = await createSession(doctorId, at("10:00"), at("13:00"));
});

const completed = (ticketNo: number, startedAt: Date, minutes: number) =>
  insertRawEntry(sessionId, { ticketNo, status: "COMPLETED", startedAt, completedAt: addMinutes(startedAt, minutes) });

test("median and 25th percentile of recent consultations", async () => {
  const durations = [4, 6, 8, 10, 12, 14];
  for (const [i, m] of durations.entries()) await completed(i + 1, addMinutes(at("10:00"), i * 15), m);
  expect(await loadDurationStats(db, doctorId, at("12:00"))).toEqual({ median: 9, p25: 6.5, samples: 6 });
});

test("ignores consultations older than 30 days and other doctors", async () => {
  for (const [i, m] of [4, 6, 8, 10, 12].entries()) await completed(i + 1, addMinutes(at("10:00"), i * 15), m);
  const old = await createSession(doctorId, at("10:00", "2026-09-20"), at("13:00", "2026-09-20"), "2026-09-20");
  await insertRawEntry(old, { ticketNo: 1, status: "COMPLETED", startedAt: at("10:00", "2026-09-20"), completedAt: at("10:50", "2026-09-20") });
  const other = await seedClinic("other");
  const otherSession = await createSession(other.doctorId, at("10:00"), at("13:00"));
  await insertRawEntry(otherSession, { ticketNo: 1, status: "COMPLETED", startedAt: at("10:00"), completedAt: at("10:45") });

  expect(await loadDurationStats(db, doctorId, at("12:00"))).toEqual({ median: 8, p25: 6, samples: 5 });
});

test("falls back to the doctor's default with little data", async () => {
  await completed(1, at("10:00"), 20);
  expect(await loadDurationStats(db, doctorId, at("12:00"))).toEqual({ median: 8, p25: 6, samples: 1 });
});
