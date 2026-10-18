import { formatClinicTime } from "@/domain/time";
import type { PatientStatus } from "@/server/queue/views";

// The one thing the patient came to see: when is my turn, or what to do now.
export function TurnCard({ status }: { status: PatientStatus }) {
  const t = (iso: string) => formatClinicTime(new Date(iso), status.timezone);
  const box = (title: string, detail?: string) => (
    <div className="rounded-lg border border-zinc-200 p-5">
      <p className="text-2xl font-semibold">{title}</p>
      {detail && <p className="mt-2 text-zinc-600">{detail}</p>}
    </div>
  );

  if (status.session.closed && (status.status === "BOOKED" || status.status === "CHECKED_IN")) {
    return box("This session is closed", "Please contact the clinic to book again.");
  }
  switch (status.status) {
    case "IN_CONSULTATION":
      return box("It's your turn", "Please go in to see the doctor.");
    case "COMPLETED":
      return box("Your consultation is done", "Thank you for visiting.");
    case "CANCELLED":
      return box("This booking is cancelled");
    case "NO_SHOW":
      return box("You were marked absent", "If you are at the clinic, tell the reception and they will add you back.");
  }
  if (status.lateForSlot) {
    return box("Your slot time has passed", "Check in at the reception to join the current queue.");
  }
  if (status.slotHeldUntil) {
    return box("The doctor has reached your turn", `Check in at the reception by ${t(status.slotHeldUntil)} to keep your place.`);
  }

  const ahead =
    status.aheadCount === null ? null : status.aheadCount === 0 ? "You are next." : `${status.aheadCount} ${status.aheadCount === 1 ? "patient" : "patients"} ahead of you.`;
  return (
    <div className="rounded-lg border border-zinc-200 p-5">
      <p className="text-sm text-zinc-600">{status.status === "CHECKED_IN" ? "You are checked in" : "Your estimated turn"}</p>
      <p className="text-4xl font-semibold">{status.expectedAt ? `around ${t(status.expectedAt)}` : "to be confirmed"}</p>
      <p className="mt-2 text-zinc-600">
        {ahead} {status.nowServingTicket !== null && `Now seeing ticket #${status.nowServingTicket}.`}
      </p>
      <p className="mt-2 text-xs text-zinc-500">This is an estimate and changes as the queue moves.</p>
    </div>
  );
}
