import { beforeEach, expect, test } from "vitest";
import { requireStaff } from "@/server/auth/require-staff";
import { createStaffSession } from "@/server/auth/sessions";
import { db } from "@/server/db/client";
import { resetDb, seedClinic } from "../helpers";

const request = (cookie?: string) => new Request("http://localhost/api/x", { headers: cookie ? { cookie } : {} });

let seeded: Awaited<ReturnType<typeof seedClinic>>;

beforeEach(async () => {
  await resetDb();
  seeded = await seedClinic();
});

test("resolves the logged-in staff member", async () => {
  const token = await createStaffSession(db, seeded.staffId, new Date());
  await expect(requireStaff(request(`vcare_session=${token}`))).resolves.toMatchObject({
    staffId: seeded.staffId,
    clinicId: seeded.clinicId,
  });
});

test("no cookie or a bad one is UNAUTHORIZED", async () => {
  await expect(requireStaff(request())).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(requireStaff(request("vcare_session=forged"))).rejects.toMatchObject({ code: "UNAUTHORIZED" });
});
