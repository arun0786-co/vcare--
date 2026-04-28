import { expect, test } from "vitest";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

test("books a free slot for a caller", async () => {
  const { act } = await setupSession();
  const { createdEntryId } = await act(
    { type: "ADD_PHONE_BOOKING", name: "Anita", phone: "+91 98765 43210", scheduledAt: at("10:30").toISOString() },
    at("09:00"),
  );
  expect(await entryById(createdEntryId!)).toMatchObject({
    channel: "PHONE",
    status: "BOOKED",
    scheduledAt: at("10:30"),
    patientPhone: "+919876543210",
  });
});

test("works for a session on another day", async () => {
  const { act } = await setupSession({ date: "2026-10-27", startsAt: at("10:00", "2026-10-27"), endsAt: at("13:00", "2026-10-27") });
  const { createdEntryId } = await act(
    { type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:30", "2026-10-27").toISOString() },
    at("16:00"),
  );
  expect(createdEntryId).toBeDefined();
});
