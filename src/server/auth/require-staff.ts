import { QueueError } from "@/domain/errors";
import { db } from "../db/client";
import { readCookie } from "./cookies";
import { getStaffFromToken, SESSION_COOKIE, type StaffContext } from "./sessions";

// For route handlers: who is calling, or 401.
export async function requireStaff(request: Request): Promise<StaffContext> {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  const staff = token ? await getStaffFromToken(db, token, new Date()) : null;
  if (!staff) throw new QueueError("UNAUTHORIZED", "Please log in");
  return staff;
}
