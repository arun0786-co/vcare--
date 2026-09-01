import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { getSessionBoard } from "@/server/queue/board";
import { at } from "../support/time";
import { setupSession } from "./fixtures";
import { seedClinic } from "./helpers";

let s: Awaited<ReturnType<typeof setupSession>>;

beforeEach(async () => {
  s = await setupSession();
});

const book = async (name: string, slot: string) =>
  (await s.act({ type: "ADD_PHONE_BOOKING", name, phone: "9876543210", scheduledAt: at(slot).toISOString() }, at("09:00")))
    .createdEntryId!;

test("groups entries and adds live estimates", async () => {
  const late = await book("Late Lata", "10:00");
  const upcoming = await book("Upcoming Uma", "11:00");
  const w1 = (await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:05"))).createdEntryId!;
  const w2 = (await s.act({ type: "ADD_WALK_IN", name: "Meena" }, at("10:06"))).createdEntryId!;
  const w3 = (await s.act({ type: "ADD_WALK_IN", name: "Gone Gopal" }, at("10:07"))).createdEntryId!;
  await s.act({ type: "MARK_NO_SHOW", entryId: w3 }, at("10:08"));
  await s.act({ type: "NEXT", expectedCurrentId: null }, at("10:10"));

  const board = await getSessionBoard(db, s.sessionId, s.clinicId, at("10:30"));

  expect(board.session).toMatchObject({ id: s.sessionId, doctorName: "Dr test", timezone: "Asia/Kolkata", doctorArrivedAt: at("10:10").toISOString() });
  expect(board.current).toMatchObject({ id: w1, name: "Ravi", startedAt: at("10:10").toISOString() });
  expect(board.waiting.map((e) => e.id)).toEqual([w2]);
  expect(board.waiting[0]).toMatchObject({ position: 1, expectedAt: expect.any(String) });
  expect(board.upcoming.map((e) => e.id)).toEqual([upcoming]);
  expect(board.upcoming[0].expectedAt).toBe(at("11:00").toISOString());
  expect(board.late.map((e) => e.id)).toEqual([late]);
  expect(board.late[0]).toMatchObject({ position: null, expectedAt: null });
  expect(board.finished.map((e) => e.id)).toEqual([w3]);
  expect(board.stats).toEqual({ median: 8, p25: 6, samples: 0 });
  expect(board.generatedAt).toBe(at("10:30").toISOString());
  // 10:30 onwards, minus the 11:00 booking.
  expect(board.session.freeSlots[0]).toBe(at("10:30").toISOString());
  expect(board.session.freeSlots).not.toContain(at("11:00").toISOString());
  expect(board.session.freeSlots).toHaveLength(9);
});

test("closed sessions still load", async () => {
  await s.act({ type: "CLOSE_SESSION" }, at("13:00"));
  const board = await getSessionBoard(db, s.sessionId, s.clinicId, at("13:05"));
  expect(board.session.closedAt).toBe(at("13:00").toISOString());
});

test("another clinic's board is NOT_FOUND", async () => {
  const other = await seedClinic("other");
  await expect(getSessionBoard(db, s.sessionId, other.clinicId, at("10:00"))).rejects.toMatchObject({ code: "NOT_FOUND" });
  await expect(getSessionBoard(db, "nope", s.clinicId, at("10:00"))).rejects.toMatchObject({ code: "NOT_FOUND" });
});
