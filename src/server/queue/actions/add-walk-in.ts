import { insertEntry } from "../insert-entry";
import type { ActionHandler } from "./types";

export const addWalkIn: ActionHandler<"ADD_WALK_IN"> = {
  todayOnly: true,
  async run(ctx, action) {
    const entry = await insertEntry(ctx, { channel: "WALK_IN", name: action.name, phone: action.phone ?? null, scheduledAt: null });
    return { createdEntryId: entry.id };
  },
};
