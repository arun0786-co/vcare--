import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "@/server/db/client";
import { queueEvents } from "@/server/db/schema";
import { at } from "../../support/time";
import { entryById, setupSession } from "../fixtures";

test("cancels with a reason and frees the slot", async () => {
  const { act } = await setupSession();
  const booking = { type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("10:30").toISOString() };
  const b = (await act(booking, at("09:00"))).createdEntryId!;
  await act({ type: "CANCEL", entryId: b, reason: "called to cancel" }, at("09:10"));

  expect(await entryById(b)).toMatchObject({ status: "CANCELLED" });
  const [event] = await db.select().from(queueEvents).where(eq(queueEvents.entryId, b)).orderBy(queueEvents.id).offset(1);
  expect(event).toMatchObject({ type: "CANCEL", reason: "called to cancel" });
  await expect(act({ ...booking, name: "Ravi" }, at("09:15"))).resolves.toHaveProperty("createdEntryId");
});

test("a finished consultation cannot be cancelled", async () => {
  const { act } = await setupSession();
  const w = (await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"))).createdEntryId!;
  await act({ type: "NEXT", expectedCurrentId: null }, at("10:01"));
  await act({ type: "NEXT", expectedCurrentId: w }, at("10:09"));
  await expect(act({ type: "CANCEL", entryId: w }, at("10:10"))).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
});
