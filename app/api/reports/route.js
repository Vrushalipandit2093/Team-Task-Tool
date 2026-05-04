import { NextResponse } from "next/server";
import { getReports } from "../../../lib/server/data-store.js";
import { canViewReports } from "../../../lib/shared/access.js";
import { getActorSession } from "../../../lib/server/request-context.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!canViewReports(actor.accessRole)) {
    return NextResponse.json(
      { error: "Only admin can view reports." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const report = await getReports({
    date: searchParams.get("date"),
    status: searchParams.get("status"),
    priority: searchParams.get("priority"),
    search: searchParams.get("search"),
  });

  return NextResponse.json(report, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
