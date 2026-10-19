"use client";

import { useNow } from "@/app/_lib/use-now";
import { formatClinicTime } from "@/domain/time";
import type { PatientStatus } from "@/server/queue/views";

export function SessionBanners({ status }: { status: PatientStatus }) {
  const now = useNow();
  const s = status.session;
  const t = (iso: string) => formatClinicTime(new Date(iso), status.timezone);
  const active = status.status === "BOOKED" || status.status === "CHECKED_IN";
  const banners: string[] = [];

  if (active && !s.closed) {
    if (!s.doctorArrived) banners.push(s.expectedStartAt ? `The doctor is running late and is expected at ${t(s.expectedStartAt)}.` : "The doctor has not arrived yet.");
    if (s.pausedUntil && new Date(s.pausedUntil) > now) banners.push(`The doctor is on a break until ${t(s.pausedUntil)}.`);
  }
  if (s.publicNote) banners.push(`Message from the clinic: ${s.publicNote}`);
  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {banners.map((b) => (
        <p key={b} className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {b}
        </p>
      ))}
    </div>
  );
}
