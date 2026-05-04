import { NextResponse } from "next/server";
import {
  buildAdminSessionCookie,
  createAdminSessionValue,
  isAdminConfigured,
  validateAdminCredentials,
} from "../../../../lib/server/admin-auth";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json();
  const { email, password } = body;

  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin login is not configured yet." },
      { status: 500 }
    );
  }

  if (!validateAdminCredentials(email, password)) {
    return NextResponse.json(
      { error: "Invalid admin email or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    email: email.trim().toLowerCase(),
  });

  const sessionCookie = buildAdminSessionCookie(createAdminSessionValue(email));
  response.cookies.set(
    sessionCookie.cookieName,
    sessionCookie.cookieValue,
    sessionCookie.options
  );

  return response;
}
