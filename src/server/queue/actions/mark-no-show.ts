import { findEntry } from "../entries";
import { transitionEntry } from "../transition";
import type { ActionHandler } from "./types";

// Counts as passing the patient over, so their grace period starts now if it has not already.
export const markNoShow: ActionHandler<"MARK_NO_SHOW"> = {
  todayOnly: false,
  async run(ctx, action) {
    const entry = await findEntry(ctx.tx, ctx.session.id, action.entryId);
    await transitionEntry(ctx, entry, "NO_SHOW", { type: "MARK_NO_SHOW", patch: { passedAt: entry.passedAt ?? ctx.now } });
  },
};
