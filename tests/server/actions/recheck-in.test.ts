import { beforeEach, expect, test } from "vitest";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;
let booking: string;

beforeEach(async () => {
  s = await setupSession();
  booking = (
    await s.act({ type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:30").toISOString() }, at("09:00"))
  ).createdEntryId!;
  await s.act({ type: "MARK_NO_SHOW", entryId: booking }, at("10:35"));
});

test("back within grace of the no-show: keeps the slot's place", async () => {
  const walk = (await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:38"))).createdEntryId!;
  await s.act({ type: "RECHECK_IN", entryId: booking }, at("10:40"));
  expect(await entryById(booking)).toMatchObject({ status: "CHECKED_IN", checkedInAt: at("10:40") });
  await s.act({ type: "NEXT", expectedCurrentId: null }, at("10:41"));
  expect(await entryById(booking)).toMatchObject({ status: "IN_CONSULTATION" });
  expect(await entryById(walk)).toMatchObject({ status: "CHECKED_IN" });
});

test("back after grace: joins at the current time", async () => {
  const walk = (await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:45"))).createdEntryId!;
  await s.act({ type: "RECHECK_IN", entryId: booking }, at("10:50"));
  await s.act({ type: "NEXT", expectedCurrentId: null }, at("10:51"));
  expect(await entryById(walk)).toMatchObject({ status: "IN_CONSULTATION" });
  expect(await entryById(booking)).toMatchObject({ status: "CHECKED_IN" });
});

test("only no-shows can be re-checked in", async () => {
  const walk = (await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:45"))).createdEntryId!;
  await expect(s.act({ type: "RECHECK_IN", entryId: walk }, at("10:50"))).rejects.toMatchObject({
    code: "INVALID_TRANSITION",
  });
});
