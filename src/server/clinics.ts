import { eq } from "drizzle-orm";
import type { DbOrTx } from "./db/client";
import { clinics } from "./db/schema";

export async function loadClinic(db: DbOrTx, clinicId: string): Promise<{ name: string; slug: string; timezone: string } | null> {
  const [clinic] = await db
    .select({ name: clinics.name, slug: clinics.slug, timezone: clinics.timezone })
    .from(clinics)
    .where(eq(clinics.id, clinicId));
  return clinic ?? null;
}
