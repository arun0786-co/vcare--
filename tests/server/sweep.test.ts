import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { createOnlineBooking } from "@/server/booking/create-booking";
import { db } from "@/server/db/client";
import { doctorSessions } from "@/server/db/schema";
import { runAlertSweep } from "@/server/notify/sweep";
import { findEntryByToken } from "@/server/queue/entries";
import { at } from "../support/time";
import { notificationsOf, setupSession } from "./fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;
let entryId: string;

beforeEach(async () => {
  s = await setupSession();
  const { token } = await createOnlineBooking(
    db,
    { sessionId: s.sessionId, scheduledAt: at("11:00"), name: "Anita", phone: "9876543210", travelMinutes: 20 },
    at("09:00"),
  );
  entryId = (await findEntryByToken(db, token)).id;
});

const alerts = async () => (await notificationsOf(entryId)).filter((n) => n.kind !== "LINK");

test("leave-now goes out once, at early estimate minus travel minus buffer", async () => {
  await db.update(doctorSessions).set({ doctorArrivedAt: at("10:00") }).where(eq(doctorSessions.id, s.sessionId));

  expect(await runAlertSweep(db, at("10:29"))).toBe(0);
  expect(await runAlertSweep(db, at("10:30"))).toBe(1);
  expect(await runAlertSweep(db, at("10:31"))).toBe(0);

  const [leave] = await alerts();
  expect(leave).toMatchObject({ kind: "LEAVE_NOW", dedupeKey: `LEAVE_NOW:${entryId}`, status: "PENDING", toPhone: "+919876543210" });
  expect(leave.payload).toEqual({
    expectedAt: at("11:00").toISOString(),
    earlyAt: at("11:00").toISOString(),
    leaveAt: at("10:30").toISOString(),
  });
  expect(leave.body).toContain("Your turn is expected around 11:00 AM");
});

test("a later doctor delay sends one DELAY", async () => {
  expect(await runAlertSweep(db, at("10:30"))).toBe(1);
  await s.act({ type: "DOCTOR_LATE", expectedStartAt: at("11:30").toISOString() }, at("10:35"));
  expect(await runAlertSweep(db, at("10:36"))).toBe(1);
  expect(await runAlertSweep(db, at("10:37"))).toBe(0);

  const delay = (await alerts()).find((n) => n.kind === "DELAY")!;
  expect(delay.dedupeKey).toBe(`DELAY:${entryId}:1`);
  expect(delay.body).toContain("Dr test is running behind");
});

test("closed sessions and checked-in patients get nothing", async () => {
  await s.act({ type: "CHECK_IN", entryId }, at("10:00"));
  expect(await runAlertSweep(db, at("10:40"))).toBe(0);
  await s.act({ type: "CLOSE_SESSION" }, at("10:41"));
  expect(await runAlertSweep(db, at("10:42"))).toBe(0);
});
