import { NextResponse } from "next/server";
import {
  createTask,
  listTasks,
} from "../../../lib/server/data-store.js";
import {
  canCreateTasks,
} from "../../../lib/shared/access.js";
import { getActorSession } from "../../../lib/server/request-context.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTaskFilters(searchParams, actor) {
  return {
    date: searchParams.get("date"),
    status: searchParams.get("status"),
    priority: searchParams.get("priority"),
    search: searchParams.get("search"),
    assignedDeveloperId: searchParams.get("assignedDeveloperId"),
    assignedTesterId: searchParams.get("assignedTesterId"),
    currentAssigneeId: searchParams.get("currentAssigneeId"),
    memberId: searchParams.get("memberId"),
    accessRole: actor.accessRole,
    userId: actor.id,
  };
}

export async function GET(request) {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tasks = await listTasks(getTaskFilters(searchParams, actor));

  return NextResponse.json(tasks, {
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

    if (!canCreateTasks(actor.accessRole)) {
      return NextResponse.json(
        { error: "Only admin and developers can create tasks." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const task = await createTask(body, actor);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
