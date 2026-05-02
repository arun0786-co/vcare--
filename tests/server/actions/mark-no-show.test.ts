import { expect, test } from "vitest";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

test("marks a booked patient absent and starts their grace", async () => {
  const { act } = await setupSession();
  const b = (await act({ type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:30").toISOString() }, at("09:00")))
    .createdEntryId!;
  await act({ type: "MARK_NO_SHOW", entryId: b }, at("10:35"));
  expect(await entryById(b)).toMatchObject({ status: "NO_SHOW", passedAt: at("10:35") });
});

test("keeps an earlier passed-over time", async () => {
  const { act } = await setupSession();
  const b = (await act({ type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:15").toISOString() }, at("09:00")))
    .createdEntryId!;
  await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:20"));
  await act({ type: "NEXT", expectedCurrentId: null }, at("10:25"));
  await act({ type: "MARK_NO_SHOW", entryId: b }, at("10:40"));
  expect(await entryById(b)).toMatchObject({ status: "NO_SHOW", passedAt: at("10:25") });
});

test("a walk-in who left can be marked too", async () => {
  const { act } = await setupSession();
  const w = (await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"))).createdEntryId!;
  await act({ type: "MARK_NO_SHOW", entryId: w }, at("10:30"));
  expect(await entryById(w)).toMatchObject({ status: "NO_SHOW" });
});
