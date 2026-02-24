import { addMinutes } from "../clock";
import { DEFAULTS, type Eta, type QueueEntryView } from "../queue/types";

export interface AlertHistory {
  leaveNowEarlyAt: Date | null;
  lastAlertEarlyAt: Date | null;
  delayCount: number;
}

export interface PlannedAlert {
  entryId: string;
  kind: "LEAVE_NOW" | "DELAY";
  dedupeKey: string;
  expectedAt: Date;
  earlyAt: Date;
  leaveAt: Date;
}

// Alerts only make sense for someone still at home who told us how far away they are.
function alertable(e: QueueEntryView): e is QueueEntryView & { travelMinutes: number } {
  return e.status === "BOOKED" && e.hasPhone && e.travelMinutes !== null;
}

function leaveAt(eta: Eta, travelMinutes: number, bufferMinutes: number): Date {
  return addMinutes(eta.earlyAt, -(travelMinutes + bufferMinutes));
}

export function planLeaveNow(
  e: QueueEntryView,
  eta: Eta,
  history: AlertHistory,
  now: Date,
  bufferMinutes: number,
): PlannedAlert | null {
  if (!alertable(e) || history.leaveNowEarlyAt) return null;
  const at = leaveAt(eta, e.travelMinutes, bufferMinutes);
  if (now < at) return null;
  return {
    entryId: e.id,
    kind: "LEAVE_NOW",
    dedupeKey: `LEAVE_NOW:${e.id}`,
    expectedAt: eta.expectedAt,
    earlyAt: eta.earlyAt,
    leaveAt: at,
  };
}

// A follow-up only when things got clearly worse after we told someone to leave.
export function planDelay(
  e: QueueEntryView,
  eta: Eta,
  history: AlertHistory,
  bufferMinutes: number,
): PlannedAlert | null {
  if (!alertable(e) || !history.leaveNowEarlyAt || !history.lastAlertEarlyAt) return null;
  if (history.delayCount >= DEFAULTS.maxDelayAlerts) return null;
  if (eta.earlyAt < addMinutes(history.lastAlertEarlyAt, DEFAULTS.delayThresholdMinutes)) return null;
  return {
    entryId: e.id,
    kind: "DELAY",
    dedupeKey: `DELAY:${e.id}:${history.delayCount + 1}`,
    expectedAt: eta.expectedAt,
    earlyAt: eta.earlyAt,
    leaveAt: leaveAt(eta, e.travelMinutes, bufferMinutes),
  };
}
