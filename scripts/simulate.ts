import { simulateSession } from "../src/sim/simulate";
import type { SimOptions, SimReport } from "../src/sim/types";

const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

const SCENARIOS: { name: string; opts: Partial<SimOptions> }[] = [
  { name: "Doctor on time", opts: {} },
  { name: "Doctor 45 min late, announced", opts: { doctorLateMinutes: 45, lateAnnounced: true } },
  { name: "Doctor 45 min late, not announced", opts: { doctorLateMinutes: 45 } },
  { name: "Busy: 10 walk-ins per hour", opts: { walkInsPerHour: 10 } },
  { name: "Busy and 30 min late, announced", opts: { walkInsPerHour: 10, doctorLateMinutes: 30, lateAnnounced: true } },
];

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const f = (x: number) => x.toFixed(1);

function summarize(reports: SimReport[]) {
  const errors = reports.flatMap((r) => (r.etaMaeMinutes === null ? [] : [r.etaMaeMinutes]));
  return {
    avgWait: mean(reports.map((r) => r.avgWaitMinutes)),
    maxWait: Math.max(...reports.map((r) => r.maxWaitMinutes)),
    lost: reports.reduce((s, r) => s + r.lostSlots, 0),
    booked: reports.reduce((s, r) => s + r.bookedPatients, 0),
    etaError: errors.length ? mean(errors) : null,
  };
}

console.log(`Booked patients' wait in the clinic (minutes), mean over ${SEEDS.length} seeded mornings.\n`);
console.log("| Scenario | Avg wait, alerts | Avg wait, baseline | Max wait, alerts | Max wait, baseline | Lost slots, alerts | Lost slots, baseline | Estimate error at alert |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
for (const s of SCENARIOS) {
  const runs = SEEDS.map((seed) => simulateSession({ ...s.opts, seed }));
  const a = summarize(runs.map((r) => r.alerts));
  const b = summarize(runs.map((r) => r.baseline));
  console.log(
    `| ${s.name} | ${f(a.avgWait)} | ${f(b.avgWait)} | ${a.maxWait} | ${b.maxWait} | ${a.lost} of ${a.booked} | ${b.lost} of ${b.booked} | ${a.etaError === null ? "n/a" : f(a.etaError)} |`,
  );
}
