import { describe, expect, test } from "vitest";
import { orderKey } from "@/domain/queue/order";
import { booking, entry } from "../support/entries";
import { at } from "../support/time";

describe("orderKey", () => {
  test("walk-in uses check-in time", () => {
    expect(orderKey(entry({ checkedInAt: at("10:10") }), 10)).toEqual(at("10:10"));
  });

  test("early appointment keeps its slot time", () => {
    const appt = booking({ status: "CHECKED_IN", scheduledAt: at("10:30"), checkedInAt: at("10:00") });
    expect(orderKey(appt, 10)).toEqual(at("10:30"));
  });

  test("absent appointment uses its slot time", () => {
    expect(orderKey(booking({ scheduledAt: at("10:30") }), 10)).toEqual(at("10:30"));
  });

  test("appointment never passed over keeps its slot however late it arrives", () => {
    const appt = booking({ status: "CHECKED_IN", scheduledAt: at("10:30"), checkedInAt: at("11:30") });
    expect(orderKey(appt, 10)).toEqual(at("10:30"));
  });

  test("passed over: keeps slot within grace, loses it after", () => {
    const base = { status: "CHECKED_IN" as const, scheduledAt: at("10:30"), passedAt: at("10:32") };
    expect(orderKey(booking({ ...base, checkedInAt: at("10:42") }), 10)).toEqual(at("10:30"));
    expect(orderKey(booking({ ...base, checkedInAt: at("10:43") }), 10)).toEqual(at("10:43"));
  });

  test("walk-in without a check-in time is a programming error", () => {
    expect(() => orderKey(entry({ status: "BOOKED", checkedInAt: null }), 10)).toThrow();
  });
});
