import { NextResponse } from "next/server";
import { addTaskComment, getTaskById } from "../../../../../lib/server/data-store.js";
import { canCommentOnTask } from "../../../../../lib/shared/access.js";
import { getActorSession } from "../../../../../lib/server/request-context.js";

export const runtime = "nodejs";

async function getTaskId(params) {
  const resolvedParams = await params;
  return resolvedParams.id;
}

export async function POST(request, { params }) {
  try {
    const actor = await getActorSession();

    if (!actor.authenticated) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    if (!canCommentOnTask(actor.accessRole)) {
      return NextResponse.json(
        { error: "You are not allowed to comment on tasks." },
        { status: 403 }
      );
    }

    const taskId = await getTaskId(params);
    const task = await getTaskById(taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const body = await request.json();
    const result = await addTaskComment(taskId, body, actor);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
