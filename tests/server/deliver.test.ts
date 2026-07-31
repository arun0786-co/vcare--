import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { deliverPending } from "@/server/notify/deliver";
import type { NotificationSender } from "@/server/notify/sender";
import { at } from "../support/time";
import { notificationsOf, setupSession } from "./fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;
let entryId: string;

beforeEach(async () => {
  s = await setupSession();
  entryId = (await s.act({ type: "ADD_WALK_IN", name: "Ravi", phone: "9876543210" }, at("10:00"))).createdEntryId!;
});

test("delivers pending messages and marks them sent", async () => {
  const sent: string[] = [];
  const sender: NotificationSender = { channel: "SIMULATED", send: async (m) => void sent.push(m.to) };
  expect(await deliverPending(db, sender, at("10:01"))).toBe(1);
  expect(sent).toEqual(["+919876543210"]);
  expect(await notificationsOf(entryId)).toMatchObject([{ status: "SENT", channel: "SIMULATED", sentAt: at("10:01"), attempts: 1 }]);
  expect(await deliverPending(db, sender, at("10:02"))).toBe(0);
});

test("gives up after three failed attempts", async () => {
  const failing: NotificationSender = {
    channel: "SMS",
    send: async () => {
      throw new Error("provider down");
    },
  };
  for (const minute of ["10:01", "10:02", "10:03", "10:04"]) await deliverPending(db, failing, at(minute));
  expect(await notificationsOf(entryId)).toMatchObject([{ status: "FAILED", attempts: 3, lastError: "provider down", sentAt: null }]);
});
