import type { Db } from "../db/client";
import { publishSessionChanged } from "../realtime/publish";
import type { ActionContext } from "../queue/context";
import { lockSession } from "../queue/session-lock";

// Patient-side changes take the same session lock as staff actions and publish the same way.
export async function inPatientContext<T>(
  db: Db,
  sessionId: string,
  now: Date,
  fn: (ctx: ActionContext) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    const session = await lockSession(tx, sessionId);
    const result = await fn({ tx, session, actor: { kind: "PATIENT" }, now });
    await publishSessionChanged(tx, session.id);
    return result;
  });
}
