import { NextResponse } from "next/server";
import { readCookie } from "@/server/auth/cookies";
import { destroyStaffSession, SESSION_COOKIE } from "@/server/auth/sessions";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (token) await destroyStaffSession(db, token);
  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
});
