import Link from "next/link";
import { redirect } from "next/navigation";
import { clinicDateString, formatClinicTime } from "@/domain/time";
import { getStaffFromCookies } from "@/server/auth/current-staff";
import { loadClinic } from "@/server/clinics";
import { db } from "@/server/db/client";
import { listSessionSummaries } from "@/server/queue/session-summaries";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const staff = await getStaffFromCookies();
  if (!staff) redirect("/login");
  const clinic = (await loadClinic(db, staff.clinicId))!;
  const requested = (await searchParams).date;
  const date = typeof requested === "string" && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : clinicDateString(new Date(), clinic.timezone);
  const sessions = await listSessionSummaries(db, staff.clinicId, date);
  const time = (iso: string) => formatClinicTime(new Date(iso), clinic.timezone);

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Sessions</h1>
        <form className="flex items-end gap-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Date
            <input type="date" name="date" defaultValue={date} className="rounded-md border border-zinc-300 px-3 py-2 font-normal" />
          </label>
          <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50">Show</button>
        </form>
      </div>

      {sessions.length === 0 ? (
        <p className="text-zinc-600">No sessions on this day.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/dashboard/sessions/${s.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50">
                <span>
                  <span className="font-medium">{s.doctorName}</span>
                  <span className="ml-3 text-zinc-600">
                    {time(s.startsAt)} to {time(s.endsAt)}
                  </span>
                </span>
                <span className="text-sm text-zinc-600">{s.closedAt ? "Closed" : `${s.waitingCount} waiting`}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
