import { completeCurrent } from "../consultation";
import { loadEntries } from "../entries";
import { updateSession } from "../session-update";
import { transitionEntry } from "../transition";
import type { ActionHandler } from "./types";

// End of the sitting: finish whoever is inside, cancel everyone still waiting or booked.
export const closeSession: ActionHandler<"CLOSE_SESSION"> = {
  todayOnly: false,
  async run(ctx) {
    const entries = await loadEntries(ctx.tx, ctx.session.id);
    await completeCurrent(ctx, entries);
    for (const entry of entries) {
      if (entry.status === "BOOKED" || entry.status === "CHECKED_IN") {
        await transitionEntry(ctx, entry, "CANCELLED", { type: "CANCEL", reason: "session closed" });
      }
    }
    await updateSession(ctx, { closedAt: ctx.now }, { type: "CLOSE_SESSION" });
  },
};
