import { NextResponse } from "next/server";
import {
  deleteTask,
  getTaskById,
  updateTask,
} from "../../../../lib/server/data-store.js";
import {
  canCloseTasks,
  canDeleteTasks,
} from "../../../../lib/shared/access.js";
import { getActorSession } from "../../../../lib/server/request-context.js";
import { canTransitionTask } from "../../../../lib/shared/workflow.js";

export const runtime = "nodejs";

async function getTaskId(params) {
  const resolvedParams = await params;
  return resolvedParams.id;
}

export async function GET(_request, { params }) {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const task = await getTaskById(await getTaskId(params));

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PUT(request, { params }) {
  try {
    const actor = await getActorSession();

    if (!actor.authenticated) {
      return NextResponse.json({ error: "Login required." }, { status: 401 });
    }

    const taskId = await getTaskId(params);
    const existingTask = await getTaskById(taskId);

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const body = await request.json();

    if (body.status) {
      const canTransition = canTransitionTask(
        existingTask,
        body.status,
        actor.accessRole,
        actor.id
      );

      if (!canTransition) {
        return NextResponse.json(
          { error: "Status change not allowed for your role." },
          { status: 403 }
        );
      }
    }

    if (body.status === "closed" && !canCloseTasks(actor.accessRole)) {
      return NextResponse.json(
        { error: "Only admin can close tasks." },
        { status: 403 }
      );
    }

    const task = await updateTask(taskId, body, actor);
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const actor = await getActorSession();

  if (!actor.authenticated) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  if (!canDeleteTasks(actor.accessRole)) {
    return NextResponse.json(
      { error: "Only admin can delete tasks." },
      { status: 403 }
    );
  }

  await deleteTask(await getTaskId(params));
  return NextResponse.json({ ok: true });
}
