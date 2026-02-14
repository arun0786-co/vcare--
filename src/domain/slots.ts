import { addMinutes } from "./clock";

export interface SlotGrid {
  startsAt: Date;
  endsAt: Date;
  slotMinutes: number;
  taken: Date[];
  now: Date;
}

export function freeSlots(grid: SlotGrid): Date[] {
  const taken = new Set(grid.taken.map((d) => d.getTime()));
  const slots: Date[] = [];
  for (let slot = grid.startsAt; addMinutes(slot, grid.slotMinutes) <= grid.endsAt; slot = addMinutes(slot, grid.slotMinutes)) {
    if (slot >= grid.now && !taken.has(slot.getTime())) slots.push(slot);
  }
  return slots;
}

export function isFreeSlot(grid: SlotGrid, candidate: Date): boolean {
  return freeSlots(grid).some((slot) => slot.getTime() === candidate.getTime());
}
