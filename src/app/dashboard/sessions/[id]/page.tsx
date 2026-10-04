import { notFound, redirect } from "next/navigation";
import { isQueueError } from "@/domain/errors";
import { getStaffFromCookies } from "@/server/auth/current-staff";
import { db } from "@/server/db/client";
import { getSessionBoard } from "@/server/queue/board";
import type { SessionBoard } from "@/server/queue/views";
import { Board } from "./_components/board";

export default async function SessionPage({ params }: PageProps<"/dashboard/sessions/[id]">) {
  const staff = await getStaffFromCookies();
  if (!staff) redirect("/login");
  const { id } = await params;
  let board: SessionBoard;
  try {
    board = await getSessionBoard(db, id, staff.clinicId, new Date());
  } catch (err) {
    if (isQueueError(err, "NOT_FOUND")) notFound();
    throw err;
  }
  return <Board initial={board} />;
}
