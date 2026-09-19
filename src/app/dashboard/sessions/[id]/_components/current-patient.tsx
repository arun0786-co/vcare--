"use client";

import { useNow } from "@/app/_lib/use-now";
import type { BoardEntry } from "@/server/queue/views";
import { buttonClass, cardClass, type Act } from "./types";

export function CurrentPatient({ entry, act, disabled }: { entry: BoardEntry | null; act: Act; disabled: boolean }) {
  const now = useNow();
  if (!entry) return <div className={`${cardClass} text-zinc-600`}>Nobody in consultation.</div>;
  const minutes = entry.startedAt ? Math.max(0, Math.floor((now.getTime() - new Date(entry.startedAt).getTime()) / 60_000)) : 0;

  return (
    <div className={`${cardClass} flex items-center justify-between gap-4`}>
      <div>
        <p className="text-sm text-zinc-600">In consultation</p>
        <p className="text-lg font-semibold">
          #{entry.ticketNo} {entry.name}
        </p>
        <p className="text-sm text-zinc-600">{minutes} min so far</p>
      </div>
      <button
        disabled={disabled}
        onClick={() => act({ type: "COMPLETE_CURRENT", expectedCurrentId: entry.id })}
        className={buttonClass}
      >
        Finish
      </button>
    </div>
  );
}
