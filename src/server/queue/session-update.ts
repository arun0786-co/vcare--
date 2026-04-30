import { eq } from "drizzle-orm";
import { doctorSessions } from "../db/schema";
import type { ActionContext } from "./context";
import { recordEvent } from "./events";

export type SessionPatch = Partial<typeof doctorSessions.$inferInsert>;

// Changes session-level state (doctor late, break, note, ...) and records why.
export async function updateSession(
  ctx: ActionContext,
  patch: SessionPatch,
  event: { type: string; reason?: string | null; payload?: unknown },
): Promise<void> {
  await ctx.tx.update(doctorSessions).set(patch).where(eq(doctorSessions.id, ctx.session.id));
  await recordEvent(ctx.tx, { sessionId: ctx.session.id, actor: ctx.actor, at: ctx.now, ...event });
}
