import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/server/admin-auth";
import { sendTaskReminders } from "../../../lib/server/reminders";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const session = await getAdminSession();

    if (!session.authenticated) {
      return NextResponse.json(
        { error: "Admin login required to send reminders." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await sendTaskReminders(body.date, body.assigneeId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
