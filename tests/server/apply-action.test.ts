import { expect, test } from "vitest";
import { db } from "@/server/db/client";
import { applyAction } from "@/server/queue/apply-action";
import { at } from "../support/time";
import { setupSession } from "./fixtures";

test("malformed actions are VALIDATION errors before touching the database", async () => {
  const { act } = await setupSession();
  await expect(act({ type: "DANCE" }, at("10:00"))).rejects.toMatchObject({ code: "VALIDATION" });
  await expect(act(null, at("10:00"))).rejects.toMatchObject({ code: "VALIDATION" });
});

test("another clinic's staff cannot act on the session", async () => {
  const { sessionId, staffId } = await setupSession();
  await expect(
    applyAction(db, {
      sessionId,
      clinicId: "6f1c1f3e-8a2b-4c3d-9e4f-5a6b7c8d9e0f",
      actor: { kind: "STAFF", staffId },
      action: { type: "DOCTOR_ARRIVED" },
      now: at("10:00"),
    }),
  ).rejects.toMatchObject({ code: expect.stringMatching(/NOT_FOUND|VALIDATION/) });
});
