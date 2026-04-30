import { findEntry } from "../entries";
import { transitionEntry } from "../transition";
import type { ActionHandler } from "./types";

export const checkIn: ActionHandler<"CHECK_IN"> = {
  todayOnly: true,
  async run(ctx, action) {
    const entry = await findEntry(ctx.tx, ctx.session.id, action.entryId);
    await transitionEntry(ctx, entry, "CHECKED_IN", { type: "CHECK_IN", patch: { checkedInAt: ctx.now } });
  },
};
