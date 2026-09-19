"use client";

import { useState } from "react";
import type { StaffActionInput } from "@/domain/queue/commands";
import { formatClinicTime } from "@/domain/time";
import type { BoardEntry } from "@/server/queue/views";
import { buttonClass, cardClass, type Act } from "./types";

export interface RowAction {
  label: string;
  show?: (e: BoardEntry) => boolean;
  // Returns null when the person backed out (e.g. cancelled a prompt).
  build: (e: BoardEntry) => StaffActionInput | null;
}

const CHANNEL: Record<BoardEntry["channel"], string> = { ONLINE: "Online", PHONE: "Phone", WALK_IN: "Walk-in" };
const STATUS: Partial<Record<BoardEntry["status"], string>> = { COMPLETED: "Seen", NO_SHOW: "No-show", CANCELLED: "Cancelled" };

function CopyLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/q/${token}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs text-teal-800 underline"
    >
      {copied ? "Copied" : "Copy patient link"}
    </button>
  );
}

export function EntryList({
  title,
  entries,
  timezone,
  actions,
  act,
  disabled,
  empty,
}: {
  title: string;
  entries: BoardEntry[];
  timezone: string;
  actions: RowAction[];
  act: Act;
  disabled: boolean;
  empty?: string;
}) {
  const t = (iso: string) => formatClinicTime(new Date(iso), timezone);
  if (entries.length === 0 && !empty) return null;

  return (
    <section className={cardClass}>
      <h2 className="mb-3 font-semibold">
        {title} <span className="font-normal text-zinc-500">({entries.length})</span>
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-zinc-600">{empty}</p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="font-medium">
                  #{e.ticketNo} {e.name}
                  {e.prioritized && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">Priority</span>}
                </p>
                <p className="text-sm text-zinc-600">
                  {CHANNEL[e.channel]}
                  {e.scheduledAt && `, slot ${t(e.scheduledAt)}`}
                  {e.expectedAt && `, expected ${t(e.expectedAt)}`}
                  {STATUS[e.status] && `, ${STATUS[e.status]}`}
                  {e.phone && `, ${e.phone}`}
                </p>
                <CopyLink token={e.publicToken} />
              </div>
              <div className="flex flex-wrap gap-2">
                {actions
                  .filter((a) => !a.show || a.show(e))
                  .map((a) => (
                    <button
                      key={a.label}
                      disabled={disabled}
                      onClick={() => {
                        const action = a.build(e);
                        if (action) void act(action);
                      }}
                      className={buttonClass}
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
