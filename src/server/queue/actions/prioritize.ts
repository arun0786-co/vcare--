import { eq } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import { queueEntries } from "../../db/schema";
import { findEntry } from "../entries";
import { recordEvent } from "../events";
import type { ActionHandler } from "./types";

// Emergencies jump the queue. The reason and who did it are kept in the event log.
export const prioritize: ActionHandler<"PRIORITIZE"> = {
  todayOnly: true,
  async run(ctx, action) {
    const entry = await findEntry(ctx.tx, ctx.session.id, action.entryId);
    if (entry.status !== "CHECKED_IN") throw new QueueError("VALIDATION", "Only waiting patients can be prioritized");
    await ctx.tx
      .update(queueEntries)
      .set({ priorityAt: ctx.now, priorityReason: action.reason, updatedAt: ctx.now })
      .where(eq(queueEntries.id, entry.id));
    await recordEvent(ctx.tx, {
      sessionId: ctx.session.id,
      entryId: entry.id,
      type: "PRIORITIZE",
      actor: ctx.actor,
      reason: action.reason,
      at: ctx.now,
    });
  },
};
