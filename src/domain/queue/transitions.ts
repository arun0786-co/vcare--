import { QueueError } from "../errors";
import type { EntryStatus } from "./types";

const NEXT_STATUSES: Record<EntryStatus, readonly EntryStatus[]> = {
  BOOKED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["IN_CONSULTATION", "NO_SHOW", "CANCELLED"],
  IN_CONSULTATION: ["COMPLETED"],
  NO_SHOW: ["CHECKED_IN"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: EntryStatus, to: EntryStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}

export function assertTransition(from: EntryStatus, to: EntryStatus): void {
  if (!canTransition(from, to)) {
    throw new QueueError("INVALID_TRANSITION", `Cannot change a ${from} entry to ${to}`);
  }
}
