import type { Tx } from "../db/client";
import type { Actor } from "./events";
import type { LockedSession } from "./session-lock";

// Everything a queue change needs: the open transaction, the locked session, who is acting and when.
export interface ActionContext {
  tx: Tx;
  session: LockedSession;
  actor: Actor;
  now: Date;
}
