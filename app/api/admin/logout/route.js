import { NextResponse } from "next/server";
import { buildAdminLogoutCookie } from "../../../../lib/server/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  const logoutCookie = buildAdminLogoutCookie();
  response.cookies.set(
    logoutCookie.cookieName,
    logoutCookie.cookieValue,
    logoutCookie.options
  );
  return response;
}
