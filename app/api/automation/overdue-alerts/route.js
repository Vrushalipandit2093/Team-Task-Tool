import { NextResponse } from "next/server";
import { sendOverdueAlerts } from "../../../../lib/server/automation.js";
import { getActorSession } from "../../../../lib/server/request-context.js";

export const runtime = "nodejs";

export async function POST(request) {
  const actor = await getActorSession();

  if (!actor.authenticated || actor.accessRole !== "admin") {
    return NextResponse.json(
      { error: "Only admin can trigger overdue alerts." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const result = await sendOverdueAlerts(body.date);
  return NextResponse.json(result);
}
