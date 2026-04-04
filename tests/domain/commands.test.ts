import { describe, expect, test } from "vitest";
import { parseStaffAction } from "@/domain/queue/commands";

const ID = "6f1c1f3e-8a2b-4c3d-9e4f-5a6b7c8d9e0f";

describe("parseStaffAction", () => {
  test("NEXT with or without someone in consultation", () => {
    expect(parseStaffAction({ type: "NEXT", expectedCurrentId: null })).toEqual({ type: "NEXT", expectedCurrentId: null });
    expect(parseStaffAction({ type: "NEXT", expectedCurrentId: ID })).toEqual({ type: "NEXT", expectedCurrentId: ID });
  });

  test("walk-in trims the name and treats a blank phone as none", () => {
    expect(parseStaffAction({ type: "ADD_WALK_IN", name: "  Ravi  ", phone: " " })).toEqual({
      type: "ADD_WALK_IN",
      name: "Ravi",
      phone: undefined,
    });
  });

  test("times become dates", () => {
    const parsed = parseStaffAction({ type: "DOCTOR_LATE", expectedStartAt: "2026-10-26T10:45:00+05:30" });
    expect(parsed).toEqual({ type: "DOCTOR_LATE", expectedStartAt: new Date("2026-10-26T05:15:00Z") });
  });

  test("note can be cleared", () => {
    expect(parseStaffAction({ type: "SET_NOTE", note: null })).toEqual({ type: "SET_NOTE", note: null });
  });

  test.each([
    [{ type: "PRIORITIZE", entryId: ID, reason: "" }, "reason"],
    [{ type: "ADD_WALK_IN", name: "   " }, "name"],
    [{ type: "CHECK_IN", entryId: "not-a-uuid" }, "entry"],
    [{ type: "NEXT" }, ""],
    [{ type: "DANCE" }, ""],
    [{ type: "SET_NOTE", note: "x".repeat(201) }, ""],
    [{ type: "DOCTOR_LATE", expectedStartAt: "10:45" }, ""],
    [null, ""],
  ])("rejects %j", (input, hint) => {
    expect(() => parseStaffAction(input)).toThrow(expect.objectContaining({ code: "VALIDATION" }));
    if (hint) expect(() => parseStaffAction(input)).toThrow(new RegExp(hint, "i"));
  });
});
