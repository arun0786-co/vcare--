import { findEntry } from "../entries";
import { transitionEntry } from "../transition";
import type { ActionHandler } from "./types";

// A no-show turned up after all. Where they go is decided by the usual grace rule.
export const recheckIn: ActionHandler<"RECHECK_IN"> = {
  todayOnly: true,
  async run(ctx, action) {
    const entry = await findEntry(ctx.tx, ctx.session.id, action.entryId);
    await transitionEntry(ctx, entry, "CHECKED_IN", { type: "RECHECK_IN", patch: { checkedInAt: ctx.now } });
  },
};
