import { getPublicClinic } from "@/server/booking/public-clinic";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  return Response.json(await getPublicClinic(db, slug));
});
