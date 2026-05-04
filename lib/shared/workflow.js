import {
  WORKFLOW_STATUS_LABELS,
} from "../constants.js";

export function getStatusLabel(status) {
  return WORKFLOW_STATUS_LABELS[status] || status;
}

export function normalizeLegacyStatus(status) {
  const normalizedStatus = (status || "").trim().toLowerCase();

  const map = {
    todo: "pending",
    inprogress: "inprogress",
    review: "readyfortesting",
    testing: "testing",
    done: "completed",
    blocked: "reopened",
    pending: "pending",
    readyfortesting: "readyfortesting",
    completed: "completed",
    reopened: "reopened",
    closed: "closed",
  };

  return map[normalizedStatus] || "pending";
}

export function canTransitionTask(task, nextStatus, actorRole, actorId) {
  if (actorRole === "admin") {
    if (nextStatus === "closed") {
      return task.status === "completed";
    }

    return true;
  }

  if (actorRole === "developer") {
    const isAssignedDeveloper = task.assignedDeveloperId === actorId;
    if (!isAssignedDeveloper) {
      return false;
    }

    return ["inprogress", "readyfortesting"].includes(nextStatus);
  }

  if (actorRole === "tester") {
    const isAssignedTester = task.assignedTesterId === actorId;
    if (!isAssignedTester) {
      return false;
    }

    return ["testing", "completed", "reopened"].includes(nextStatus);
  }

  return false;
}

export function getNextAssigneeIdForStatus(task, nextStatus) {
  if (nextStatus === "readyfortesting" || nextStatus === "testing" || nextStatus === "completed") {
    return task.assignedTesterId || task.currentAssigneeId || "";
  }

  if (nextStatus === "reopened" || nextStatus === "inprogress" || nextStatus === "pending") {
    return task.assignedDeveloperId || task.currentAssigneeId || "";
  }

  if (nextStatus === "closed") {
    return "";
  }

  return task.currentAssigneeId || "";
}

export function buildWorkflowMessage(task, nextStatus) {
  const nextLabel = getStatusLabel(nextStatus);

  if (nextStatus === "readyfortesting") {
    return `Moved to ${nextLabel} and handed over to QA.`;
  }

  if (nextStatus === "reopened") {
    return "QA reopened the task and sent it back to development.";
  }

  if (nextStatus === "completed") {
    return "QA marked the task as completed.";
  }

  if (nextStatus === "closed") {
    return "Admin closed the task after QA completion.";
  }

  return `Status changed to ${nextLabel}.`;
}

export function getTaskAttentionFlags(task, today) {
  const deadline = task.deadline || task.dueDate || "";
  const updatedDate = String(task.updatedAt || task.createdAt || "").slice(0, 10);

  return {
    overdue: Boolean(deadline && deadline < today && !["completed", "closed"].includes(task.status)),
    notUpdated: Boolean(updatedDate && updatedDate < today && !["completed", "closed"].includes(task.status)),
  };
}
