import { expect, test } from "vitest";
import { hashPassword } from "@/server/auth/password";

test("hashes with a random salt in a self-describing format", async () => {
  const a = await hashPassword("correct horse");
  const b = await hashPassword("correct horse");
  expect(a).toMatch(/^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  expect(a).not.toBe(b);
  expect(a).not.toContain("correct horse");
});
