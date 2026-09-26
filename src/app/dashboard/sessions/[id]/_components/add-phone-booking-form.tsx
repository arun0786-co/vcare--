"use client";

import type { FormEvent } from "react";
import { formatClinicTime } from "@/domain/time";
import type { SessionBoard } from "@/server/queue/views";
import { cardClass, inputClass, primaryClass, type Act } from "./types";

export function AddPhoneBookingForm({ board, act, disabled }: { board: SessionBoard; act: Act; disabled: boolean }) {
  const slots = board.session.freeSlots;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const ok = await act({
      type: "ADD_PHONE_BOOKING",
      name: String(data.get("name")),
      phone: String(data.get("phone")),
      scheduledAt: String(data.get("slot")),
    });
    if (ok) form.reset();
  }

  return (
    <form onSubmit={onSubmit} className={`${cardClass} flex flex-col gap-3`}>
      <h2 className="font-semibold">Book for a caller</h2>
      {slots.length === 0 ? (
        <p className="text-sm text-zinc-600">No free slots left in this session.</p>
      ) : (
        <>
          <input name="name" required placeholder="Name" className={inputClass} />
          <input name="phone" type="tel" required placeholder="Mobile" className={inputClass} />
          <select name="slot" required className={inputClass}>
            {slots.map((s) => (
              <option key={s} value={s}>
                {formatClinicTime(new Date(s), board.session.timezone)}
              </option>
            ))}
          </select>
          <button disabled={disabled} className={primaryClass}>
            Book slot
          </button>
        </>
      )}
    </form>
  );
}
