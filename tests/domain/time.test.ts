import { describe, expect, test } from "vitest";
import { clinicDateString, formatClinicTime, stalenessLabel } from "@/domain/time";
import { at } from "../support/time";

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

describe("stalenessLabel", () => {
  const plusSeconds = (s: number) => new Date(at("10:00").getTime() + s * 1000);

  test("fresh under a minute", () => {
    expect(stalenessLabel(at("10:00"), plusSeconds(59))).toEqual({ text: "Updated just now", stale: false });
  });

  test("minutes, stale from two minutes", () => {
    expect(stalenessLabel(at("10:00"), plusSeconds(119))).toEqual({ text: "Updated 1 min ago", stale: false });
    expect(stalenessLabel(at("10:00"), at("10:02"))).toEqual({ text: "Updated 2 min ago", stale: true });
  });

  test("clock skew in the future reads as fresh", () => {
    expect(stalenessLabel(at("10:00"), plusSeconds(-5))).toEqual({ text: "Updated just now", stale: false });
  });
});
