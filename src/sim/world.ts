import { addMinutes, minutesBetween } from "@/domain/clock";
import { durationStats } from "@/domain/estimate/durations";
import { projectEtas } from "@/domain/estimate/eta";
import { planAlerts, type AlertHistory } from "@/domain/notify/plan";
import { planNext } from "@/domain/queue/next";
import { orderKey } from "@/domain/queue/order";
import type { QueueEntryView, SessionTiming } from "@/domain/queue/types";
import { SIM_SESSION, type SimBookedResult, type SimOptions, type SimPatients, type SimReport } from "./types";

export type World = "alerts" | "baseline";

const SIM_START = addMinutes(SIM_SESSION.startsAt, -60);
const SIM_END = addMinutes(SIM_SESSION.endsAt, 180);
const ANNOUNCE_AT = addMinutes(SIM_SESSION.startsAt, -30);
// Without alerts, people aim to be there a few minutes before their slot.
const BASELINE_EARLY_MINUTES = 5;

const same = (a: Date, b: Date) => a.getTime() === b.getTime();
const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);

// Plays one morning minute by minute with the app's own queue, estimate and alert rules.
// "baseline": booked patients come at their slot time. "alerts": they leave when told to.
export function runWorld(patients: SimPatients, opts: SimOptions, world: World): SimReport {
  const entries = new Map<string, QueueEntryView>();
  const durationOf = new Map<string, number>();
  const travelOf = new Map<string, number>();
  const arrivalOf = new Map<string, Date>();
  const alertExpected = new Map<string, Date>();
  const history = new Map<string, AlertHistory>();
  const completed: number[] = [];
  const timing: SessionTiming = {
    startsAt: SIM_SESSION.startsAt,
    endsAt: SIM_SESSION.endsAt,
    expectedStartAt: null,
    doctorArrivedAt: null,
    pausedUntil: null,
    closedAt: null,
  };
  const doctorArrives = addMinutes(SIM_SESSION.startsAt, opts.doctorLateMinutes);
  let ticket = 0;
  let current: { id: string; endsAt: Date } | null = null;

  const add = (e: Pick<QueueEntryView, "id" | "channel" | "status"> & Partial<QueueEntryView>) =>
    entries.set(e.id, {
      ticketNo: ++ticket,
      scheduledAt: null,
      checkedInAt: null,
      startedAt: null,
      passedAt: null,
      priorityAt: null,
      travelMinutes: null,
      hasPhone: true,
      ...e,
    });

  for (const b of patients.booked) {
    add({ id: b.id, channel: "ONLINE", status: "BOOKED", scheduledAt: b.slot, travelMinutes: b.travel });
    durationOf.set(b.id, b.duration);
    travelOf.set(b.id, b.actualTravel);
    if (world === "baseline") arrivalOf.set(b.id, addMinutes(b.slot, -BASELINE_EARLY_MINUTES));
  }
  for (const w of patients.walkIns) durationOf.set(w.id, w.duration);

  for (let now = SIM_START; now <= SIM_END; now = addMinutes(now, 1)) {
    if (opts.lateAnnounced && opts.doctorLateMinutes > 0 && now >= ANNOUNCE_AT && !timing.doctorArrivedAt) {
      timing.expectedStartAt = doctorArrives;
    }

    for (const w of patients.walkIns) {
      if (same(w.arrival, now)) add({ id: w.id, channel: "WALK_IN", status: "CHECKED_IN", checkedInAt: now });
    }
    for (const [id, arrival] of arrivalOf) {
      const e = entries.get(id)!;
      if (same(arrival, now) && e.status === "BOOKED") Object.assign(e, { status: "CHECKED_IN", checkedInAt: now });
    }

    if (now >= doctorArrives) {
      timing.doctorArrivedAt ??= now;
      if (current && now >= current.endsAt) {
        entries.get(current.id)!.status = "COMPLETED";
        completed.push(durationOf.get(current.id)!);
        current = null;
      }
      if (!current) {
        const plan = planNext([...entries.values()], opts.graceMinutes);
        for (const id of plan.passedIds) entries.get(id)!.passedAt = now;
        if (plan.startId) {
          Object.assign(entries.get(plan.startId)!, { status: "IN_CONSULTATION", startedAt: now });
          current = { id: plan.startId, endsAt: addMinutes(now, durationOf.get(plan.startId)!) };
        }
      }
    }

    if (world === "alerts") {
      const list = [...entries.values()];
      const stats = durationStats(completed, opts.medianConsult);
      const etas = projectEtas({ entries: list, session: timing, stats, now, graceMinutes: opts.graceMinutes });
      for (const plan of planAlerts({ entries: list, etas, history, now, bufferMinutes: opts.bufferMinutes })) {
        if (plan.kind !== "LEAVE_NOW") continue;
        history.set(plan.entryId, { leaveNowEarlyAt: plan.earlyAt, lastAlertEarlyAt: plan.earlyAt, delayCount: 0 });
        alertExpected.set(plan.entryId, plan.expectedAt);
        arrivalOf.set(plan.entryId, addMinutes(now, travelOf.get(plan.entryId)!));
      }
    }
  }

  const details: SimBookedResult[] = patients.booked.map((b) => {
    const e = entries.get(b.id)!;
    const arrival = e.checkedInAt;
    const start = e.startedAt;
    return {
      id: b.id,
      slot: b.slot,
      arrival,
      start,
      waitMinutes: arrival && start ? minutesBetween(arrival, start) : null,
      lostSlot: !arrival || orderKey(e, opts.graceMinutes).getTime() !== b.slot.getTime(),
      alertExpectedAt: alertExpected.get(b.id) ?? null,
    };
  });
  const waits = details.flatMap((d) => (d.waitMinutes === null ? [] : [d.waitMinutes]));
  const errors = details.flatMap((d) => (d.alertExpectedAt && d.start ? [Math.abs(minutesBetween(d.alertExpectedAt, d.start))] : []));

  return {
    bookedPatients: details.length,
    avgWaitMinutes: mean(waits),
    maxWaitMinutes: waits.length ? Math.max(...waits) : 0,
    lostSlots: details.filter((d) => d.lostSlot).length,
    etaMaeMinutes: errors.length ? mean(errors) : null,
    details,
  };
}
