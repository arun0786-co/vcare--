"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { TravelSelect } from "@/app/_components/travel-select";
import { api, ApiError } from "@/app/_lib/api";
import type { BookingOptions } from "@/server/booking/booking-options";
import { DateChips } from "./date-chips";
import { SlotGrid, type PickedSlot } from "./slot-grid";

export function BookingForm({ doctorId, dates, timezone }: { doctorId: string; dates: string[]; timezone: string }) {
  const router = useRouter();
  const [date, setDate] = useState(dates[0]);
  const [options, setOptions] = useState<BookingOptions | null>(null);
  const [slot, setSlot] = useState<PickedSlot | null>(null);
  const [travel, setTravel] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reloads, setReloads] = useState(0);

  // Clears the old day's slots right away; the effect below fetches the new ones.
  const showDate = useCallback((d: string) => {
    setDate(d);
    setOptions(null);
    setSlot(null);
    setReloads((n) => n + 1);
  }, []);

  useEffect(() => {
    let stale = false;
    api<BookingOptions>(`/api/public/doctors/${doctorId}/slots?date=${date}`)
      .then((o) => !stale && setOptions(o))
      .catch((err) => !stale && setError(err instanceof ApiError ? err.message : "Could not load slots"));
    return () => {
      stale = true;
    };
  }, [doctorId, date, reloads]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slot) return setError("Pick a slot first");
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const { token } = await api<{ token: string }>("/api/public/bookings", {
        method: "POST",
        json: { sessionId: slot.sessionId, scheduledAt: slot.at, name: form.get("name"), phone: form.get("phone"), travelMinutes: travel },
      });
      router.push(`/q/${token}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
      if (err instanceof ApiError && err.code === "SLOT_TAKEN") showDate(date);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">1. Pick a day and time</h2>
        <DateChips dates={dates} value={date} onChange={showDate} />
        {options ? (
          <SlotGrid options={options} timezone={timezone} value={slot} onChange={setSlot} />
        ) : (
          <p className="text-zinc-600">Loading slots...</p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">2. Your details</h2>
        <input name="name" required maxLength={80} placeholder="Patient name" className="rounded-md border border-zinc-300 px-3 py-2 text-base" />
        <input name="phone" type="tel" required placeholder="Mobile number" className="rounded-md border border-zinc-300 px-3 py-2 text-base" />
        <label className="flex flex-col gap-1 text-sm">
          How far are you from the clinic? We use this to tell you when to leave.
          <TravelSelect value={travel} onChange={setTravel} />
        </label>
      </section>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <button disabled={busy || !slot} className="rounded-md bg-teal-700 px-4 py-3 font-medium text-white hover:bg-teal-800 disabled:opacity-50">
        {busy ? "Booking..." : "Book this slot"}
      </button>
    </form>
  );
}
