import { createHash, randomBytes } from "node:crypto";
import { addMinutes } from "@/domain/clock";
import type { Db } from "../db/client";
import { staffSessions } from "../db/schema";

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
