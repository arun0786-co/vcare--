import { beforeEach, describe, expect, test } from "vitest";
import { GET as getStatus, PATCH as patchEntry } from "@/app/api/public/entries/[token]/route";
import { addMinutes } from "@/domain/clock";
import { clinicDateString } from "@/domain/time";
import { createOnlineBooking } from "@/server/booking/create-booking";
import { db } from "@/server/db/client";
import { createSession, resetDb, seedClinic } from "../helpers";

const params = (token: string) => ({ params: Promise.resolve({ token }) });
const req = (method = "GET", body?: unknown) =>
  new Request("http://localhost/api/public/entries/t", { method, body: body === undefined ? undefined : JSON.stringify(body) });

let token: string;

beforeEach(async () => {
  await resetDb();
  const { doctorId } = await seedClinic();
  const date = clinicDateString(addMinutes(new Date(), 24 * 60), "Asia/Kolkata");
  const startsAt = new Date(`${date}T10:00:00+05:30`);
  const sessionId = await createSession(doctorId, startsAt, addMinutes(startsAt, 180), date);
  ({ token } = await createOnlineBooking(
    db,
    { sessionId, scheduledAt: startsAt, name: "Anita", phone: "9876543210", travelMinutes: null },
    new Date(),
  ));
});

describe("GET /api/public/entries/[token]", () => {
  test("the patient's status", async () => {
    const res = await getStatus(req(), params(token));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ticketNo: 1, name: "Anita", status: "BOOKED" });
  });

  test("unknown token is 404", async () => {
    expect((await getStatus(req(), params("z".repeat(32)))).status).toBe(404);
  });
});

describe("PATCH /api/public/entries/[token]", () => {
  test("sets the travel time and returns the new status", async () => {
    const res = await patchEntry(req("PATCH", { travelMinutes: 30 }), params(token));
    expect(res.status).toBe(200);
    expect((await res.json()).travelMinutes).toBe(30);
  });

  test("odd travel time is 400, unknown token 404", async () => {
    expect((await patchEntry(req("PATCH", { travelMinutes: 25 }), params(token))).status).toBe(400);
    expect((await patchEntry(req("PATCH", { travelMinutes: 20 }), params("z".repeat(32)))).status).toBe(404);
  });
});
