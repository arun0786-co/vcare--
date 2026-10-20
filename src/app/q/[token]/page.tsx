import { notFound } from "next/navigation";
import { isQueueError } from "@/domain/errors";
import { db } from "@/server/db/client";
import { getPatientStatus } from "@/server/queue/patient-status";
import type { PatientStatus } from "@/server/queue/views";
import { StatusView } from "./_components/status-view";

export const dynamic = "force-dynamic";

export default async function PatientStatusPage({ params }: PageProps<"/q/[token]">) {
  const { token } = await params;
  let status: PatientStatus;
  try {
    status = await getPatientStatus(db, token, new Date());
  } catch (err) {
    if (isQueueError(err, "NOT_FOUND")) notFound();
    throw err;
  }
  return <StatusView token={token} initial={status} />;
}
