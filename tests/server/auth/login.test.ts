import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { login } from "@/server/auth/login";
import { hashPassword } from "@/server/auth/password";
import { getStaffFromToken } from "@/server/auth/sessions";
import { db } from "@/server/db/client";
import { staffUsers } from "@/server/db/schema";
import { at } from "../../support/time";
import { resetDb, seedClinic } from "../helpers";

let seeded: Awaited<ReturnType<typeof seedClinic>>;

beforeEach(async () => {
  await resetDb();
  seeded = await seedClinic();
  await db.update(staffUsers).set({ passwordHash: await hashPassword("s3cret-pass") }).where(eq(staffUsers.id, seeded.staffId));
});

test("right email and password start a session", async () => {
  const { token, staff } = await login(db, { email: " Reception@Test.test ", password: "s3cret-pass" }, at("09:00"));
  expect(staff).toMatchObject({ staffId: seeded.staffId, name: "Reception", role: "RECEPTIONIST" });
  expect(await getStaffFromToken(db, token, at("09:01"))).toMatchObject({ staffId: seeded.staffId });
});

test("wrong password and unknown email fail the same way", async () => {
  const wrong = login(db, { email: "reception@test.test", password: "nope" }, at("09:00"));
  const unknown = login(db, { email: "nobody@test.test", password: "s3cret-pass" }, at("09:00"));
  await expect(wrong).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "Wrong email or password" });
  await expect(unknown).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "Wrong email or password" });
});

test("missing fields are VALIDATION", async () => {
  await expect(login(db, { email: "", password: "x" }, at("09:00"))).rejects.toMatchObject({ code: "VALIDATION" });
  await expect(login(db, {}, at("09:00"))).rejects.toMatchObject({ code: "VALIDATION" });
});
