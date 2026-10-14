"use client";

import { formatClinicTime } from "@/domain/time";
import type { BookingOptions } from "@/server/booking/booking-options";

export interface PickedSlot {
  sessionId: string;
  at: string;
}

export function SlotGrid({
  options,
  timezone,
  value,
  onChange,
}: {
  options: BookingOptions;
  timezone: string;
  value: PickedSlot | null;
  onChange: (slot: PickedSlot) => void;
}) {
  const t = (iso: string) => formatClinicTime(new Date(iso), timezone);
  const open = options.sessions.filter((s) => s.freeSlots.length > 0);
  if (open.length === 0) return <p className="text-zinc-600">No free slots on this day.</p>;

  return (
    <div className="flex flex-col gap-4">
      {open.map((s) => (
        <div key={s.sessionId}>
          <p className="mb-2 text-sm text-zinc-600">
            {t(s.startsAt)} to {t(s.endsAt)}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {s.freeSlots.map((at) => {
              const picked = value?.sessionId === s.sessionId && value.at === at;
              return (
                <button
                  key={at}
                  type="button"
                  onClick={() => onChange({ sessionId: s.sessionId, at })}
                  className={`rounded-md border px-2 py-2 text-sm ${
                    picked ? "border-teal-700 bg-teal-700 text-white" : "border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {t(at)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
