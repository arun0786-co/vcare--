import type { ActionContext } from "./context";
import type { EntryRow } from "./entries";
import { transitionEntry } from "./transition";

export function currentConsultation(entries: EntryRow[]): EntryRow | null {
  return entries.find((e) => e.status === "IN_CONSULTATION") ?? null;
}

// Ends the running consultation, if any. Its start and end times feed the duration estimates.
export async function completeCurrent(ctx: ActionContext, entries: EntryRow[]): Promise<EntryRow | null> {
  const current = currentConsultation(entries);
  if (!current) return null;
  return transitionEntry(ctx, current, "COMPLETED", { type: "COMPLETE", patch: { completedAt: ctx.now } });
}
