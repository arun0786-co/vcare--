import { expect, test } from "vitest";
import { statusForCode } from "@/server/http";

test.each([
  ["VALIDATION", 400],
  ["UNAUTHORIZED", 401],
  ["NOT_FOUND", 404],
  ["CONFLICT", 409],
  ["INVALID_TRANSITION", 409],
  ["SESSION_CLOSED", 409],
  ["EMPTY_QUEUE", 409],
  ["SLOT_TAKEN", 409],
] as const)("%s is %i", (code, status) => {
  expect(statusForCode(code)).toBe(status);
});
