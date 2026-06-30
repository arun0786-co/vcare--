import { QueueError } from "@/domain/errors";
import { callableQueue, hasLostSlot } from "@/domain/queue/line";
import type { Eta } from "@/domain/queue/types";
import type { DbOrTx } from "../db/client";
import { toView, type EntryRow } from "./entries";
import { loadSession } from "./session-info";
import { loadSnapshot } from "./snapshot";
import type { BoardEntry, SessionBoard } from "./views";

const iso = (d: Date | null) => (d ? d.toISOString() : null);

function toBoardEntry(row: EntryRow, eta: Eta | undefined): BoardEntry {
  return {
    id: row.id,
    ticketNo: row.ticketNo,
    name: row.patientName,
    phone: row.patientPhone,
    channel: row.channel,
    status: row.status,
    scheduledAt: iso(row.scheduledAt),
    checkedInAt: iso(row.checkedInAt),
    startedAt: iso(row.startedAt),
    prioritized: row.priorityAt !== null,
    position: eta?.position ?? null,
    expectedAt: iso(eta?.expectedAt ?? null),
    publicToken: row.publicToken,
  };
}

// Everything the reception screen shows for one session.
export async function getSessionBoard(db: DbOrTx, sessionId: string, clinicId: string, now: Date): Promise<SessionBoard> {
  const session = await loadSession(db, sessionId);
  if (!session || session.clinicId !== clinicId) throw new QueueError("NOT_FOUND", "Session not found");
  const { rows, views, stats, etaById } = await loadSnapshot(db, session, now);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const entry = (row: EntryRow) => toBoardEntry(row, etaById.get(row.id));
  const booked = rows.filter((r) => r.status === "BOOKED");
  const lost = (r: EntryRow) => hasLostSlot(toView(r), now, session.graceMinutes);
  const current = rows.find((r) => r.status === "IN_CONSULTATION");

  return {
    session: {
      id: session.id,
      date: session.date,
      doctorName: session.doctorName,
      timezone: session.timezone,
      startsAt: session.timing.startsAt.toISOString(),
      endsAt: session.timing.endsAt.toISOString(),
      expectedStartAt: iso(session.timing.expectedStartAt),
      doctorArrivedAt: iso(session.timing.doctorArrivedAt),
      pausedUntil: iso(session.timing.pausedUntil),
      pauseReason: session.pauseReason,
      publicNote: session.publicNote,
      closedAt: iso(session.timing.closedAt),
    },
    current: current ? entry(current) : null,
    waiting: callableQueue(views, session.graceMinutes).map((v) => entry(byId.get(v.id)!)),
    upcoming: booked.filter((r) => !lost(r)).sort((a, b) => a.scheduledAt!.getTime() - b.scheduledAt!.getTime()).map(entry),
    late: booked.filter(lost).map(entry),
    finished: rows
      .filter((r) => r.status === "COMPLETED" || r.status === "NO_SHOW" || r.status === "CANCELLED")
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(entry),
    stats,
    generatedAt: now.toISOString(),
  };
}
