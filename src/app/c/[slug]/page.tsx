import Link from "next/link";
import { notFound } from "next/navigation";
import { isQueueError } from "@/domain/errors";
import { getPublicClinic, type PublicClinic } from "@/server/booking/public-clinic";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

export default async function ClinicPage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  let data: PublicClinic;
  try {
    data = await getPublicClinic(db, slug);
  } catch (err) {
    if (isQueueError(err, "NOT_FOUND")) notFound();
    throw err;
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{data.clinic.name}</h1>
      <p className="mt-1 text-zinc-600">Pick a doctor to book a slot. You will get a live link that shows when to leave home.</p>
      <ul className="mt-6 flex flex-col gap-3">
        {data.doctors.map((d) => (
          <li key={d.id}>
            <Link
              href={`/c/${data.clinic.slug}/book/${d.id}`}
              className="block rounded-lg border border-zinc-200 px-4 py-3 hover:border-teal-700 hover:bg-zinc-50"
            >
              <span className="font-medium">{d.name}</span>
              {d.specialty && <span className="block text-sm text-zinc-600">{d.specialty}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
