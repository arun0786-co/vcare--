import { expect, test } from "vitest";
import { readCookie } from "@/server/auth/cookies";

test("reads one cookie from a Cookie header", () => {
  expect(readCookie("a=1; vcare_session=abc_-123; b=2", "vcare_session")).toBe("abc_-123");
  expect(readCookie("vcare_session=x%3Dy", "vcare_session")).toBe("x=y");
});

test("missing header or cookie", () => {
  expect(readCookie(null, "vcare_session")).toBeNull();
  expect(readCookie("other=1", "vcare_session")).toBeNull();
  expect(readCookie("vcare_session_old=1", "vcare_session")).toBeNull();
});
