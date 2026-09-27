"use client";

import type { FormEvent } from "react";
import { clinicWallTime } from "@/domain/time";
import type { SessionBoard } from "@/server/queue/views";
import { buttonClass, inputClass, type Act } from "./types";

// Before the doctor arrives: announce a late start (moves every estimate) or mark arrival.
export function DoctorArrival({ board, act, disabled }: { board: SessionBoard; act: Act; disabled: boolean }) {
  const s = board.session;
  if (s.doctorArrivedAt) return null;

  async function onLate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hhmm = String(new FormData(e.currentTarget).get("time"));
    await act({ type: "DOCTOR_LATE", expectedStartAt: clinicWallTime(s.date, hhmm, s.timezone).toISOString() });
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={onLate} className="flex items-center gap-2">
        <label className="text-sm">Running late, expected at</label>
        <input name="time" type="time" required className={inputClass} />
        <button disabled={disabled} className={buttonClass}>
          Set
        </button>
      </form>
      <button disabled={disabled} onClick={() => act({ type: "DOCTOR_ARRIVED" })} className={buttonClass}>
        Doctor has arrived
      </button>
    </div>
  );
}
