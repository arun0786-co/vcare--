"use client";

import type { SessionBoard } from "@/server/queue/views";
import type { Act } from "./types";

export function CloseSessionButton({ board, act, disabled }: { board: SessionBoard; act: Act; disabled: boolean }) {
  const remaining = board.waiting.length + board.upcoming.length + board.late.length;
  return (
    <button
      disabled={disabled}
      onClick={() => {
        const warning = remaining > 0 ? ` ${remaining} patient(s) still waiting or booked will be cancelled.` : "";
        if (window.confirm(`Close this session?${warning}`)) void act({ type: "CLOSE_SESSION" });
      }}
      className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50"
    >
      Close session
    </button>
  );
}
