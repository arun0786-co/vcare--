import { findEntry } from "../entries";
import { transitionEntry } from "../transition";
import type { ActionHandler } from "./types";

// Cancelling frees the slot for someone else.
export const cancel: ActionHandler<"CANCEL"> = {
  todayOnly: false,
  async run(ctx, action) {
    const entry = await findEntry(ctx.tx, ctx.session.id, action.entryId);
    await transitionEntry(ctx, entry, "CANCELLED", { type: "CANCEL", reason: action.reason });
  },
};
