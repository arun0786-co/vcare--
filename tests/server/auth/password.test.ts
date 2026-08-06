import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

test("hashes with a random salt in a self-describing format", async () => {
  const a = await hashPassword("correct horse");
  const b = await hashPassword("correct horse");
  expect(a).toMatch(/^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  expect(a).not.toBe(b);
  expect(a).not.toContain("correct horse");
});

test("verifies the right password only", async () => {
  const stored = await hashPassword("correct horse");
  expect(await verifyPassword("correct horse", stored)).toBe(true);
  expect(await verifyPassword("wrong horse", stored)).toBe(false);
});

test.each(["garbage", "", "scrypt$abc", "bcrypt$a$b", "scrypt$$"])("malformed stored value %j never verifies", async (stored) => {
  expect(await verifyPassword("anything", stored)).toBe(false);
});
