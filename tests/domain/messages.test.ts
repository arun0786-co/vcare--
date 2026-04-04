import { describe, expect, test } from "vitest";
import { leaveNowMessage, linkMessage } from "@/domain/notify/messages";

describe("linkMessage", () => {
  test("booking with a slot", () => {
    expect(
      linkMessage({ clinicName: "Demo Clinic", name: "Anita", ticketNo: 4, slot: "10:30 AM", url: "https://x/q/abc" }),
    ).toBe("VCare: Demo Clinic booking for Anita, ticket 4, slot 10:30 AM. Live queue status: https://x/q/abc");
  });

  test("walk-in without a slot", () => {
    expect(linkMessage({ clinicName: "Demo Clinic", name: "Ravi", ticketNo: 9, slot: null, url: "https://x/q/def" })).toBe(
      "VCare: Demo Clinic booking for Ravi, ticket 9. Live queue status: https://x/q/def",
    );
  });
});

test("leaveNowMessage", () => {
  expect(leaveNowMessage({ clinicName: "Demo Clinic", expectedTime: "11:20 AM", url: "https://x/q/abc" })).toBe(
    "VCare: time to leave for Demo Clinic. Your turn is expected around 11:20 AM. Live status: https://x/q/abc",
  );
});
