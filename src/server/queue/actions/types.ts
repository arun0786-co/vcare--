import type { StaffAction, StaffActionType } from "@/domain/queue/commands";
import type { ActionContext } from "../context";

export interface ActionResult {
  createdEntryId?: string;
}

export interface ActionHandler<T extends StaffActionType> {
  // Running the queue (calling, checking in, breaks) only makes sense on the session's own day.
  todayOnly: boolean;
  run(ctx: ActionContext, action: Extract<StaffAction, { type: T }>): Promise<ActionResult | void>;
}

export type HandlerRegistry = { [T in StaffActionType]?: ActionHandler<T> };
