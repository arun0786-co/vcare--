"use client";

import type { SessionBoard } from "@/server/queue/views";
import type { Act } from "./types";

// The one button reception presses all day. It sends who it saw inside, so a double
// press or a second receptionist cannot move two patients.
export function NextButton({ board, act, disabled }: { board: SessionBoard; act: Act; disabled: boolean }) {
  const next = board.waiting[0];
  const label = next
    ? `Next patient: #${next.ticketNo} ${next.name}`
    : board.current
      ? `Finish #${board.current.ticketNo} (nobody waiting)`
      : "Nobody waiting";

  return (
    <button
      disabled={disabled || (!next && !board.current)}
      onClick={() => act({ type: "NEXT", expectedCurrentId: board.current?.id ?? null })}
      className="w-full rounded-lg bg-teal-700 px-6 py-5 text-left text-xl font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
