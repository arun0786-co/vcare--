import { afterAll, beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { applyAction } from "@/server/queue/apply-action";
import { closeRealtimeHub, subscribeSession } from "@/server/realtime/hub";
import { at } from "../support/time";
import { setupSession } from "./fixtures";
import { createSession } from "./helpers";

async function waitFor(check: () => boolean, ms = 2000): Promise<void> {
  const until = Date.now() + ms;
  while (!check()) {
    if (Date.now() > until) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 20));
  }
}

const settle = () => new Promise((r) => setTimeout(r, 200));

let s: Awaited<ReturnType<typeof setupSession>>;

beforeEach(async () => {
  s = await setupSession();
});

afterAll(async () => {
  await closeRealtimeHub();
});

test("a subscriber hears its own session's changes until it unsubscribes", async () => {
  const other = await createSession(s.doctorId, at("17:00"), at("20:00"));
  let calls = 0;
  const unsubscribe = await subscribeSession(s.sessionId, () => calls++);

  await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:00"));
  await waitFor(() => calls === 1);

  await s.act({ type: "SET_NOTE", note: "hello" }, at("10:00"));
  await waitFor(() => calls === 2);

  await applyAction(db, { sessionId: other, clinicId: s.clinicId, actor: { kind: "STAFF", staffId: s.staffId }, action: { type: "SET_NOTE", note: "x" }, now: at("10:00") });
  await settle();
  expect(calls).toBe(2);

  unsubscribe();
  await s.act({ type: "SET_NOTE", note: "bye" }, at("10:00"));
  await settle();
  expect(calls).toBe(2);
});

test("a failed action publishes nothing", async () => {
  let calls = 0;
  const unsubscribe = await subscribeSession(s.sessionId, () => calls++);
  await expect(s.act({ type: "NEXT", expectedCurrentId: null }, at("10:00"))).rejects.toMatchObject({ code: "EMPTY_QUEUE" });
  await settle();
  expect(calls).toBe(0);
  unsubscribe();
});
