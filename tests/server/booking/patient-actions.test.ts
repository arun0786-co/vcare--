import { beforeEach, describe, expect, test } from "vitest";
import { cancelByToken } from "@/server/booking/cancel-by-token";
import { createOnlineBooking } from "@/server/booking/create-booking";
import { db } from "@/server/db/client";
import { findEntryByToken } from "@/server/queue/entries";
import { at } from "../../support/time";
import { setupSession } from "../fixtures";

let s: Awaited<ReturnType<typeof setupSession>>;
let token: string;

beforeEach(async () => {
  s = await setupSession();
  ({ token } = await createOnlineBooking(
    db,
    { sessionId: s.sessionId, scheduledAt: at("10:30"), name: "Anita", phone: "9876543210", travelMinutes: null },
    at("09:00"),
  ));
});

describe("cancelByToken", () => {
  test("cancels the patient's own booking", async () => {
    await cancelByToken(db, token, at("09:30"));
    expect(await findEntryByToken(db, token)).toMatchObject({ status: "CANCELLED" });
  });

  test("twice is an invalid transition; unknown token is NOT_FOUND", async () => {
    await cancelByToken(db, token, at("09:30"));
    await expect(cancelByToken(db, token, at("09:31"))).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    await expect(cancelByToken(db, "z".repeat(32), at("09:31"))).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
