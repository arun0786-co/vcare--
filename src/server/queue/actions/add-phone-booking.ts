import { insertEntry } from "../insert-entry";
import type { ActionHandler } from "./types";

// Receptionist books a slot for a caller; works for future sessions too.
export const addPhoneBooking: ActionHandler<"ADD_PHONE_BOOKING"> = {
  todayOnly: false,
  async run(ctx, action) {
    const entry = await insertEntry(ctx, {
      channel: "PHONE",
      name: action.name,
      phone: action.phone,
      scheduledAt: action.scheduledAt,
    });
    return { createdEntryId: entry.id };
  },
};
