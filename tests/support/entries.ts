import type { QueueEntryView } from "@/domain/queue/types";

let counter = 0;

export function entry(overrides: Partial<QueueEntryView> = {}): QueueEntryView {
  counter += 1;
  return {
    id: `e${counter}`,
    ticketNo: counter,
    channel: "WALK_IN",
    status: "CHECKED_IN",
    scheduledAt: null,
    checkedInAt: null,
    startedAt: null,
    passedAt: null,
    priorityAt: null,
    travelMinutes: null,
    hasPhone: true,
    ...overrides,
  };
}

export function booking(overrides: Partial<QueueEntryView> = {}): QueueEntryView {
  return entry({ channel: "ONLINE", status: "BOOKED", ...overrides });
}
