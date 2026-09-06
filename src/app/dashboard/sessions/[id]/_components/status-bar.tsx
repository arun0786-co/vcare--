"use client";

import { useNow } from "@/app/_lib/use-now";
import { formatClinicTime, stalenessLabel } from "@/domain/time";
import type { SessionBoard } from "@/server/queue/views";

function doctorState(s: SessionBoard["session"], now: Date): string {
  const t = (iso: string) => formatClinicTime(new Date(iso), s.timezone);
  if (s.closedAt) return "Session closed";
  if (s.pausedUntil && new Date(s.pausedUntil) > now) return `On break until ${t(s.pausedUntil)}${s.pauseReason ? ` (${s.pauseReason})` : ""}`;
  if (s.doctorArrivedAt) return `Doctor in since ${t(s.doctorArrivedAt)}`;
  if (s.expectedStartAt) return `Doctor expected at ${t(s.expectedStartAt)}`;
  return "Doctor not here yet";
}

export function StatusBar({
  board,
  connected,
  message,
  onDismiss,
}: {
  board: SessionBoard;
  connected: boolean;
  message: string | null;
  onDismiss: () => void;
}) {
  const now = useNow();
  const s = board.session;
  const t = (iso: string) => formatClinicTime(new Date(iso), s.timezone);
  const staleness = stalenessLabel(new Date(board.generatedAt), now);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          {s.doctorName}
          <span className="ml-3 text-base font-normal text-zinc-600">
            {s.date}, {t(s.startsAt)} to {t(s.endsAt)}
          </span>
        </h1>
        <span className={`text-sm ${staleness.stale ? "text-amber-700" : "text-zinc-500"}`}>{staleness.text}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-zinc-100 px-3 py-1">{doctorState(s, now)}</span>
        {s.publicNote && <span className="rounded-full bg-zinc-100 px-3 py-1">Note: {s.publicNote}</span>}
        <span className="rounded-full bg-zinc-100 px-3 py-1">Typical consultation {Math.round(board.stats.median)} min</span>
      </div>
      {!connected && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          Offline. Buttons are paused until the connection is back.
        </p>
      )}
      {message && (
        <p className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
          <button onClick={onDismiss} className="ml-4 text-amber-900 underline">
            Dismiss
          </button>
        </p>
      )}
    </div>
  );
}
