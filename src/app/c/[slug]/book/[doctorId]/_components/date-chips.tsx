"use client";

import { formatDayLabel } from "@/domain/time";

export function DateChips({ dates, value, onChange }: { dates: string[]; value: string; onChange: (date: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {dates.map((d, i) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
            d === value ? "border-teal-700 bg-teal-700 text-white" : "border-zinc-300 hover:bg-zinc-50"
          }`}
        >
          {i === 0 ? "Today" : i === 1 ? "Tomorrow" : formatDayLabel(d)}
        </button>
      ))}
    </div>
  );
}
