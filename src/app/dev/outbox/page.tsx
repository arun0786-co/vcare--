import { notFound } from "next/navigation";
import { db } from "@/server/db/client";
import { listRecentNotifications } from "@/server/notify/recent";

export const dynamic = "force-dynamic";

// Shows what would have been sent by WhatsApp or SMS. Development only.
export default async function OutboxPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const rows = await listRecentNotifications(db);
  const time = (d: Date | null) => (d ? d.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) : "");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Outbox</h1>
      <p className="mt-1 text-zinc-600">Simulated messages, newest first. Run the worker to plan and deliver alerts.</p>
      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-600">
          <tr>
            <th className="py-2 pr-4">Created</th>
            <th className="py-2 pr-4">Kind</th>
            <th className="py-2 pr-4">To</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r) => (
            <tr key={r.id} className="align-top">
              <td className="py-2 pr-4 whitespace-nowrap">{time(r.createdAt)}</td>
              <td className="py-2 pr-4">{r.kind}</td>
              <td className="py-2 pr-4 whitespace-nowrap">{r.toPhone}</td>
              <td className="py-2 pr-4">
                {r.status}
                {r.sentAt && <span className="block text-zinc-500">{time(r.sentAt)}</span>}
              </td>
              <td className="py-2">{r.body}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="mt-4 text-zinc-600">Nothing yet.</p>}
    </main>
  );
}
