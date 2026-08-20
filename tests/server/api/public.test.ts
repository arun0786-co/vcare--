import { beforeEach, describe, expect, test } from "vitest";
import { GET as getClinic } from "@/app/api/public/clinics/[slug]/route";
import { POST as postBooking } from "@/app/api/public/bookings/route";
import { GET as getSlots } from "@/app/api/public/doctors/[doctorId]/slots/route";
import { addMinutes } from "@/domain/clock";
import { clinicDateString } from "@/domain/time";
import { createSession, resetDb, seedClinic } from "../helpers";

const postJson = (path: string, body: unknown, method = "POST") =>
  new Request(`http://localhost${path}`, { method, body: JSON.stringify(body) });

// Routes run on the real clock, so book into a session that starts tomorrow at 10:00 IST.
async function tomorrowSession(doctorId: string) {
  const date = clinicDateString(addMinutes(new Date(), 24 * 60), "Asia/Kolkata");
  const startsAt = new Date(`${date}T10:00:00+05:30`);
  const sessionId = await createSession(doctorId, startsAt, addMinutes(startsAt, 180), date);
  return { sessionId, startsAt };
}

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

describe("POST /api/public/bookings", () => {
  test("201 with the patient's token", async () => {
    const { sessionId, startsAt } = await tomorrowSession(seeded.doctorId);
    const res = await postBooking(
      postJson("/api/public/bookings", { sessionId, scheduledAt: startsAt.toISOString(), name: "Anita", phone: "9876543210", travelMinutes: 20 }),
      {},
    );
    expect(res.status).toBe(201);
    expect((await res.json()).token).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });

  test("bad phone is 400 with a readable message; taken slot is 409", async () => {
    const { sessionId, startsAt } = await tomorrowSession(seeded.doctorId);
    const body = { sessionId, scheduledAt: startsAt.toISOString(), name: "Anita", phone: "12345" };
    const bad = await postBooking(postJson("/api/public/bookings", body), {});
    expect(bad.status).toBe(400);
    expect(await bad.json()).toEqual({ error: { code: "VALIDATION", message: "Enter a 10-digit Indian mobile number" } });

    await postBooking(postJson("/api/public/bookings", { ...body, phone: "9876543210" }), {});
    const taken = await postBooking(postJson("/api/public/bookings", { ...body, phone: "9811111111" }), {});
    expect(taken.status).toBe(409);
    expect((await taken.json()).error.code).toBe("SLOT_TAKEN");
  });
});
