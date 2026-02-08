import { expect, test } from "vitest";
import { planNext } from "@/domain/queue/next";
import { booking, entry } from "../support/entries";
import { at } from "../support/time";

test("empty session", () => {
  expect(planNext([], 10)).toEqual({ completeId: null, startId: null, passedIds: [] });
});

test("completes current and starts the first waiting patient", () => {
  const cur = entry({ id: "x", status: "IN_CONSULTATION", checkedInAt: at("09:50") });
  const w2 = entry({ id: "w2", checkedInAt: at("10:05") });
  const w1 = entry({ id: "w1", checkedInAt: at("10:00") });
  expect(planNext([cur, w2, w1], 10)).toEqual({ completeId: "x", startId: "w1", passedIds: [] });
});

test("only completes when nobody is waiting", () => {
  const cur = entry({ id: "x", status: "IN_CONSULTATION", checkedInAt: at("09:50") });
  expect(planNext([cur], 10)).toEqual({ completeId: "x", startId: null, passedIds: [] });
});

test("passes over absent bookings with an earlier key", () => {
  const b = booking({ id: "b", scheduledAt: at("10:20") });
  const later = booking({ id: "later", scheduledAt: at("11:00") });
  const already = booking({ id: "already", scheduledAt: at("10:00"), passedAt: at("10:12") });
  const c = entry({ id: "c", checkedInAt: at("10:22") });
  const cur = entry({ id: "x", status: "IN_CONSULTATION", checkedInAt: at("09:50") });
  expect(planNext([b, later, already, c, cur], 10)).toEqual({ completeId: "x", startId: "c", passedIds: ["b"] });
});

test("a prioritized patient passes nobody over", () => {
  const b = booking({ id: "b", scheduledAt: at("10:20") });
  const c = entry({ id: "c", checkedInAt: at("10:22"), priorityAt: at("10:23") });
  expect(planNext([b, c], 10)).toEqual({ completeId: null, startId: "c", passedIds: [] });
});
