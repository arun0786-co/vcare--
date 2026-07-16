import { beforeEach, expect, test } from "vitest";
import { getBookingOptions } from "@/server/booking/booking-options";
import { db } from "@/server/db/client";
import { applyAction } from "@/server/queue/apply-action";
import { at } from "../../support/time";
import { resetDb, seedClinic } from "../helpers";

let seeded: Awaited<ReturnType<typeof seedClinic>>;

beforeEach(async () => {
  await resetDb();
  seeded = await seedClinic();
});

test("free slots per session, taken ones removed", async () => {
  const first = await getBookingOptions(db, seeded.doctorId, "2026-10-26", at("08:00"));
  expect(first.sessions).toHaveLength(2);
  expect(first.sessions[0].freeSlots).toHaveLength(12);
  expect(first.sessions[0].freeSlots[0]).toBe(at("10:00").toISOString());

  await applyAction(db, {
    sessionId: first.sessions[0].sessionId,
    clinicId: seeded.clinicId,
    actor: { kind: "STAFF", staffId: seeded.staffId },
    action: { type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:00").toISOString() },
    now: at("08:00"),
  });
  const after = await getBookingOptions(db, seeded.doctorId, "2026-10-26", at("10:20"));
  expect(after.sessions[0].freeSlots[0]).toBe(at("10:30").toISOString());
  expect(after.sessions[0].freeSlots).not.toContain(at("10:00").toISOString());
});

test("closed sessions offer nothing", async () => {
  const { sessions } = await getBookingOptions(db, seeded.doctorId, "2026-10-26", at("08:00"));
  await applyAction(db, {
    sessionId: sessions[0].sessionId,
    clinicId: seeded.clinicId,
    actor: { kind: "STAFF", staffId: seeded.staffId },
    action: { type: "CLOSE_SESSION" },
    now: at("08:00"),
  });
  expect((await getBookingOptions(db, seeded.doctorId, "2026-10-26", at("08:00"))).sessions).toHaveLength(1);
});

test("only the next seven days", async () => {
  await expect(getBookingOptions(db, seeded.doctorId, "2026-11-02", at("08:00"))).rejects.toMatchObject({ code: "VALIDATION" });
  await expect(getBookingOptions(db, seeded.doctorId, "2026-10-25", at("08:00"))).rejects.toMatchObject({ code: "VALIDATION" });
});

test("unknown doctor is NOT_FOUND", async () => {
  await expect(getBookingOptions(db, "nope", "2026-10-26", at("08:00"))).rejects.toMatchObject({ code: "NOT_FOUND" });
});
