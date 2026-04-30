import { beforeEach, expect, test } from "vitest";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;
let bookingId: string;

beforeEach(async () => {
  s = await setupSession();
  const r = await s.act(
    { type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:30").toISOString() },
    at("09:00"),
  );
  bookingId = r.createdEntryId!;
});

test("marks a booked patient as arrived", async () => {
  await s.act({ type: "CHECK_IN", entryId: bookingId }, at("10:20"));
  expect(await entryById(bookingId)).toMatchObject({ status: "CHECKED_IN", checkedInAt: at("10:20") });
});

test("checking in twice is an invalid transition", async () => {
  await s.act({ type: "CHECK_IN", entryId: bookingId }, at("10:20"));
  await expect(s.act({ type: "CHECK_IN", entryId: bookingId }, at("10:21"))).rejects.toMatchObject({
    code: "INVALID_TRANSITION",
  });
});

test("an entry from another session is NOT_FOUND", async () => {
  await expect(
    s.act({ type: "CHECK_IN", entryId: "6f1c1f3e-8a2b-4c3d-9e4f-5a6b7c8d9e0f" }, at("10:20")),
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
});
