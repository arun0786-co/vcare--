import { beforeEach, describe, expect, test } from "vitest";
import { POST as postAction } from "@/app/api/staff/sessions/[id]/actions/route";
import { GET as getBoard } from "@/app/api/staff/sessions/[id]/route";
import { GET as streamSession } from "@/app/api/staff/sessions/[id]/stream/route";
import { closeRealtimeHub } from "@/server/realtime/hub";
import { GET as listSessions } from "@/app/api/staff/sessions/route";
import { addMinutes } from "@/domain/clock";
import { clinicDateString } from "@/domain/time";
import { createStaffSession } from "@/server/auth/sessions";
import { db } from "@/server/db/client";
import { createSession, resetDb, seedClinic } from "../helpers";

const params = (id: string) => ({ params: Promise.resolve({ id }) });

// Routes use the real clock, so the session under test is today's, all day.
async function todaySession(doctorId: string) {
  const date = clinicDateString(new Date(), "Asia/Kolkata");
  const startsAt = new Date(`${date}T00:00:00+05:30`);
  return createSession(doctorId, startsAt, addMinutes(startsAt, 24 * 60 - 1), date);
}

let seeded: Awaited<ReturnType<typeof seedClinic>>;
let cookie: string;

beforeEach(async () => {
  await resetDb();
  seeded = await seedClinic();
  cookie = `vcare_session=${await createStaffSession(db, seeded.staffId, new Date())}`;
});

const req = (path: string, opts: { cookie?: string; method?: string; body?: unknown } = {}) =>
  new Request(`http://localhost${path}`, {
    method: opts.method ?? "GET",
    headers: opts.cookie ? { cookie: opts.cookie } : {},
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });

describe("GET /api/staff/sessions", () => {
  test("the clinic's sessions for a date", async () => {
    const res = await listSessions(req("/api/staff/sessions?date=2026-10-26", { cookie }), {});
    expect(res.status).toBe(200);
    expect((await res.json()).sessions).toHaveLength(2);
  });

  test("defaults to today; rejects a malformed date", async () => {
    expect((await listSessions(req("/api/staff/sessions", { cookie }), {})).status).toBe(200);
    expect((await listSessions(req("/api/staff/sessions?date=26-10-2026", { cookie }), {})).status).toBe(400);
  });

  test("not logged in is 401", async () => {
    expect((await listSessions(req("/api/staff/sessions?date=2026-10-26"), {})).status).toBe(401);
  });
});

describe("GET /api/staff/sessions/[id]", () => {
  test("the board for one of the clinic's sessions", async () => {
    const id = await todaySession(seeded.doctorId);
    const res = await getBoard(req(`/api/staff/sessions/${id}`, { cookie }), params(id));
    expect(res.status).toBe(200);
    expect((await res.json()).session.id).toBe(id);
  });

  test("another clinic's staff get 404; no login is 401", async () => {
    const id = await todaySession(seeded.doctorId);
    const other = await seedClinic("other");
    const otherCookie = `vcare_session=${await createStaffSession(db, other.staffId, new Date())}`;
    expect((await getBoard(req(`/api/staff/sessions/${id}`, { cookie: otherCookie }), params(id))).status).toBe(404);
    expect((await getBoard(req(`/api/staff/sessions/${id}`), params(id))).status).toBe(401);
  });
});

describe("POST /api/staff/sessions/[id]/actions", () => {
  const act = (id: string, body: unknown, c: string | undefined = cookie) =>
    postAction(req(`/api/staff/sessions/${id}/actions`, { cookie: c, method: "POST", body }), params(id));

  test("applies the action and returns the fresh board", async () => {
    const id = await todaySession(seeded.doctorId);
    const res = await act(id, { type: "ADD_WALK_IN", name: "Ravi" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.createdEntryId).toEqual(expect.any(String));
    expect(json.board.waiting.map((e: { name: string }) => e.name)).toEqual(["Ravi"]);
  });

  test("a stale Next is 409 CONFLICT", async () => {
    const id = await todaySession(seeded.doctorId);
    await act(id, { type: "ADD_WALK_IN", name: "Ravi" });
    await act(id, { type: "ADD_WALK_IN", name: "Meena" });
    await act(id, { type: "NEXT", expectedCurrentId: null });
    const stale = await act(id, { type: "NEXT", expectedCurrentId: null });
    expect(stale.status).toBe(409);
    expect((await stale.json()).error.code).toBe("CONFLICT");
  });

  test("401 without login, 404 for another clinic, 400 for nonsense", async () => {
    const id = await todaySession(seeded.doctorId);
    const other = await seedClinic("other");
    const otherCookie = `vcare_session=${await createStaffSession(db, other.staffId, new Date())}`;
    const noCookie = await postAction(req(`/api/staff/sessions/${id}/actions`, { method: "POST", body: { type: "DOCTOR_ARRIVED" } }), params(id));
    expect(noCookie.status).toBe(401);
    expect((await act(id, { type: "DOCTOR_ARRIVED" }, otherCookie)).status).toBe(404);
    expect((await act(id, { type: "DANCE" })).status).toBe(400);
  });
});

describe("GET /api/staff/sessions/[id]/stream", () => {
  test("opens a stream for the clinic's own session only", async () => {
    const id = await todaySession(seeded.doctorId);
    const abort = new AbortController();
    const ok = await streamSession(new Request(`http://localhost/s`, { headers: { cookie }, signal: abort.signal }), params(id));
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("text/event-stream");
    abort.abort();
    await closeRealtimeHub();

    const other = await seedClinic("other");
    const otherCookie = `vcare_session=${await createStaffSession(db, other.staffId, new Date())}`;
    expect((await streamSession(req(`/api/staff/sessions/${id}/stream`, { cookie: otherCookie }), params(id))).status).toBe(404);
    expect((await streamSession(req(`/api/staff/sessions/${id}/stream`), params(id))).status).toBe(401);
  });
});
