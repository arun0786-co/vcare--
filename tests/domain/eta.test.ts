import { describe, expect, test } from "vitest";
import { queueStartTime } from "@/domain/estimate/eta";
import type { SessionTiming } from "@/domain/queue/types";
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
