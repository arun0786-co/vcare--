import { beforeEach, describe, expect, test } from "vitest";
import { GET as listSessions } from "@/app/api/staff/sessions/route";
import { createStaffSession } from "@/server/auth/sessions";
import { db } from "@/server/db/client";
import { resetDb, seedClinic } from "../helpers";

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
