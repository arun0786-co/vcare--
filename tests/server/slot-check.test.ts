import { beforeEach, expect, test } from "vitest";
import { assertSlotFree } from "@/server/queue/slot-check";
import { at } from "../support/time";
import { setupSession } from "./fixtures";
import { insertRawEntry } from "./helpers";

let s: Awaited<ReturnType<typeof setupSession>>;

beforeEach(async () => {
  s = await setupSession();
  await insertRawEntry(s.sessionId, { ticketNo: 1, status: "BOOKED", channel: "PHONE", scheduledAt: at("10:15") });
  await insertRawEntry(s.sessionId, { ticketNo: 2, status: "CANCELLED", channel: "PHONE", scheduledAt: at("10:45") });
});

test("a free grid slot passes, including one freed by a cancellation", async () => {
  await expect(s.withCtx(at("09:00"), (ctx) => assertSlotFree(ctx, at("10:30")))).resolves.toBeUndefined();
  await expect(s.withCtx(at("09:00"), (ctx) => assertSlotFree(ctx, at("10:45")))).resolves.toBeUndefined();
});

test("a taken slot is SLOT_TAKEN", async () => {
  await expect(s.withCtx(at("09:00"), (ctx) => assertSlotFree(ctx, at("10:15")))).rejects.toMatchObject({
    code: "SLOT_TAKEN",
  });
});

test.each([
  ["off the grid", at("09:00"), at("10:07")],
  ["at session end", at("09:00"), at("13:00")],
  ["already started", at("10:20"), at("10:15")],
  ["in the past", at("10:20"), at("10:00")],
])("a slot %s is VALIDATION", async (_label, now, slot) => {
  await expect(s.withCtx(now, (ctx) => assertSlotFree(ctx, slot))).rejects.toMatchObject({ code: "VALIDATION" });
});
