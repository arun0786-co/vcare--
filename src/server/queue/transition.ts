import { and, eq } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import { assertTransition } from "@/domain/queue/transitions";
import type { EntryStatus } from "@/domain/queue/types";
import { queueEntries } from "../db/schema";
import type { ActionContext } from "./context";
import type { EntryPatch, EntryRow } from "./entries";
import { recordEvent } from "./events";

// The only way an entry's status changes: checks the rule, writes the row and its event.
export async function transitionEntry(
  ctx: ActionContext,
  entry: EntryRow,
  to: EntryStatus,
  opts: { type: string; patch?: EntryPatch; reason?: string | null },
): Promise<EntryRow> {
  assertTransition(entry.status, to);
  const [updated] = await ctx.tx
    .update(queueEntries)
    .set({ ...opts.patch, status: to, updatedAt: ctx.now })
    .where(and(eq(queueEntries.id, entry.id), eq(queueEntries.status, entry.status)))
    .returning();
  if (!updated) throw new QueueError("CONFLICT", "The queue changed. Refresh and try again.");
  await recordEvent(ctx.tx, {
    sessionId: entry.sessionId,
    entryId: entry.id,
    type: opts.type,
    from: entry.status,
    to,
    actor: ctx.actor,
    reason: opts.reason,
    at: ctx.now,
  });
  return updated;
}
