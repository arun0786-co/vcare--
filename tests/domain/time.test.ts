import { describe, expect, test } from "vitest";
import { clinicDateString, formatClinicTime } from "@/domain/time";

describe("formatClinicTime", () => {
  test("shows clinic wall time with a plain space before AM/PM", () => {
    expect(formatClinicTime(new Date("2026-10-26T05:50:00Z"), "Asia/Kolkata")).toBe("11:20 AM");
    expect(formatClinicTime(new Date("2026-10-26T12:35:00Z"), "Asia/Kolkata")).toBe("6:05 PM");
  });
});

describe("clinicDateString", () => {
  test("uses the clinic's calendar date, not UTC's", () => {
    expect(clinicDateString(new Date("2026-10-25T20:00:00Z"), "Asia/Kolkata")).toBe("2026-10-26");
    expect(clinicDateString(new Date("2026-10-25T18:00:00Z"), "Asia/Kolkata")).toBe("2026-10-25");
  });
});
