import { beforeEach, expect, test } from "vitest";
import { createStaffSession, getStaffFromToken } from "@/server/auth/sessions";
import { db } from "@/server/db/client";
import { staffSessions } from "@/server/db/schema";
import { at } from "../../support/time";
import { resetDb, seedClinic } from "../helpers";

let seeded: Awaited<ReturnType<typeof seedClinic>>;

beforeEach(async () => {
  await resetDb();
  seeded = await seedClinic();
});

test("a new session resolves to the staff member and their clinic", async () => {
  const token = await createStaffSession(db, seeded.staffId, at("09:00"));
  expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(await getStaffFromToken(db, token, at("09:05"))).toEqual({
    staffId: seeded.staffId,
    clinicId: seeded.clinicId,
    name: "Reception",
    role: "RECEPTIONIST",
  });
});

test("the raw token is not stored", async () => {
  const token = await createStaffSession(db, seeded.staffId, at("09:00"));
  const rows = await db.select().from(staffSessions);
  expect(rows).toHaveLength(1);
  expect(rows[0].id).not.toBe(token);
  expect(rows[0].id).toMatch(/^[0-9a-f]{64}$/);
});

test("expires after 14 days", async () => {
  const token = await createStaffSession(db, seeded.staffId, at("09:00", "2026-10-01"));
  expect(await getStaffFromToken(db, token, at("08:59", "2026-10-15"))).not.toBeNull();
  expect(await getStaffFromToken(db, token, at("09:00", "2026-10-15"))).toBeNull();
});
