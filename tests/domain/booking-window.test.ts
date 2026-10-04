import { expect, test } from "vitest";
import { bookingDates, bookingWindow, isInBookingWindow } from "@/domain/booking/window";
import { at } from "../support/time";

test("today and the next six days in clinic time", () => {
  expect(bookingWindow(at("09:00"), "Asia/Kolkata")).toEqual({ first: "2026-10-26", last: "2026-11-01" });
  // 00:30 IST on the 27th is still the 26th in UTC.
  expect(bookingWindow(at("00:30", "2026-10-27"), "Asia/Kolkata").first).toBe("2026-10-27");
});

test.each([
  ["2026-10-25", false],
  ["2026-10-26", true],
  ["2026-11-01", true],
  ["2026-11-02", false],
  ["not-a-date", false],
])("%s in window: %s", (date, expected) => {
  expect(isInBookingWindow(date, at("09:00"), "Asia/Kolkata")).toBe(expected);
});

test("bookingDates lists the seven bookable days", () => {
  expect(bookingDates(at("09:00"), "Asia/Kolkata")).toEqual([
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
  ]);
});
