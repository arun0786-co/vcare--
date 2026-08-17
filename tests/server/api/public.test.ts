import { beforeEach, describe, expect, test } from "vitest";
import { GET as getClinic } from "@/app/api/public/clinics/[slug]/route";
import { GET as getSlots } from "@/app/api/public/doctors/[doctorId]/slots/route";
import { clinicDateString } from "@/domain/time";
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

describe("GET /api/public/doctors/[doctorId]/slots", () => {
  const today = () => clinicDateString(new Date(), "Asia/Kolkata");

  test("sessions for a date in the booking window", async () => {
    const res = await getSlots(get(`/api/public/doctors/x/slots?date=${today()}`), params({ doctorId: seeded.doctorId }));
    expect(res.status).toBe(200);
    expect(Array.isArray((await res.json()).sessions)).toBe(true);
  });

  test("missing or out-of-window date is 400, unknown doctor 404", async () => {
    expect((await getSlots(get("/api/public/doctors/x/slots"), params({ doctorId: seeded.doctorId }))).status).toBe(400);
    expect((await getSlots(get("/api/public/doctors/x/slots?date=2020-01-01"), params({ doctorId: seeded.doctorId }))).status).toBe(400);
    expect((await getSlots(get(`/api/public/doctors/x/slots?date=${today()}`), params({ doctorId: "nope" }))).status).toBe(404);
  });
});
