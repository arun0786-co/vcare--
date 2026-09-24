"use client";

import type { FormEvent } from "react";
import { cardClass, inputClass, primaryClass, type Act } from "./types";

export function AddWalkInForm({ act, disabled }: { act: Act; disabled: boolean }) {
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const ok = await act({ type: "ADD_WALK_IN", name: String(data.get("name")), phone: String(data.get("phone") ?? "") });
    if (ok) form.reset();
  }

  return (
    <form onSubmit={onSubmit} className={`${cardClass} flex flex-col gap-3`}>
      <h2 className="font-semibold">Add walk-in</h2>
      <input name="name" required placeholder="Name" className={inputClass} />
      <input name="phone" type="tel" placeholder="Mobile (optional, for live updates)" className={inputClass} />
      <button disabled={disabled} className={primaryClass}>
        Add to queue
      </button>
    </form>
  );
}
