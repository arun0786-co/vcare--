"use client";

import { useState } from "react";
import { TravelSelect } from "@/app/_components/travel-select";
import { api, ApiError } from "@/app/_lib/api";
import type { PatientStatus } from "@/server/queue/views";

export function TravelPicker({ token, status, onChange }: { token: string; status: PatientStatus; onChange: (s: PatientStatus) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (status.status !== "BOOKED" || status.session.closed) return null;

  async function update(travelMinutes: number | null) {
    setBusy(true);
    setError(null);
    try {
      onChange(await api<PatientStatus>(`/api/public/entries/${token}`, { method: "PATCH", json: { travelMinutes } }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      How far are you from the clinic? We will message you when it is time to leave.
      <TravelSelect value={status.travelMinutes} onChange={update} disabled={busy} />
      {error && <span className="text-red-700">{error}</span>}
    </label>
  );
}
