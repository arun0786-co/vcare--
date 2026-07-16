import { and, asc, eq } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import type { Db } from "../db/client";
import { clinics, doctors } from "../db/schema";

export interface PublicClinic {
  clinic: { name: string; slug: string };
  doctors: { id: string; name: string; specialty: string | null }[];
}

export async function getPublicClinic(db: Db, slug: string): Promise<PublicClinic> {
  const [clinic] = await db.select().from(clinics).where(eq(clinics.slug, slug));
  if (!clinic) throw new QueueError("NOT_FOUND", "Clinic not found");
  const list = await db
    .select({ id: doctors.id, name: doctors.name, specialty: doctors.specialty })
    .from(doctors)
    .where(and(eq(doctors.clinicId, clinic.id), eq(doctors.active, true)))
    .orderBy(asc(doctors.name));
  return { clinic: { name: clinic.name, slug: clinic.slug }, doctors: list };
}
