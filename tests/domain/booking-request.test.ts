import { describe, expect, test } from "vitest";
import { parseBookingRequest } from "@/domain/booking/request";

const ID = "6f1c1f3e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";
const valid = { sessionId: ID, scheduledAt: "2026-10-26T10:30:00+05:30", name: " Anita ", phone: "98765 43210", travelMinutes: 20 };

describe("parseBookingRequest", () => {
  test("parses and trims", () => {
    expect(parseBookingRequest(valid)).toEqual({
      sessionId: ID,
      scheduledAt: new Date("2026-10-26T05:00:00Z"),
      name: "Anita",
      phone: "98765 43210",
      travelMinutes: 20,
    });
  });

  test("travel time is optional", () => {
    expect(parseBookingRequest({ ...valid, travelMinutes: undefined }).travelMinutes).toBeNull();
    expect(parseBookingRequest({ ...valid, travelMinutes: null }).travelMinutes).toBeNull();
  });

  test.each([
    [{ ...valid, name: "" }, "name"],
    [{ ...valid, phone: "" }, "phone"],
    [{ ...valid, sessionId: "x" }, ""],
    [{ ...valid, scheduledAt: "tomorrow" }, ""],
    [{ ...valid, travelMinutes: "twenty" }, ""],
    [undefined, ""],
  ])("rejects %j", (input, hint) => {
    expect(() => parseBookingRequest(input)).toThrow(expect.objectContaining({ code: "VALIDATION" }));
    if (hint) expect(() => parseBookingRequest(input)).toThrow(new RegExp(hint, "i"));
  });
});
