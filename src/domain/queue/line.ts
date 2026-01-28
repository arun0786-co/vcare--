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
