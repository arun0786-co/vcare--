import type { Db } from "../db/client";
import { findEntry, findEntryByToken } from "../queue/entries";
import { transitionEntry } from "../queue/transition";
import { inPatientContext } from "./patient-context";

export async function cancelByToken(db: Db, token: string, now: Date): Promise<void> {
  const { id, sessionId } = await findEntryByToken(db, token);
  await inPatientContext(db, sessionId, now, async (ctx) => {
    const entry = await findEntry(ctx.tx, sessionId, id);
    await transitionEntry(ctx, entry, "CANCELLED", { type: "CANCEL", reason: "cancelled by patient" });
  });
}
