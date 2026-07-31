import { eq } from "drizzle-orm";
import { validTravelMinutes } from "@/domain/booking/travel";
import { QueueError } from "@/domain/errors";
import type { Db } from "../db/client";
import { queueEntries } from "../db/schema";
import { findEntry, findEntryByToken } from "../queue/entries";
import { recordEvent } from "../queue/events";
import { inPatientContext } from "./patient-context";

// How far away the patient is decides when the leave-now alert goes out.
export async function setTravelMinutes(db: Db, token: string, minutes: number | null, now: Date): Promise<void> {
  const travelMinutes = validTravelMinutes(minutes);
  const { id, sessionId } = await findEntryByToken(db, token);
  await inPatientContext(db, sessionId, now, async (ctx) => {
    const entry = await findEntry(ctx.tx, sessionId, id);
    if (entry.status !== "BOOKED") throw new QueueError("VALIDATION", "Travel time only matters before you arrive");
    await ctx.tx.update(queueEntries).set({ travelMinutes, updatedAt: now }).where(eq(queueEntries.id, id));
    await recordEvent(ctx.tx, { sessionId, entryId: id, type: "SET_TRAVEL", actor: ctx.actor, payload: { travelMinutes }, at: now });
  });
}
