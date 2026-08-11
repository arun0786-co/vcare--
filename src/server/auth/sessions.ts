import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { addMinutes } from "@/domain/clock";
import type { Db } from "../db/client";
import { staffSessions, staffUsers } from "../db/schema";

export const SESSION_COOKIE = "vcare_session";
export const SESSION_DAYS = 14;

export interface StaffContext {
  staffId: string;
  clinicId: string;
  name: string;
  role: "ADMIN" | "RECEPTIONIST" | "DOCTOR";
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createStaffSession(db: Db, staffId: string, now: Date): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(staffSessions).values({
    id: hashToken(token),
    staffUserId: staffId,
    expiresAt: addMinutes(now, SESSION_DAYS * 24 * 60),
    createdAt: now,
  });
  return token;
}

export async function getStaffFromToken(db: Db, token: string, now: Date): Promise<StaffContext | null> {
  const [row] = await db
    .select({ staffId: staffUsers.id, clinicId: staffUsers.clinicId, name: staffUsers.name, role: staffUsers.role })
    .from(staffSessions)
    .innerJoin(staffUsers, eq(staffUsers.id, staffSessions.staffUserId))
    .where(and(eq(staffSessions.id, hashToken(token)), gt(staffSessions.expiresAt, now)));
  return row ?? null;
}
