"use client";

import { DEFAULTS } from "@/domain/queue/types";

// How far the patient is from the clinic. Drives when the leave-now alert goes out.
export function TravelSelect({
  value,
  onChange,
  disabled,
  name,
}: {
  value: number | null;
  onChange?: (minutes: number | null) => void;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <select
      name={name}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : null)}
      className="rounded-md border border-zinc-300 px-3 py-2 text-base"
    >
      <option value="">Not sure / no alert</option>
      {DEFAULTS.travelOptions.map((m) => (
        <option key={m} value={m}>
          About {m} minutes away
        </option>
      ))}
    </select>
  );
}
