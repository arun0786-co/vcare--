"use client";

import { useState } from "react";
import { api, ApiError } from "@/app/_lib/api";
import type { PatientStatus } from "@/server/queue/views";

export function CancelBooking({ token, status, onChange }: { token: string; status: PatientStatus; onChange: (s: PatientStatus) => void }) {
  const [error, setError] = useState<string | null>(null);
  if ((status.status !== "BOOKED" && status.status !== "CHECKED_IN") || status.session.closed) return null;

  async function cancel() {
    if (!window.confirm("Cancel your booking? Your place will be given to someone else.")) return;
    try {
      onChange(await api<PatientStatus>(`/api/public/entries/${token}/cancel`, { method: "POST" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not cancel");
    }
  }

  return (
    <div>
      <button onClick={cancel} className="text-sm text-red-800 underline">
        Cancel my booking
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
