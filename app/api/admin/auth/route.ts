import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  createAdminSession,
  isAdminPassword,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const session = isAdminPassword(body?.password) ? createAdminSession() : null;

  if (!session) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
