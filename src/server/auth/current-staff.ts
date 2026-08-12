import { cookies } from "next/headers";
import { db } from "../db/client";
import { getStaffFromToken, SESSION_COOKIE, type StaffContext } from "./sessions";

// For server components and layouts: the logged-in staff member, if any.
export async function getStaffFromCookies(): Promise<StaffContext | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getStaffFromToken(db, token, new Date()) : null;
}
