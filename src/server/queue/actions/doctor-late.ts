import { QueueError } from "@/domain/errors";
import { updateSession } from "../session-update";
import type { ActionHandler } from "./types";

// Moves every estimate until the doctor actually arrives.
export const doctorLate: ActionHandler<"DOCTOR_LATE"> = {
  todayOnly: false,
  async run(ctx, action) {
    if (ctx.session.timing.doctorArrivedAt) throw new QueueError("VALIDATION", "The doctor has already arrived");
    if (action.expectedStartAt <= ctx.now) throw new QueueError("VALIDATION", "Pick a time later than now");
    await updateSession(
      ctx,
      { expectedStartAt: action.expectedStartAt },
      { type: "DOCTOR_LATE", payload: { expectedStartAt: action.expectedStartAt.toISOString() } },
    );
  },
};
