import { expect, test } from "vitest";
import { normalizeIndianMobile } from "@/domain/phone";

test.each(["9876543210", "+91 98765 43210", "09876543210", "919876543210", "98765-43210", "(+91) 98765.43210"])(
  "normalizes %s",
  (raw) => {
    expect(normalizeIndianMobile(raw)).toBe("+919876543210");
  },
);

test.each(["12345", "5876543210", "98765432101", "", "abcdefghij", "+1 415 555 0100"])("rejects %s", (raw) => {
  expect(normalizeIndianMobile(raw)).toBeNull();
});
