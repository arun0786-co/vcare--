import { generatePatients } from "./patients";
import { DEFAULT_SIM, type SimOptions, type SimReport } from "./types";
import { runWorld } from "./world";

// The same morning twice: once with leave-now alerts, once with people coming at their slot time.
export function simulateSession(overrides: Partial<SimOptions> = {}): { alerts: SimReport; baseline: SimReport } {
  const opts = { ...DEFAULT_SIM, ...overrides };
  const patients = generatePatients(opts);
  return { alerts: runWorld(patients, opts, "alerts"), baseline: runWorld(patients, opts, "baseline") };
}
