import { and, asc, eq } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import type { QueueEntryView } from "@/domain/queue/types";
import type { DbOrTx } from "../db/client";
import { isUuid } from "../db/ids";
import { queueEntries } from "../db/schema";

export type EntryRow = typeof queueEntries.$inferSelect;
export type EntryPatch = Partial<typeof queueEntries.$inferInsert>;

export function toView(row: EntryRow): QueueEntryView {
  return {
    id: row.id,
    ticketNo: row.ticketNo,
    channel: row.channel,
    status: row.status,
    scheduledAt: row.scheduledAt,
    checkedInAt: row.checkedInAt,
    startedAt: row.startedAt,
    passedAt: row.passedAt,
    priorityAt: row.priorityAt,
    travelMinutes: row.travelMinutes,
    hasPhone: row.patientPhone !== null,
  };
}

export async function loadEntries(db: DbOrTx, sessionId: string): Promise<EntryRow[]> {
  return db.select().from(queueEntries).where(eq(queueEntries.sessionId, sessionId)).orderBy(asc(queueEntries.ticketNo));
}

export async function findEntry(db: DbOrTx, sessionId: string, entryId: string): Promise<EntryRow> {
  if (!isUuid(entryId)) throw new QueueError("NOT_FOUND", "Patient not found in this session");
  const [row] = await db
    .select()
    .from(queueEntries)
    .where(and(eq(queueEntries.id, entryId), eq(queueEntries.sessionId, sessionId)));
  if (!row) throw new QueueError("NOT_FOUND", "Patient not found in this session");
  return row;
}
