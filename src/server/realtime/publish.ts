import { sql } from "drizzle-orm";
import type { DbOrTx } from "../db/client";

export const SESSION_CHANNEL = "vcare_session";

// Postgres delivers NOTIFY on commit, so listeners never see a change that rolled back.
export async function publishSessionChanged(tx: DbOrTx, sessionId: string): Promise<void> {
  await tx.execute(sql`select pg_notify(${SESSION_CHANNEL}, ${sessionId})`);
}
