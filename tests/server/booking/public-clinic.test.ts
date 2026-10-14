import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { getPublicClinic } from "@/server/booking/public-clinic";
import { db } from "@/server/db/client";
import { doctors } from "@/server/db/schema";
import { resetDb, seedClinic } from "../helpers";

beforeEach(async () => {
  await resetDb();
});

test("clinic name and its active doctors", async () => {
  const { clinicId, doctorId } = await seedClinic("demo");
  await db.insert(doctors).values({ clinicId, name: "Dr Away", active: false });
  expect(await getPublicClinic(db, "demo")).toEqual({
    clinic: { name: "Clinic demo", slug: "demo", timezone: "Asia/Kolkata" },
    doctors: [{ id: doctorId, name: "Dr demo", specialty: null }],
  });
  expect((await db.select().from(doctors).where(eq(doctors.clinicId, clinicId))).length).toBe(2);
});

test("unknown clinic is NOT_FOUND", async () => {
  await expect(getPublicClinic(db, "nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
});
