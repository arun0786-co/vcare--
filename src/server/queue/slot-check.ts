import { and, eq, isNotNull, ne } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import { isFreeSlot, type SlotGrid } from "@/domain/slots";
import type { DbOrTx } from "../db/client";
import { queueEntries } from "../db/schema";
import type { ActionContext } from "./context";

export async function takenSlots(db: DbOrTx, sessionId: string): Promise<Date[]> {
  const rows = await db
    .select({ at: queueEntries.scheduledAt })
    .from(queueEntries)
    .where(and(eq(queueEntries.sessionId, sessionId), isNotNull(queueEntries.scheduledAt), ne(queueEntries.status, "CANCELLED")));
  return rows.flatMap((r) => (r.at ? [r.at] : []));
}

export async function assertSlotFree(ctx: ActionContext, slot: Date): Promise<void> {
  const grid: SlotGrid = {
    startsAt: ctx.session.timing.startsAt,
    endsAt: ctx.session.timing.endsAt,
    slotMinutes: ctx.session.slotMinutes,
    taken: [],
    now: ctx.now,
  };
  if (!isFreeSlot(grid, slot)) throw new QueueError("VALIDATION", "Pick one of the available slots");
  const taken = await takenSlots(ctx.tx, ctx.session.id);
  if (!isFreeSlot({ ...grid, taken }, slot)) throw new QueueError("SLOT_TAKEN", "That slot was just taken. Pick another one.");
}
