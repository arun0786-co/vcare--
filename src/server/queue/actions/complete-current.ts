import { QueueError } from "@/domain/errors";
import { completeCurrent as finish, currentConsultation } from "../consultation";
import { loadEntries } from "../entries";
import type { ActionHandler } from "./types";

// "Finish": the patient inside is done and nobody is called yet (end of session, before a break).
export const completeCurrent: ActionHandler<"COMPLETE_CURRENT"> = {
  todayOnly: true,
  async run(ctx, action) {
    const entries = await loadEntries(ctx.tx, ctx.session.id);
    if (currentConsultation(entries)?.id !== action.expectedCurrentId) {
      throw new QueueError("CONFLICT", "The queue changed. Refresh and try again.");
    }
    await finish(ctx, entries);
  },
};
