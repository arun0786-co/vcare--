import { and, inArray, isNull } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import { planNext } from "@/domain/queue/next";
import { queueEntries } from "../../db/schema";
import { completeCurrent, currentConsultation } from "../consultation";
import { loadEntries, toView } from "../entries";
import { recordEvent } from "../events";
import { updateSession } from "../session-update";
import { transitionEntry } from "../transition";
import type { ActionHandler } from "./types";

// "Next patient": finish whoever is inside and call the first patient waiting.
// expectedCurrentId is who the receptionist saw inside; if that changed, someone
// else already pressed Next and this press must not move a second patient.
export const next: ActionHandler<"NEXT"> = {
  todayOnly: true,
  async run(ctx, action) {
    const entries = await loadEntries(ctx.tx, ctx.session.id);
    if ((currentConsultation(entries)?.id ?? null) !== action.expectedCurrentId) {
      throw new QueueError("CONFLICT", "The queue changed. Refresh and try again.");
    }
    const plan = planNext(entries.map(toView), ctx.session.graceMinutes);
    if (!plan.completeId && !plan.startId) throw new QueueError("EMPTY_QUEUE", "Nobody is waiting");

    await completeCurrent(ctx, entries);

    if (plan.passedIds.length > 0) {
      await ctx.tx
        .update(queueEntries)
        .set({ passedAt: ctx.now, updatedAt: ctx.now })
        .where(and(inArray(queueEntries.id, plan.passedIds), isNull(queueEntries.passedAt)));
      for (const entryId of plan.passedIds) {
        await recordEvent(ctx.tx, { sessionId: ctx.session.id, entryId, type: "PASSED_OVER", actor: ctx.actor, at: ctx.now });
      }
    }

    const nextEntry = entries.find((e) => e.id === plan.startId);
    if (nextEntry) {
      await transitionEntry(ctx, nextEntry, "IN_CONSULTATION", { type: "CALL", patch: { startedAt: ctx.now } });
      await updateSession(
        ctx,
        { doctorArrivedAt: ctx.session.timing.doctorArrivedAt ?? ctx.now, pausedUntil: null, pauseReason: null },
        { type: "NEXT", payload: { startedEntryId: nextEntry.id } },
      );
    }
  },
};
