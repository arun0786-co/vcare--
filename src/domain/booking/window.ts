import { addMinutes } from "../clock";
import { clinicDateString } from "../time";

export const BOOKING_DAYS = 7;

export function bookingWindow(now: Date, timeZone: string): { first: string; last: string } {
  return {
    first: clinicDateString(now, timeZone),
    last: clinicDateString(addMinutes(now, (BOOKING_DAYS - 1) * 24 * 60), timeZone),
  };
}

export function isInBookingWindow(date: string, now: Date, timeZone: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const { first, last } = bookingWindow(now, timeZone);
  return date >= first && date <= last;
}

export function bookingDates(now: Date, timeZone: string): string[] {
  return Array.from({ length: BOOKING_DAYS }, (_, i) => clinicDateString(addMinutes(now, i * 24 * 60), timeZone));
}
