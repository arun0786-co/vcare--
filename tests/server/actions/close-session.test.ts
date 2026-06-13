import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { db } from "@/server/db/client";
import { doctorSessions } from "@/server/db/schema";
import { at } from "../../support/time";
import { entriesOf, setupSession } from "../fixtures";

test("finishes the current patient, cancels the rest and closes", async () => {
  const { act, sessionId } = await setupSession();
  await act({ type: "ADD_PHONE_BOOKING", name: "Anita", phone: "9876543210", scheduledAt: at("12:45").toISOString() }, at("09:00"));
  const inside = (await act({ type: "ADD_WALK_IN", name: "Ravi" }, at("12:00"))).createdEntryId!;
  await act({ type: "ADD_WALK_IN", name: "Meena" }, at("12:01"));
  await act({ type: "NEXT", expectedCurrentId: null }, at("12:05"));
  await act({ type: "CLOSE_SESSION" }, at("12:50"));

  const statuses = (await entriesOf(sessionId)).map((e) => [e.patientName, e.status]);
  expect(statuses).toEqual([
    ["Anita", "CANCELLED"],
    ["Ravi", "COMPLETED"],
    ["Meena", "CANCELLED"],
  ]);
  expect(inside).toBeDefined();
  const [session] = await db.select().from(doctorSessions).where(eq(doctorSessions.id, sessionId));
  expect(session.closedAt).toEqual(at("12:50"));
});

test("a closed session accepts no more actions", async () => {
  const { act } = await setupSession();
  await act({ type: "CLOSE_SESSION" }, at("13:00"));
  await expect(act({ type: "ADD_WALK_IN", name: "Ravi" }, at("13:01"))).rejects.toMatchObject({ code: "SESSION_CLOSED" });
  await expect(act({ type: "CLOSE_SESSION" }, at("13:01"))).rejects.toMatchObject({ code: "SESSION_CLOSED" });
});
