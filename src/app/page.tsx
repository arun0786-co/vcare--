import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-3xl font-semibold">VCare</h1>
      <p className="text-zinc-600">
        See the live queue at your clinic and leave home just in time, instead of waiting for hours in the waiting room.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/c/demo" className="rounded-md bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800">
          Book at Demo Clinic
        </Link>
        <Link href="/login" className="rounded-md border border-zinc-300 px-4 py-2 font-medium hover:bg-zinc-50">
          Clinic staff login
        </Link>
      </div>
    </main>
  );
}
