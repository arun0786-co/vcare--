import { expect, test } from "vitest";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

test("adds a checked-in walk-in and returns its id", async () => {
  const { act } = await setupSession();
  const { createdEntryId } = await act({ type: "ADD_WALK_IN", name: "Ravi", phone: "9876543210" }, at("10:05"));
  expect(await entryById(createdEntryId!)).toMatchObject({ channel: "WALK_IN", status: "CHECKED_IN", patientName: "Ravi" });
});

test("blank phone is fine", async () => {
  const { act } = await setupSession();
  const { createdEntryId } = await act({ type: "ADD_WALK_IN", name: "Meena", phone: "" }, at("10:05"));
  expect((await entryById(createdEntryId!)).patientPhone).toBeNull();
});

test("only on the session's own day", async () => {
  const { act } = await setupSession({ date: "2026-10-27", startsAt: at("10:00", "2026-10-27"), endsAt: at("13:00", "2026-10-27") });
  await expect(act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:05"))).rejects.toMatchObject({
    code: "VALIDATION",
    message: "Only today's session can be run",
  });
});
