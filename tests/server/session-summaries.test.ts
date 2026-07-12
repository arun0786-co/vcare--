import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { applyAction } from "@/server/queue/apply-action";
import { listSessionSummaries } from "@/server/queue/session-summaries";
import { at } from "../support/time";
import { resetDb, seedClinic } from "./helpers";

let clinicId: string;
let staffId: string;

beforeEach(async () => {
  await resetDb();
  ({ clinicId, staffId } = await seedClinic());
});

test("lists the day's sessions from the schedule, with how many are waiting", async () => {
  const first = await listSessionSummaries(db, clinicId, "2026-10-26");
  expect(first.map((s) => [s.doctorName, s.startsAt, s.waitingCount])).toEqual([
    ["Dr test", at("10:00").toISOString(), 0],
    ["Dr test", at("17:00").toISOString(), 0],
  ]);

  await applyAction(db, { sessionId: first[0].id, clinicId, actor: { kind: "STAFF", staffId }, action: { type: "ADD_WALK_IN", name: "Ravi" }, now: at("10:00") });
  const again = await listSessionSummaries(db, clinicId, "2026-10-26");
  expect(again.map((s) => s.waitingCount)).toEqual([1, 0]);
});

test("a day without schedule has no sessions", async () => {
  expect(await listSessionSummaries(db, clinicId, "2026-10-27")).toEqual([]);
});
