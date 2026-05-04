import { NextResponse } from "next/server";
import { createMember, listMembers } from "../../../lib/server/data-store";
import { canManageUsers } from "../../../lib/shared/access";
import { getActorSession } from "../../../lib/server/request-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const members = await listMembers();
  return NextResponse.json(members, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request) {
  try {
    const actor = await getActorSession();

    if (!actor.authenticated) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    if (!canManageUsers(actor.accessRole)) {
      return NextResponse.json(
        { error: "Only admin can add members." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const member = await createMember(body);
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
