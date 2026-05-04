import { NextResponse } from "next/server";
import { getStats } from "../../../lib/server/data-store";
import { getActorSession } from "../../../lib/server/request-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stats = await getStats(searchParams.get("date"), {
    status: searchParams.get("status"),
    priority: searchParams.get("priority"),
    search: searchParams.get("search"),
    assignedDeveloperId: searchParams.get("assignedDeveloperId"),
    assignedTesterId: searchParams.get("assignedTesterId"),
    currentAssigneeId: searchParams.get("currentAssigneeId"),
    memberId: searchParams.get("memberId"),
    accessRole: actor.accessRole,
    userId: actor.id,
  });
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
