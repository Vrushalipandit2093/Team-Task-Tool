import { NextResponse } from "next/server";
import { getAdminSession, isAdminConfigured } from "../../../../lib/server/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();

  return NextResponse.json({
    configured: isAdminConfigured(),
    authenticated: session.authenticated,
    email: session.email || "",
  });
}
