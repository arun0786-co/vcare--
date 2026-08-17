import { beforeEach, describe, expect, test } from "vitest";
import { GET as getClinic } from "@/app/api/public/clinics/[slug]/route";
import { resetDb, seedClinic } from "../helpers";

const params = <T>(p: T) => ({ params: Promise.resolve(p) });
const get = (path: string) => new Request(`http://localhost${path}`);

let seeded: Awaited<ReturnType<typeof seedClinic>>;

beforeEach(async () => {
  await resetDb();
  seeded = await seedClinic("demo");
});

describe("GET /api/public/clinics/[slug]", () => {
  test("clinic and doctors", async () => {
    const res = await getClinic(get("/api/public/clinics/demo"), params({ slug: "demo" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ clinic: { name: "Clinic demo", slug: "demo" }, doctors: [{ id: seeded.doctorId, name: "Dr demo", specialty: null }] });
  });

  test("unknown clinic is 404", async () => {
    const res = await getClinic(get("/api/public/clinics/x"), params({ slug: "x" }));
    expect(res.status).toBe(404);
  });
});
