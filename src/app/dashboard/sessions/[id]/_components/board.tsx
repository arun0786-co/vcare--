"use client";

import { useCallback, useState } from "react";
import { api, ApiError } from "@/app/_lib/api";
import { useLiveResource } from "@/app/_lib/use-live-resource";
import type { SessionBoard } from "@/server/queue/views";
import { AddPhoneBookingForm } from "./add-phone-booking-form";
import { AddWalkInForm } from "./add-walk-in-form";
import { BreakControl } from "./break-control";
import { CloseSessionButton } from "./close-session-button";
import { CurrentPatient } from "./current-patient";
import { DoctorArrival } from "./doctor-arrival";
import { EntryList, type RowAction } from "./entry-list";
import { NextButton } from "./next-button";
import { NoteControl } from "./note-control";
import { StatusBar } from "./status-bar";
import { cardClass, type Act } from "./types";

const noShow: RowAction = { label: "No-show", build: (e) => ({ type: "MARK_NO_SHOW", entryId: e.id }) };
const cancel: RowAction = {
  label: "Cancel",
  build: (e) => (window.confirm(`Cancel #${e.ticketNo} ${e.name}?`) ? { type: "CANCEL", entryId: e.id } : null),
};
const checkIn: RowAction = { label: "Check in", build: (e) => ({ type: "CHECK_IN", entryId: e.id }) };
const prioritize: RowAction = {
  label: "See first",
  show: (e) => !e.prioritized,
  build: (e) => {
    const reason = window.prompt(`Why should #${e.ticketNo} ${e.name} be seen first?`);
    return reason ? { type: "PRIORITIZE", entryId: e.id, reason } : null;
  },
};
const recheckIn: RowAction = {
  label: "Back, check in",
  show: (e) => e.status === "NO_SHOW",
  build: (e) => ({ type: "RECHECK_IN", entryId: e.id }),
};

export function Board({ initial }: { initial: SessionBoard }) {
  const id = initial.session.id;
  const { data, setData, connected, refresh } = useLiveResource<SessionBoard>(
    `/api/staff/sessions/${id}`,
    `/api/staff/sessions/${id}/stream`,
    initial,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const act: Act = useCallback(
    async (action) => {
      setBusy(true);
      setMessage(null);
      try {
        const res = await api<{ board: SessionBoard }>(`/api/staff/sessions/${id}/actions`, { method: "POST", json: action });
        setData(res.board);
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.code === "CONFLICT") {
          await refresh();
          setMessage("The queue changed. Refreshed.");
        } else {
          setMessage(err instanceof ApiError ? err.message : "Something went wrong");
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [id, refresh, setData],
  );

  const closed = data.session.closedAt !== null;
  const disabled = busy || !connected || closed;
  const tz = data.session.timezone;
  const list = { timezone: tz, act, disabled };

  return (
    <div className="flex flex-col gap-6">
      <StatusBar board={data} connected={connected} message={message} onDismiss={() => setMessage(null)} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {!closed && <NextButton board={data} act={act} disabled={disabled} />}
          <CurrentPatient entry={data.current} act={act} disabled={disabled} />
          <EntryList title="Waiting" entries={data.waiting} actions={[prioritize, noShow, cancel]} empty="Nobody waiting." {...list} />
          <EntryList title="Booked, not here yet" entries={data.upcoming} actions={[checkIn, noShow, cancel]} {...list} />
          <EntryList title="Missed their slot" entries={data.late} actions={[checkIn, noShow, cancel]} {...list} />
          <EntryList title="Done" entries={data.finished} actions={[recheckIn]} {...list} />
        </div>
        {!closed && (
          <aside className="flex flex-col gap-6">
            <AddWalkInForm act={act} disabled={disabled} />
            <AddPhoneBookingForm board={data} act={act} disabled={disabled} />
            <section className={`${cardClass} flex flex-col gap-4`}>
              <h2 className="font-semibold">Doctor</h2>
              <DoctorArrival board={data} act={act} disabled={disabled} />
              <BreakControl board={data} act={act} disabled={disabled} />
              <NoteControl board={data} act={act} disabled={disabled} />
              <CloseSessionButton board={data} act={act} disabled={disabled} />
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
