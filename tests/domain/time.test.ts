import { describe, expect, test } from "vitest";
import { formatClinicTime } from "@/domain/time";

describe("formatClinicTime", () => {
  test("shows clinic wall time with a plain space before AM/PM", () => {
    expect(formatClinicTime(new Date("2026-10-26T05:50:00Z"), "Asia/Kolkata")).toBe("11:20 AM");
    expect(formatClinicTime(new Date("2026-10-26T12:35:00Z"), "Asia/Kolkata")).toBe("6:05 PM");
  });
});
