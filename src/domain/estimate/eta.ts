import { laterOf } from "../clock";
import type { SessionTiming } from "../queue/types";

// When the doctor can next start a consultation, ignoring anyone currently inside.
// An announced late start only matters until the doctor actually arrives.
export function queueStartTime(session: SessionTiming, now: Date): Date {
  let start = now;
  if (!session.doctorArrivedAt) start = laterOf(now, session.expectedStartAt ?? session.startsAt);
  if (session.pausedUntil) start = laterOf(start, session.pausedUntil);
  return start;
}
