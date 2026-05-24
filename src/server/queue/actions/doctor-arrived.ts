import { updateSession } from "../session-update";
import type { ActionHandler } from "./types";

// From now on estimates follow real progress instead of the announced start. Pressing it again does nothing.
export const doctorArrived: ActionHandler<"DOCTOR_ARRIVED"> = {
  todayOnly: true,
  async run(ctx) {
    if (ctx.session.timing.doctorArrivedAt) return;
    await updateSession(ctx, { doctorArrivedAt: ctx.now }, { type: "DOCTOR_ARRIVED" });
  },
};
