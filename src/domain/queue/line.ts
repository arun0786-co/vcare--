import { addMinutes } from "../clock";
import { compareEntries } from "./order";
import type { QueueEntryView } from "./types";

function sorted(entries: QueueEntryView[], graceMinutes: number): QueueEntryView[] {
  return [...entries].sort((a, b) => compareEntries(a, b, graceMinutes));
}

// Patients who can be called right now: present and waiting.
export function callableQueue(entries: QueueEntryView[], graceMinutes: number): QueueEntryView[] {
  return sorted(
    entries.filter((e) => e.status === "CHECKED_IN"),
    graceMinutes,
  );
}

// A booked patient who was passed over and has not checked in within the grace period.
export function hasLostSlot(e: QueueEntryView, now: Date, graceMinutes: number): boolean {
  return e.status === "BOOKED" && e.passedAt !== null && now >= addMinutes(e.passedAt, graceMinutes);
}
