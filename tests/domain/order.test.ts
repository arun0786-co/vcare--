import { describe, expect, test } from "vitest";
import { compareEntries, orderKey } from "@/domain/queue/order";
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

describe("compareEntries", () => {
  const sort = (list: ReturnType<typeof entry>[]) =>
    [...list].sort((a, b) => compareEntries(a, b, 10)).map((e) => e.id);

  test("earlier key first", () => {
    const late = entry({ id: "late", checkedInAt: at("10:20") });
    const early = entry({ id: "early", checkedInAt: at("10:05") });
    expect(sort([late, early])).toEqual(["early", "late"]);
  });

  test("prioritized first, in the order they were prioritized", () => {
    const w = entry({ id: "w", checkedInAt: at("09:00") });
    const p2 = entry({ id: "p2", checkedInAt: at("10:00"), priorityAt: at("10:20") });
    const p1 = entry({ id: "p1", checkedInAt: at("10:01"), priorityAt: at("10:10") });
    expect(sort([w, p2, p1])).toEqual(["p1", "p2", "w"]);
  });

  test("equal keys go to the lower ticket", () => {
    const t7 = booking({ id: "t7", ticketNo: 7, status: "CHECKED_IN", scheduledAt: at("10:30"), checkedInAt: at("10:00") });
    const t3 = entry({ id: "t3", ticketNo: 3, checkedInAt: at("10:30") });
    expect(sort([t7, t3])).toEqual(["t3", "t7"]);
  });
});
