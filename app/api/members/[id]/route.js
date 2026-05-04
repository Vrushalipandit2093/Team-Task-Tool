import { NextResponse } from "next/server";
import { deleteMember, updateMember } from "../../../../lib/server/data-store";
import { canManageUsers } from "../../../../lib/shared/access";
import { getActorSession } from "../../../../lib/server/request-context";

export const runtime = "nodejs";

async function getMemberId(params) {
  const resolvedParams = await params;
  return resolvedParams.id;
}

export async function PUT(request, { params }) {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!canManageUsers(actor.accessRole)) {
    return NextResponse.json(
      { error: "Only admin can update members." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const memberId = await getMemberId(params);
  const member = await updateMember(memberId, body);

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function DELETE(_request, { params }) {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!canManageUsers(actor.accessRole)) {
    return NextResponse.json(
      { error: "Only admin can delete members." },
      { status: 403 }
    );
  }

  const memberId = await getMemberId(params);
  await deleteMember(memberId);
  return NextResponse.json({ ok: true });
}
