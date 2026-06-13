import { QueueError } from "@/domain/errors";
import { parseStaffAction } from "@/domain/queue/commands";
import { clinicDateString } from "@/domain/time";
import type { Db } from "../db/client";
import { publishSessionChanged } from "../realtime/publish";
import { HANDLERS } from "./actions";
import type { ActionResult } from "./actions/types";
import type { StaffActor } from "./events";
import { lockSession } from "./session-lock";

// Single entry point for every staff change to a session's queue.
export async function applyAction(
  db: Db,
  args: { sessionId: string; clinicId: string; actor: StaffActor; action: unknown; now: Date },
): Promise<ActionResult> {
  const action = parseStaffAction(args.action);
  const handler = HANDLERS[action.type];

  return db.transaction(async (tx) => {
    const session = await lockSession(tx, args.sessionId, args.clinicId);
    if (handler.todayOnly && session.date !== clinicDateString(args.now, session.timezone)) {
      throw new QueueError("VALIDATION", "Only today's session can be run");
    }
    const result = await handler.run({ tx, session, actor: args.actor, now: args.now }, action as never);
    await publishSessionChanged(tx, session.id);
    return result ?? {};
  });
}
