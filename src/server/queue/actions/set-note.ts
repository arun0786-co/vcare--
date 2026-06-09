import { updateSession } from "../session-update";
import type { ActionHandler } from "./types";

// A short message shown to every patient of the session, e.g. "Doctor called to an emergency".
export const setNote: ActionHandler<"SET_NOTE"> = {
  todayOnly: false,
  async run(ctx, action) {
    const note = action.note ? action.note : null;
    await updateSession(ctx, { publicNote: note }, { type: "SET_NOTE", payload: { note } });
  },
};
