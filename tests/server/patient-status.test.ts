import { beforeEach, expect, test } from "vitest";
import { db } from "@/server/db/client";
import { getPatientStatus } from "@/server/queue/patient-status";
import { at } from "../support/time";
import { entryById, setupSession } from "./fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;

beforeEach(async () => {
  s = await setupSession();
});

const tokenOf = async (id: string) => (await entryById(id)).publicToken;
const book = async (name: string, slot: string, phone = "9876543210") =>
  (await s.act({ type: "ADD_PHONE_BOOKING", name, phone, scheduledAt: at(slot).toISOString() }, at("09:00"))).createdEntryId!;

test("own place in the line, who is being seen, and session state", async () => {
  await s.act({ type: "ADD_WALK_IN", name: "Ravi Kumar", phone: "9800000001" }, at("10:00"));
  await s.act({ type: "ADD_WALK_IN", name: "Meena" }, at("10:01"));
  const anita = await book("Anita", "11:00");
  await s.act({ type: "NEXT", expectedCurrentId: null }, at("10:05"));
  await s.act({ type: "SET_NOTE", note: "Running a little behind" }, at("10:06"));

  const status = await getPatientStatus(db, await tokenOf(anita), at("10:10"));
  expect(status).toMatchObject({
    ticketNo: 3,
    name: "Anita",
    status: "BOOKED",
    clinicName: "Clinic test",
    doctorName: "Dr test",
    scheduledAt: at("11:00").toISOString(),
    position: 2,
    aheadCount: 1,
    expectedAt: at("11:00").toISOString(),
    lateForSlot: false,
    slotHeldUntil: null,
    nowServingTicket: 1,
    session: { doctorArrived: true, publicNote: "Running a little behind", closed: false },
    generatedAt: at("10:10").toISOString(),
  });
});

test("never contains other patients' names or phones", async () => {
  await s.act({ type: "ADD_WALK_IN", name: "Ravi Kumar", phone: "9800000001" }, at("10:00"));
  const anita = await book("Anita", "11:00");
  await s.act({ type: "NEXT", expectedCurrentId: null }, at("10:05"));
  const json = JSON.stringify(await getPatientStatus(db, await tokenOf(anita), at("10:10")));
  expect(json).not.toMatch(/Ravi|9800000001/);
});

test("passed over: slot held until grace ends, then lost", async () => {
  const anita = await book("Anita", "10:15");
  await s.act({ type: "ADD_WALK_IN", name: "Ravi" }, at("10:20"));
  await s.act({ type: "NEXT", expectedCurrentId: null }, at("10:25"));

  const held = await getPatientStatus(db, await tokenOf(anita), at("10:30"));
  expect(held).toMatchObject({ lateForSlot: false, slotHeldUntil: at("10:35").toISOString() });

  const lost = await getPatientStatus(db, await tokenOf(anita), at("10:36"));
  expect(lost).toMatchObject({ lateForSlot: true, slotHeldUntil: null, position: null, expectedAt: null });
});

test("unknown token is NOT_FOUND", async () => {
  await expect(getPatientStatus(db, "x".repeat(32), at("10:00"))).rejects.toMatchObject({ code: "NOT_FOUND" });
});
