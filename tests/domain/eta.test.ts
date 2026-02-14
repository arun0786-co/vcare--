import { describe, expect, test } from "vitest";
import { projectEtas, queueStartTime } from "@/domain/estimate/eta";
import type { QueueEntryView, SessionTiming } from "@/domain/queue/types";
import { booking, entry } from "../support/entries";
import { at } from "../support/time";

const session = (overrides: Partial<SessionTiming> = {}): SessionTiming => ({
  startsAt: at("10:00"),
  endsAt: at("13:00"),
  expectedStartAt: null,
  doctorArrivedAt: at("09:30"),
  pausedUntil: null,
  closedAt: null,
  ...overrides,
});

describe("queueStartTime", () => {
  test("doctor here: now", () => {
    expect(queueStartTime(session(), at("10:30"))).toEqual(at("10:30"));
  });

  test("doctor not here yet: session start, or now once that has passed", () => {
    expect(queueStartTime(session({ doctorArrivedAt: null }), at("09:30"))).toEqual(at("10:00"));
    expect(queueStartTime(session({ doctorArrivedAt: null }), at("10:15"))).toEqual(at("10:15"));
  });

  test("announced late start counts until the doctor arrives", () => {
    expect(queueStartTime(session({ doctorArrivedAt: null, expectedStartAt: at("10:45") }), at("10:10"))).toEqual(at("10:45"));
    expect(queueStartTime(session({ doctorArrivedAt: at("10:20"), expectedStartAt: at("10:45") }), at("10:30"))).toEqual(at("10:30"));
  });

  test("break pushes the start to its end", () => {
    expect(queueStartTime(session({ pausedUntil: at("12:00") }), at("11:40"))).toEqual(at("12:00"));
    expect(queueStartTime(session({ pausedUntil: at("11:00") }), at("11:40"))).toEqual(at("11:40"));
  });
});

describe("projectEtas", () => {
  const stats = { median: 8, p25: 6, samples: 20 };
  const run = (entries: QueueEntryView[], now: Date, s: Partial<SessionTiming> = {}) =>
    projectEtas({ entries, session: session(s), stats, now, graceMinutes: 10 }).map((e) => ({
      id: e.entryId,
      pos: e.position,
      exp: e.expectedAt.toISOString(),
      early: e.earlyAt.toISOString(),
    }));
  const row = (id: string, pos: number, exp: string, early: string) => ({
    id,
    pos,
    exp: at(exp).toISOString(),
    early: at(early).toISOString(),
  });

  test("adds the remaining time of the current consultation", () => {
    const cur = entry({ status: "IN_CONSULTATION", checkedInAt: at("09:30"), startedAt: at("09:57") });
    const w1 = entry({ id: "w1", checkedInAt: at("09:40") });
    const w2 = entry({ id: "w2", checkedInAt: at("09:50") });
    expect(run([cur, w2, w1], at("10:00"))).toEqual([row("w1", 1, "10:05", "10:03"), row("w2", 2, "10:13", "10:09")]);
  });

  test("an overrunning consultation still has at least a minute left on the expected estimate", () => {
    const cur = entry({ status: "IN_CONSULTATION", checkedInAt: at("09:30"), startedAt: at("09:45") });
    const w1 = entry({ id: "w1", checkedInAt: at("09:40") });
    expect(run([cur, w1], at("10:00"))).toEqual([row("w1", 1, "10:01", "10:00")]);
  });

  test("doctor not arrived and no notice: session start", () => {
    const b = booking({ id: "b", scheduledAt: at("10:00") });
    expect(run([b], at("09:30"), { doctorArrivedAt: null })).toEqual([row("b", 1, "10:00", "10:00")]);
  });

  test("announced late start", () => {
    const w1 = entry({ id: "w1", checkedInAt: at("10:05") });
    expect(run([w1], at("10:10"), { doctorArrivedAt: null, expectedStartAt: at("10:45") })).toEqual([
      row("w1", 1, "10:45", "10:45"),
    ]);
  });

  test("arrival overrides the announced start", () => {
    const w1 = entry({ id: "w1", checkedInAt: at("10:05") });
    expect(run([w1], at("10:30"), { doctorArrivedAt: at("10:20"), expectedStartAt: at("10:45") })).toEqual([
      row("w1", 1, "10:30", "10:30"),
    ]);
  });

  test("break", () => {
    const w1 = entry({ id: "w1", checkedInAt: at("11:30") });
    expect(run([w1], at("11:40"), { pausedUntil: at("12:00") })).toEqual([row("w1", 1, "12:00", "12:00")]);
  });

  test("a booking is never estimated before its slot", () => {
    const b = booking({ id: "b", scheduledAt: at("11:30") });
    expect(run([b], at("10:00"))).toEqual([row("b", 1, "11:30", "11:30")]);
  });

  test("early estimate skips absent bookings ahead", () => {
    const a = entry({ id: "a", checkedInAt: at("10:05") });
    const b = booking({ id: "b", scheduledAt: at("10:20") });
    const c = entry({ id: "c", checkedInAt: at("10:22") });
    expect(run([a, b, c], at("10:25"))).toEqual([
      row("a", 1, "10:25", "10:25"),
      row("b", 2, "10:33", "10:31"),
      row("c", 3, "10:41", "10:31"),
    ]);
  });

  test("a booking that lost its slot gets no estimate", () => {
    const b = booking({ id: "b", scheduledAt: at("10:20"), passedAt: at("10:25") });
    expect(run([b], at("10:40"))).toEqual([]);
  });

  test("closed session", () => {
    const w1 = entry({ id: "w1", checkedInAt: at("10:05") });
    expect(run([w1], at("10:10"), { closedAt: at("10:09") })).toEqual([]);
  });
});
