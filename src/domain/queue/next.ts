import { callableQueue } from "./line";
import { orderKey } from "./order";
import type { QueueEntryView } from "./types";

export interface NextPlan {
  completeId: string | null;
  startId: string | null;
  passedIds: string[];
}

// What pressing "Next patient" does. Absent bookings whose place comes before the
// patient being called are marked passed over, which starts their grace period.
export function planNext(entries: QueueEntryView[], graceMinutes: number): NextPlan {
  const current = entries.find((e) => e.status === "IN_CONSULTATION") ?? null;
  const next = callableQueue(entries, graceMinutes)[0] ?? null;
  const passedIds =
    next && !next.priorityAt
      ? entries
          .filter(
            (e) =>
              e.status === "BOOKED" &&
              e.passedAt === null &&
              orderKey(e, graceMinutes) < orderKey(next, graceMinutes),
          )
          .map((e) => e.id)
      : [];
  return { completeId: current?.id ?? null, startId: next?.id ?? null, passedIds };
}
