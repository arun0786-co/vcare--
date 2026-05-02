import { expect, test } from "vitest";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

test("finishes the patient inside without calling anyone", async () => {
  const { act } = await setupSession();
  const w1 = (await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"))).createdEntryId!;
  const w2 = (await act({ type: "ADD_WALK_IN", name: "Meena" }, at("10:01"))).createdEntryId!;
  await act({ type: "NEXT", expectedCurrentId: null }, at("10:05"));
  await act({ type: "COMPLETE_CURRENT", expectedCurrentId: w1 }, at("10:13"));
  expect(await entryById(w1)).toMatchObject({ status: "COMPLETED", completedAt: at("10:13") });
  expect(await entryById(w2)).toMatchObject({ status: "CHECKED_IN" });
});

test("someone else already finished them: conflict", async () => {
  const { act } = await setupSession();
  const w1 = (await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"))).createdEntryId!;
  await act({ type: "NEXT", expectedCurrentId: null }, at("10:05"));
  await act({ type: "COMPLETE_CURRENT", expectedCurrentId: w1 }, at("10:13"));
  await expect(act({ type: "COMPLETE_CURRENT", expectedCurrentId: w1 }, at("10:13"))).rejects.toMatchObject({
    code: "CONFLICT",
  });
});
