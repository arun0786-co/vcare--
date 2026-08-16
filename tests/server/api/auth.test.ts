import { eq } from "drizzle-orm";
import { beforeEach, expect, test } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { hashPassword } from "@/server/auth/password";
import { db } from "@/server/db/client";
import { staffUsers } from "@/server/db/schema";
import { resetDb, seedClinic } from "../helpers";

const post = (body: unknown) =>
  login(new Request("http://localhost/api/auth/login", { method: "POST", body: JSON.stringify(body) }), {});

beforeEach(async () => {
  await resetDb();
  const { staffId } = await seedClinic();
  await db.update(staffUsers).set({ passwordHash: await hashPassword("s3cret-pass") }).where(eq(staffUsers.id, staffId));
});

test("login sets an httpOnly session cookie", async () => {
  const res = await post({ email: "reception@test.test", password: "s3cret-pass" });
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ staff: { name: "Reception", role: "RECEPTIONIST" } });
  const cookie = res.headers.get("set-cookie")!;
  expect(cookie).toMatch(/^vcare_session=[A-Za-z0-9_-]{43};/);
  expect(cookie).toMatch(/HttpOnly/i);
  expect(cookie).toMatch(/SameSite=lax/i);
});

test("bad credentials get one 401 message and no cookie", async () => {
  for (const body of [
    { email: "reception@test.test", password: "wrong" },
    { email: "nobody@test.test", password: "s3cret-pass" },
  ]) {
    const res = await post(body);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: { code: "UNAUTHORIZED", message: "Wrong email or password" } });
    expect(res.headers.get("set-cookie")).toBeNull();
  }
});
