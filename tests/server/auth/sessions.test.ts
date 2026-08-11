import { beforeEach, expect, test } from "vitest";
import { createStaffSession } from "@/server/auth/sessions";
import { db } from "@/server/db/client";
import { staffSessions } from "@/server/db/schema";
import { at } from "../../support/time";
import { resetDb, seedClinic } from "../helpers";

let seeded: Awaited<ReturnType<typeof seedClinic>>;

beforeEach(async () => {
  await resetDb();
  seeded = await seedClinic();
});

test("the raw token is not stored", async () => {
  const token = await createStaffSession(db, seeded.staffId, at("09:00"));
  const rows = await db.select().from(staffSessions);
  expect(rows).toHaveLength(1);
  expect(rows[0].id).not.toBe(token);
  expect(rows[0].id).toMatch(/^[0-9a-f]{64}$/);
});
