import { NextResponse } from "next/server";
import { login } from "@/server/auth/login";
import { sessionCookie } from "@/server/auth/session-cookie";
import { db } from "@/server/db/client";
import { handle } from "@/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (request: Request) => {
  const { token, staff } = await login(db, await request.json(), new Date());
  const res = NextResponse.json({ staff: { name: staff.name, role: staff.role } });
  res.cookies.set(sessionCookie(token));
  return res;
});
