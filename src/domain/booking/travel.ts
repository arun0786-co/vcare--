import { QueueError } from "../errors";
import { DEFAULTS } from "../queue/types";

export function validTravelMinutes(minutes: number | null | undefined): number | null {
  if (minutes === null || minutes === undefined) return null;
  if (!(DEFAULTS.travelOptions as readonly number[]).includes(minutes)) {
    throw new QueueError("VALIDATION", "Pick a travel time from the list");
  }
  return minutes;
}
