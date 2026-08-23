import { beforeEach, expect, test } from "vitest";
import { login } from "@/server/auth/login";
import { db } from "@/server/db/client";
import { clinics, doctorSchedules, doctors, staffUsers } from "@/server/db/schema";
import { seedDemo } from "@/server/dev/seed-demo";
import { resetDb } from "./helpers";

beforeEach(async () => {
  await resetDb();
});

test("creates the demo clinic, doctors, weekly hours and logins", async () => {
  await seedDemo(db, "demo-pass-123");
  expect((await db.select().from(clinics)).map((c) => [c.slug, c.name, c.timezone])).toEqual([["demo", "Demo Clinic", "Asia/Kolkata"]]);
  expect((await db.select().from(doctors)).map((d) => d.name).sort()).toEqual(["Dr. Arjun Rao", "Dr. Meera Nair"]);
  // Meera: Mon-Sat mornings and evenings (12), Arjun: Mon-Sat mornings (6).
  expect(await db.select().from(doctorSchedules)).toHaveLength(18);
  expect((await db.select().from(staffUsers)).map((s) => [s.email, s.role]).sort()).toEqual([
    ["meera@demo.test", "DOCTOR"],
    ["reception@demo.test", "RECEPTIONIST"],
  ]);
  await expect(login(db, { email: "reception@demo.test", password: "demo-pass-123" }, new Date())).resolves.toHaveProperty("token");
});

test("running it again changes nothing but the password", async () => {
  await seedDemo(db, "first-pass-1");
  await seedDemo(db, "second-pass-2");
  expect(await db.select().from(clinics)).toHaveLength(1);
  expect(await db.select().from(doctors)).toHaveLength(2);
  expect(await db.select().from(doctorSchedules)).toHaveLength(18);
  expect(await db.select().from(staffUsers)).toHaveLength(2);
  await expect(login(db, { email: "reception@demo.test", password: "second-pass-2" }, new Date())).resolves.toHaveProperty("token");
});
