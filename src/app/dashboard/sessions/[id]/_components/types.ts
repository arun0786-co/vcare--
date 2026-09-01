import type { StaffActionInput } from "@/domain/queue/commands";

// Sends one action; resolves true if it went through. Errors are shown by the board.
export type Act = (action: StaffActionInput) => Promise<boolean>;

export const buttonClass = "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50";
export const primaryClass = "rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50";
export const inputClass = "rounded-md border border-zinc-300 px-3 py-1.5 text-sm";
export const cardClass = "rounded-lg border border-zinc-200 p-4";
