"use client";

import type { FormEvent } from "react";
import { useNow } from "@/app/_lib/use-now";
import { clinicWallTime } from "@/domain/time";
import type { SessionBoard } from "@/server/queue/views";
import { buttonClass, inputClass, type Act } from "./types";

export function BreakControl({ board, act, disabled }: { board: SessionBoard; act: Act; disabled: boolean }) {
  const now = useNow();
  const s = board.session;
  const onBreak = s.pausedUntil !== null && new Date(s.pausedUntil) > now;

  if (onBreak) {
    return (
      <button disabled={disabled} onClick={() => act({ type: "END_BREAK" })} className={buttonClass}>
        End break now
      </button>
    );
  }

  async function onStart(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const until = clinicWallTime(s.date, String(data.get("until")), s.timezone).toISOString();
    const reason = String(data.get("reason") ?? "").trim();
    await act({ type: "START_BREAK", until, reason: reason || undefined });
  }

  return (
    <form onSubmit={onStart} className="flex flex-wrap items-center gap-2">
      <label className="text-sm">Break until</label>
      <input name="until" type="time" required className={inputClass} />
      <input name="reason" placeholder="Reason (optional)" className={`${inputClass} w-40`} />
      <button disabled={disabled} className={buttonClass}>
        Start break
      </button>
    </form>
  );
}
