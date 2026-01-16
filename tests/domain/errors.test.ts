import { expect, test } from "vitest";
import { QueueError, isQueueError } from "@/domain/errors";

test("QueueError carries a code and message", () => {
  const err = new QueueError("SLOT_TAKEN", "That slot was just taken");
  expect(err).toBeInstanceOf(Error);
  expect(err.code).toBe("SLOT_TAKEN");
  expect(err.message).toBe("That slot was just taken");
  expect(err.name).toBe("QueueError");
});

test("isQueueError narrows by code", () => {
  const err = new QueueError("CONFLICT", "changed");
  expect(isQueueError(err)).toBe(true);
  expect(isQueueError(err, "CONFLICT")).toBe(true);
  expect(isQueueError(err, "NOT_FOUND")).toBe(false);
  expect(isQueueError(new Error("x"))).toBe(false);
});
