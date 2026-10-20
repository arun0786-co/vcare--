"use client";

import { useLiveResource } from "@/app/_lib/use-live-resource";
import { useNow } from "@/app/_lib/use-now";
import { formatClinicTime, stalenessLabel } from "@/domain/time";
import type { PatientStatus } from "@/server/queue/views";
import { CancelBooking } from "./cancel-booking";
import { SessionBanners } from "./session-banners";
import { TravelPicker } from "./travel-picker";
import { TurnCard } from "./turn-card";

export function StatusView({ token, initial }: { token: string; initial: PatientStatus }) {
  const { data, setData, connected } = useLiveResource<PatientStatus>(
    `/api/public/entries/${token}`,
    `/api/public/entries/${token}/stream`,
    initial,
  );
  const now = useNow();
  const staleness = stalenessLabel(new Date(data.generatedAt), now);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <header>
        <p className="text-sm text-zinc-600">
          {data.clinicName}, {data.doctorName}
        </p>
        <h1 className="text-xl font-semibold">
          Ticket #{data.ticketNo} <span className="font-normal text-zinc-600">for {data.name}</span>
        </h1>
        {data.scheduledAt && (
          <p className="text-sm text-zinc-600">Booked slot {formatClinicTime(new Date(data.scheduledAt), data.timezone)}</p>
        )}
      </header>

      <TurnCard status={data} />
      <SessionBanners status={data} />
      <TravelPicker token={token} status={data} onChange={setData} />

      <p className={`text-xs ${staleness.stale || !connected ? "text-amber-700" : "text-zinc-500"}`}>
        {staleness.text}
        {(staleness.stale || !connected) && ". The connection seems slow, so this may be out of date."}
      </p>
      <CancelBooking token={token} status={data} onChange={setData} />
    </main>
  );
}
