import { addMinutes } from "@/domain/clock";
import { QueueError } from "@/domain/errors";
import { hasLostSlot } from "@/domain/queue/line";
import type { DbOrTx } from "../db/client";
import { findEntryByToken, toView } from "./entries";
import { loadSession } from "./session-info";
import { loadSnapshot } from "./snapshot";
import type { PatientStatus } from "./views";

const iso = (d: Date | null) => (d ? d.toISOString() : null);

// What the patient's link shows. Other patients appear only as the ticket being served.
export async function getPatientStatus(db: DbOrTx, token: string, now: Date): Promise<PatientStatus> {
  const entry = await findEntryByToken(db, token);
  const session = await loadSession(db, entry.sessionId);
  if (!session) throw new QueueError("NOT_FOUND", "This link is not valid");
  const { rows, etaById } = await loadSnapshot(db, session, now);
  const eta = etaById.get(entry.id);
  const lost = hasLostSlot(toView(entry), now, session.graceMinutes);
  const slotHeld = entry.status === "BOOKED" && entry.passedAt !== null && !lost;

  return {
    ticketNo: entry.ticketNo,
    name: entry.patientName,
    status: entry.status,
    clinicName: session.clinicName,
    doctorName: session.doctorName,
    timezone: session.timezone,
    scheduledAt: iso(entry.scheduledAt),
    position: eta?.position ?? null,
    aheadCount: eta ? eta.position - 1 : null,
    expectedAt: iso(eta?.expectedAt ?? null),
    lateForSlot: lost,
    slotHeldUntil: slotHeld ? addMinutes(entry.passedAt!, session.graceMinutes).toISOString() : null,
    nowServingTicket: rows.find((r) => r.status === "IN_CONSULTATION")?.ticketNo ?? null,
    travelMinutes: entry.travelMinutes,
    session: {
      doctorArrived: session.timing.doctorArrivedAt !== null,
      expectedStartAt: iso(session.timing.expectedStartAt),
      pausedUntil: iso(session.timing.pausedUntil),
      pauseReason: session.pauseReason,
      publicNote: session.publicNote,
      closed: session.timing.closedAt !== null,
    },
    generatedAt: now.toISOString(),
  };
}
