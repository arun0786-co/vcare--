import { projectEtas } from "@/domain/estimate/eta";
import type { DurationStats, Eta, QueueEntryView } from "@/domain/queue/types";
import type { DbOrTx } from "../db/client";
import { loadEntries, toView, type EntryRow } from "./entries";
import type { SessionInfo } from "./session-info";
import { loadDurationStats } from "./stats";

export interface QueueSnapshot {
  rows: EntryRow[];
  views: QueueEntryView[];
  stats: DurationStats;
  etaById: Map<string, Eta>;
}

// The session's entries with live estimates, as of now.
export async function loadSnapshot(db: DbOrTx, session: SessionInfo, now: Date): Promise<QueueSnapshot> {
  const rows = await loadEntries(db, session.id);
  const views = rows.map(toView);
  const stats = await loadDurationStats(db, session.doctorId, now);
  const etas = projectEtas({ entries: views, session: session.timing, stats, now, graceMinutes: session.graceMinutes });
  return { rows, views, stats, etaById: new Map(etas.map((e) => [e.entryId, e])) };
}
