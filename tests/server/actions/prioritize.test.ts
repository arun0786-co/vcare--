import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "@/server/db/client";
import { queueEvents } from "@/server/db/schema";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

test("a prioritized patient is called next, and the reason is kept", async () => {
  const { act, staffId } = await setupSession();
  const first = (await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"))).createdEntryId!;
  const urgent = (await act({ type: "ADD_WALK_IN", name: "Meena" }, at("10:05"))).createdEntryId!;
  await act({ type: "PRIORITIZE", entryId: urgent, reason: "chest pain" }, at("10:06"));
  await act({ type: "NEXT", expectedCurrentId: null }, at("10:07"));

  expect(await entryById(urgent)).toMatchObject({ status: "IN_CONSULTATION", priorityReason: "chest pain" });
  expect(await entryById(first)).toMatchObject({ status: "CHECKED_IN" });
  const events = await db.select().from(queueEvents).where(eq(queueEvents.type, "PRIORITIZE"));
  expect(events).toMatchObject([{ entryId: urgent, reason: "chest pain", actorStaffId: staffId }]);
});

test("needs a reason", async () => {
  const { act } = await setupSession();
  const w = (await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"))).createdEntryId!;
  await expect(act({ type: "PRIORITIZE", entryId: w, reason: "" }, at("10:01"))).rejects.toMatchObject({
    code: "VALIDATION",
  });
});

test("only for patients who are waiting", async () => {
  const { act } = await setupSession();
  const b = (await act({ type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:30").toISOString() }, at("09:00")))
    .createdEntryId!;
  await expect(act({ type: "PRIORITIZE", entryId: b, reason: "urgent" }, at("10:01"))).rejects.toMatchObject({
    code: "VALIDATION",
  });
});
