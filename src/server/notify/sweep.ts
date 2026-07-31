import { and, gt, isNull, lt } from "drizzle-orm";
import { addMinutes } from "@/domain/clock";
import { delayMessage, leaveNowMessage } from "@/domain/notify/messages";
import { planAlerts, type PlannedAlert } from "@/domain/notify/plan";
import { formatClinicTime } from "@/domain/time";
import type { Db } from "../db/client";
import { doctorSessions } from "../db/schema";
import { loadSession, type SessionInfo } from "../queue/session-info";
import { loadSnapshot } from "../queue/snapshot";
import { loadAlertHistory } from "./alert-history";
import { enqueueNotification } from "./outbox";
import { statusUrl } from "./status-url";

// Open sessions close enough in time for an alert to matter.
async function activeSessionIds(db: Db, now: Date): Promise<string[]> {
  const rows = await db
    .select({ id: doctorSessions.id })
    .from(doctorSessions)
    .where(
      and(
        isNull(doctorSessions.closedAt),
        lt(doctorSessions.startsAt, addMinutes(now, 24 * 60)),
        gt(doctorSessions.endsAt, addMinutes(now, -12 * 60)),
      ),
    );
  return rows.map((r) => r.id);
}

function messageFor(plan: PlannedAlert, session: SessionInfo, token: string): string {
  const expectedTime = formatClinicTime(plan.expectedAt, session.timezone);
  const url = statusUrl(token);
  return plan.kind === "LEAVE_NOW"
    ? leaveNowMessage({ clinicName: session.clinicName, expectedTime, url })
    : delayMessage({ doctorName: session.doctorName, expectedTime, url });
}

async function sweepSession(db: Db, session: SessionInfo, now: Date): Promise<number> {
  const { rows, views, etaById } = await loadSnapshot(db, session, now);
  const history = await loadAlertHistory(db, rows.map((r) => r.id));
  const plans = planAlerts({ entries: views, etas: [...etaById.values()], history, now, bufferMinutes: session.alertBufferMinutes });
  const byId = new Map(rows.map((r) => [r.id, r]));
  let enqueued = 0;
  for (const plan of plans) {
    const entry = byId.get(plan.entryId)!;
    const added = await enqueueNotification(
      db,
      {
        entryId: entry.id,
        kind: plan.kind,
        dedupeKey: plan.dedupeKey,
        toPhone: entry.patientPhone!,
        body: messageFor(plan, session, entry.publicToken),
        payload: {
          expectedAt: plan.expectedAt.toISOString(),
          earlyAt: plan.earlyAt.toISOString(),
          leaveAt: plan.leaveAt.toISOString(),
        },
      },
      now,
    );
    if (added) enqueued += 1;
  }
  return enqueued;
}

// Recomputes every open session's estimates and queues the alerts that are now due.
// One broken session does not stop the others.
export async function runAlertSweep(db: Db, now: Date): Promise<number> {
  let total = 0;
  for (const id of await activeSessionIds(db, now)) {
    try {
      const session = await loadSession(db, id);
      if (session) total += await sweepSession(db, session, now);
    } catch (err) {
      console.error(`[sweep] session ${id} failed`, err);
    }
  }
  return total;
}
