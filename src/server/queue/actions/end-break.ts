import { updateSession } from "../session-update";
import type { ActionHandler } from "./types";

export const endBreak: ActionHandler<"END_BREAK"> = {
  todayOnly: true,
  async run(ctx) {
    if (!ctx.session.timing.pausedUntil) return;
    await updateSession(ctx, { pausedUntil: null, pauseReason: null }, { type: "END_BREAK" });
  },
};
