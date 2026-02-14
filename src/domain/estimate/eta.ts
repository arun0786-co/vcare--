import { addMinutes, laterOf, minutesBetween } from "../clock";
import { projectedLine } from "../queue/line";
import type { DurationStats, Eta, QueueEntryView, SessionTiming } from "../queue/types";

// When the doctor can next start a consultation, ignoring anyone currently inside.
// An announced late start only matters until the doctor actually arrives.
export function queueStartTime(session: SessionTiming, now: Date): Date {
  let start = now;
  if (!session.doctorArrivedAt) start = laterOf(now, session.expectedStartAt ?? session.startsAt);
  if (session.pausedUntil) start = laterOf(start, session.pausedUntil);
  return start;
}

// Walks the projected line twice in step: "expected" with median durations and
// everyone counted (shown to patients), "early" with 25th-percentile durations
// and absent bookings skipped (used for alerts, so nobody is told to come late).
export function projectEtas(input: {
  entries: QueueEntryView[];
  session: SessionTiming;
  stats: DurationStats;
  now: Date;
  graceMinutes: number;
}): Eta[] {
  const { entries, session, stats, now, graceMinutes } = input;
  if (session.closedAt) return [];

  const base = queueStartTime(session, now);
  const current = entries.find((e) => e.status === "IN_CONSULTATION");
  const elapsed = current?.startedAt ? minutesBetween(current.startedAt, now) : 0;
  let tExp = current ? addMinutes(base, Math.max(stats.median - elapsed, 1)) : base;
  let tEarly = current ? addMinutes(base, Math.max(stats.p25 - elapsed, 0)) : base;

  return projectedLine(entries, now, graceMinutes).map((e, i) => {
    const absent = e.status === "BOOKED";
    const expectedAt = absent && e.scheduledAt ? laterOf(tExp, e.scheduledAt) : tExp;
    const earlyAt = absent && e.scheduledAt ? laterOf(tEarly, e.scheduledAt) : tEarly;
    tExp = addMinutes(expectedAt, stats.median);
    if (!absent) tEarly = addMinutes(earlyAt, stats.p25);
    return { entryId: e.id, position: i + 1, expectedAt, earlyAt };
  });
}
