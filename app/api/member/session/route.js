import { NextResponse } from "next/server";
import {
  buildMemberLogoutCookie,
  buildMemberSessionCookie,
  createMemberSessionValue,
  findLoginMemberByEmail,
  getMemberSession,
} from "../../../../lib/server/member-auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getMemberSession();
  return NextResponse.json(session);
}

export async function POST(request) {
  const body = await request.json();
  const member = await findLoginMemberByEmail(body?.email);

  if (!member) {
    return NextResponse.json(
      {
        error:
          "Only developer or tester accounts can sign in here. Check the email and role.",
      },
      { status: 401 }
    );
  }

  const response = NextResponse.json({
    authenticated: true,
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    accessRole: member.accessRole,
  });

  const sessionCookie = buildMemberSessionCookie(
    createMemberSessionValue(member.email)
  );

  response.cookies.set(
    sessionCookie.cookieName,
    sessionCookie.cookieValue,
    sessionCookie.options
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  const logoutCookie = buildMemberLogoutCookie();
  response.cookies.set(
    logoutCookie.cookieName,
    logoutCookie.cookieValue,
    logoutCookie.options
  );
  return response;
}
