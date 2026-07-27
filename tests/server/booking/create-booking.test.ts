import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { createOnlineBooking } from "@/server/booking/create-booking";
import { db } from "@/server/db/client";
import { queueEntries, queueEvents } from "@/server/db/schema";
import { at } from "../../support/time";
import { notificationsOf, setupSession } from "../fixtures";
import { createSession } from "../helpers";

let s: Awaited<ReturnType<typeof setupSession>>;

beforeEach(async () => {
  s = await setupSession();
});

const request = (overrides: Partial<Parameters<typeof createOnlineBooking>[1]> = {}) => ({
  sessionId: s.sessionId,
  scheduledAt: at("10:30"),
  name: "Anita",
  phone: "98765 43210",
  travelMinutes: 20,
  ...overrides,
});

test("books a slot and returns the patient's link token", async () => {
  const { token } = await createOnlineBooking(db, request(), at("09:00"));
  expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/);
  const [entry] = await db.select().from(queueEntries).where(eq(queueEntries.publicToken, token));
  expect(entry).toMatchObject({ channel: "ONLINE", status: "BOOKED", scheduledAt: at("10:30"), travelMinutes: 20, patientPhone: "+919876543210" });
  expect(await notificationsOf(entry.id)).toHaveLength(1);
  const events = await db.select().from(queueEvents).where(eq(queueEvents.entryId, entry.id));
  expect(events).toMatchObject([{ type: "ENTRY_CREATED", actorKind: "PATIENT", actorStaffId: null }]);
});

test.each([
  ["off the grid", at("10:07"), at("09:00")],
  ["at session end", at("13:00"), at("09:00")],
  ["already started", at("10:15"), at("10:20")],
])("rejects a slot %s", async (_label, slot, now) => {
  await expect(createOnlineBooking(db, request({ scheduledAt: slot }), now)).rejects.toMatchObject({ code: "VALIDATION" });
});

test("a taken slot, also when two people race for it", async () => {
  await createOnlineBooking(db, request(), at("09:00"));
  await expect(createOnlineBooking(db, request({ phone: "9811111111" }), at("09:00"))).rejects.toMatchObject({ code: "SLOT_TAKEN" });

  const race = await Promise.allSettled([
    createOnlineBooking(db, request({ scheduledAt: at("11:00"), phone: "9822222222" }), at("09:00")),
    createOnlineBooking(db, request({ scheduledAt: at("11:00"), phone: "9833333333" }), at("09:00")),
  ]);
  expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect((race.find((r) => r.status === "rejected") as PromiseRejectedResult).reason).toMatchObject({ code: "SLOT_TAKEN" });
});

test("at most three active bookings per phone in a session", async () => {
  for (const slot of ["10:00", "10:15", "10:30"]) await createOnlineBooking(db, request({ scheduledAt: at(slot) }), at("09:00"));
  await expect(createOnlineBooking(db, request({ scheduledAt: at("10:45") }), at("09:00"))).rejects.toMatchObject({
    code: "VALIDATION",
  });
});

test("bad phone and odd travel time", async () => {
  await expect(createOnlineBooking(db, request({ phone: "12345" }), at("09:00"))).rejects.toMatchObject({ code: "VALIDATION" });
  await expect(createOnlineBooking(db, request({ travelMinutes: 25 }), at("09:00"))).rejects.toMatchObject({ code: "VALIDATION" });
});

test("sessions beyond the booking window", async () => {
  const far = await createSession(s.doctorId, at("10:00", "2026-11-09"), at("13:00", "2026-11-09"), "2026-11-09");
  await expect(
    createOnlineBooking(db, request({ sessionId: far, scheduledAt: at("10:30", "2026-11-09") }), at("09:00")),
  ).rejects.toMatchObject({ code: "VALIDATION" });
});
