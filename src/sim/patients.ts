import { addMinutes } from "@/domain/clock";
import { DEFAULTS } from "@/domain/queue/types";
import { lognormal, mulberry32, randomInt } from "./random";
import { SIM_SESSION, type SimOptions, type SimPatients } from "./types";

const DURATION_SIGMA = 0.4;

// Separate streams per kind of randomness, so both simulated worlds see the same people.
export function generatePatients(opts: SimOptions): SimPatients {
  const arrivals = mulberry32(opts.seed * 1000 + 1);
  const durations = mulberry32(opts.seed * 1000 + 2);
  const travel = mulberry32(opts.seed * 1000 + 3);
  const duration = () => Math.min(40, Math.max(2, Math.round(lognormal(durations, opts.medianConsult, DURATION_SIGMA))));

  const booked = Array.from({ length: opts.bookedSlots }, (_, i) => {
    const chosen = DEFAULTS.travelOptions[randomInt(travel, 0, DEFAULTS.travelOptions.length - 1)];
    return {
      id: `b${i + 1}`,
      slot: addMinutes(SIM_SESSION.startsAt, i * 2 * SIM_SESSION.slotMinutes),
      travel: chosen,
      actualTravel: Math.max(1, chosen + randomInt(travel, -3, 5)),
      duration: duration(),
    };
  });

  const walkIns = [];
  for (let t = addMinutes(SIM_SESSION.startsAt, -15); t < addMinutes(SIM_SESSION.endsAt, -30); t = addMinutes(t, 1)) {
    if (arrivals() < opts.walkInsPerHour / 60) walkIns.push({ id: `w${walkIns.length + 1}`, arrival: t, duration: duration() });
  }
  return { walkIns, booked };
}
