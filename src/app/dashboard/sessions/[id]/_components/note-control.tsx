"use client";

import type { FormEvent } from "react";
import type { SessionBoard } from "@/server/queue/views";
import { buttonClass, inputClass, type Act } from "./types";

// A line every patient of this session sees on their status page.
export function NoteControl({ board, act, disabled }: { board: SessionBoard; act: Act; disabled: boolean }) {
  const note = board.session.publicNote;

  async function onSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await act({ type: "SET_NOTE", note: String(new FormData(e.currentTarget).get("note")) });
  }

  return (
    <form onSubmit={onSave} key={note ?? ""} className="flex flex-col gap-2">
      <label className="text-sm">Note for patients</label>
      <input name="note" defaultValue={note ?? ""} maxLength={200} placeholder="e.g. Doctor called to an emergency" className={inputClass} />
      <div className="flex gap-2">
        <button disabled={disabled} className={buttonClass}>
          Save note
        </button>
        {note && (
          <button type="button" disabled={disabled} onClick={() => act({ type: "SET_NOTE", note: null })} className={buttonClass}>
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
