import { eq } from "drizzle-orm";
import { z } from "zod";
import { QueueError } from "@/domain/errors";
import { parseOrThrow } from "@/domain/parse";
import type { Db } from "../db/client";
import { staffUsers } from "../db/schema";
import { hashPassword, verifyPassword } from "./password";
import { createStaffSession, type StaffContext } from "./sessions";

const loginRequest = z.object({
  email: z.string({ error: "Enter your email" }).trim().toLowerCase().min(1, { error: "Enter your email" }),
  password: z.string({ error: "Enter your password" }).min(1, { error: "Enter your password" }),
});

// Checked against when the email is unknown, so both failures take about as long.
let dummyHash: Promise<string> | null = null;

export async function login(db: Db, input: unknown, now: Date): Promise<{ token: string; staff: StaffContext }> {
  const { email, password } = parseOrThrow(loginRequest, input);
  const [user] = await db.select().from(staffUsers).where(eq(staffUsers.email, email));
  const ok = await verifyPassword(password, user?.passwordHash ?? (await (dummyHash ??= hashPassword("not a password"))));
  if (!user || !ok) throw new QueueError("UNAUTHORIZED", "Wrong email or password");
  const token = await createStaffSession(db, user.id, now);
  return { token, staff: { staffId: user.id, clinicId: user.clinicId, name: user.name, role: user.role } };
}
