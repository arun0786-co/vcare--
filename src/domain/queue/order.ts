import { addMinutes } from "../clock";
import type { QueueEntryView } from "./types";

// Walk-ins queue by arrival. Appointments queue by slot time unless they were
// passed over and then arrived after the grace period.
export function orderKey(e: QueueEntryView, graceMinutes: number): Date {
  if (e.scheduledAt === null) {
    if (e.checkedInAt === null) throw new Error(`walk-in ${e.id} has no check-in time`);
    return e.checkedInAt;
  }
  if (e.checkedInAt && e.passedAt && e.checkedInAt > addMinutes(e.passedAt, graceMinutes)) {
    return e.checkedInAt;
  }
  return e.scheduledAt;
}
