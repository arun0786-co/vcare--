import Link from "next/link";
import { notFound } from "next/navigation";
import { bookingDates } from "@/domain/booking/window";
import { isQueueError } from "@/domain/errors";
import { getPublicClinic, type PublicClinic } from "@/server/booking/public-clinic";
import { db } from "@/server/db/client";
import { BookingForm } from "./_components/booking-form";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: PageProps<"/c/[slug]/book/[doctorId]">) {
  const { slug, doctorId } = await params;
  let data: PublicClinic;
  try {
    data = await getPublicClinic(db, slug);
  } catch (err) {
    if (isQueueError(err, "NOT_FOUND")) notFound();
    throw err;
  }
  const doctor = data.doctors.find((d) => d.id === doctorId);
  if (!doctor) notFound();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={`/c/${slug}`} className="text-sm text-teal-800 underline">
        {data.clinic.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Book with {doctor.name}</h1>
      {doctor.specialty && <p className="text-zinc-600">{doctor.specialty}</p>}
      <div className="mt-6">
        <BookingForm doctorId={doctor.id} dates={bookingDates(new Date(), data.clinic.timezone)} timezone={data.clinic.timezone} />
      </div>
    </main>
  );
}
