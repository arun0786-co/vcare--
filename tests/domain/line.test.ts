import { describe, expect, test } from "vitest";
import { ENTRY_STATUSES } from "@/domain/queue/types";
import { callableQueue } from "@/domain/queue/line";
import { booking, entry } from "../support/entries";
import { at } from "../support/time";

describe("callableQueue", () => {
  test("only checked-in patients, in queue order", () => {
    const all = ENTRY_STATUSES.map((status) => entry({ id: status, status, checkedInAt: at("10:00") }));
    expect(callableQueue(all, 10).map((e) => e.id)).toEqual(["CHECKED_IN"]);
  });

  test("walk-in who came first goes ahead of an early appointment", () => {
    const appt = booking({ id: "a", status: "CHECKED_IN", scheduledAt: at("10:30"), checkedInAt: at("10:00") });
    const walk = entry({ id: "w", checkedInAt: at("10:10") });
    expect(callableQueue([appt, walk], 10).map((e) => e.id)).toEqual(["w", "a"]);
  });
});
