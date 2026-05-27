import { QueueError } from "@/domain/errors";
import { addMinutes } from "@/domain/clock";
import { completeCurrent } from "../consultation";
import { loadEntries } from "../entries";
import { updateSession } from "../session-update";
import type { ActionHandler } from "./types";

const MAX_BREAK_MINUTES = 4 * 60;

// Finishes the patient inside first, so the break is not counted as consultation time.
export const startBreak: ActionHandler<"START_BREAK"> = {
  todayOnly: true,
  async run(ctx, action) {
    if (action.until <= ctx.now || action.until > addMinutes(ctx.now, MAX_BREAK_MINUTES)) {
      throw new QueueError("VALIDATION", "Pick an end time within the next 4 hours");
    }
    await completeCurrent(ctx, await loadEntries(ctx.tx, ctx.session.id));
    await updateSession(
      ctx,
      { pausedUntil: action.until, pauseReason: action.reason ?? null },
      { type: "START_BREAK", reason: action.reason, payload: { until: action.until.toISOString() } },
    );
  },
};
