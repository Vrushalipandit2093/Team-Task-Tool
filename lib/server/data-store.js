import "dotenv/config";
import { promises as fs } from "fs";
import path from "path";
import { isValidEmail, normalizeEmail } from "../shared/email.js";
import { getAccessRoleFromMemberRole } from "../shared/access.js";
import {
  buildWorkflowMessage,
  getNextAssigneeIdForStatus,
  getTaskAttentionFlags,
  normalizeLegacyStatus,
} from "../shared/workflow.js";
import { sendTaskAssignedEmail, sendTaskStatusUpdateEmail } from "./automation.js";

const DATA_FILE = path.join(process.cwd(), "data.json");

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createId() {
  return `${Date.now()}${Math.random().toString(16).slice(2, 8)}`;
}

function createTaskKey(tasks) {
  const maxCounter = tasks.reduce((highest, task) => {
    const match = String(task.taskKey || "").match(/TT-(\d+)/);
    const value = match ? Number.parseInt(match[1], 10) : 0;
    return Math.max(highest, value);
  }, 0);

  return `TT-${String(maxCounter + 1).padStart(4, "0")}`;
}

function createAuditEntry(type, actor, message, extra = {}) {
  return {
    id: createId(),
    type,
    actorId: actor?.id || "",
    actorName: actor?.name || actor?.email || "System",
    actorRole: actor?.role || actor?.accessRole || "system",
    message,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

function normalizeMember(member) {
  const normalizedEmail = normalizeEmail(member.email);

  return {
    id: member.id || createId(),
    name: member.name || "",
    email: normalizedEmail,
    role: member.role || "Developer",
    accessRole:
      member.accessRole || getAccessRoleFromMemberRole(member.role) || "developer",
    createdAt: member.createdAt || new Date().toISOString(),
  };
}

function normalizeComment(comment, fallbackActor = {}) {
  return {
    id: comment.id || createId(),
    authorId: comment.authorId || fallbackActor.id || "",
    authorName: comment.authorName || fallbackActor.name || "Unknown",
    authorRole:
      comment.authorRole || fallbackActor.role || fallbackActor.accessRole || "",
    body: comment.body || "",
    createdAt: comment.createdAt || new Date().toISOString(),
  };
}

function normalizeTask(task, members = []) {
  const status = normalizeLegacyStatus(task.status);
  const assignedDeveloperId =
    task.assignedDeveloperId ||
    (task.assigneeId &&
    getAccessRoleFromMemberRole(
      members.find((member) => member.id === task.assigneeId)?.role
    ) === "developer"
      ? task.assigneeId
      : "");
  const assignedTesterId =
    task.assignedTesterId ||
    (task.assigneeId &&
    getAccessRoleFromMemberRole(
      members.find((member) => member.id === task.assigneeId)?.role
    ) === "tester"
      ? task.assigneeId
      : "");

  const currentAssigneeId =
    task.currentAssigneeId ||
    (status === "readyfortesting" ||
    status === "testing" ||
    status === "completed"
      ? assignedTesterId
      : assignedDeveloperId) ||
    task.assigneeId ||
    "";

  return {
    id: task.id || createId(),
    taskKey: task.taskKey || `LEGACY-${String(task.id || createId()).slice(-4)}`,
    title: task.title || "",
    description: task.description || task.notes || "",
    priority: task.priority || "med",
    type: task.type || "Feature",
    status,
    assignedDeveloperId,
    assignedTesterId,
    currentAssigneeId,
    deadline: task.deadline || task.dueDate || "",
    dueDate: task.deadline || task.dueDate || "",
    comments: Array.isArray(task.comments) ? task.comments.map((comment) => normalizeComment(comment)) : [],
    activityLog: Array.isArray(task.activityLog)
      ? task.activityLog
      : [],
    createdById: task.createdById || "",
    createdByName: task.createdByName || task.assignedByName || "",
    createdByRole: task.createdByRole || task.assignedByRole || "",
    assignedById: task.assignedById || "",
    assignedByName: task.assignedByName || "",
    assignedByRole: task.assignedByRole || "",
    closedAt: task.closedAt || "",
    completedAt: task.completedAt || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
  };
}

function normalizeDataShape(rawData) {
  const data = rawData || {};
  const members = Array.isArray(data.members) ? data.members.map(normalizeMember) : [];
  const tasks = Array.isArray(data.tasks)
    ? data.tasks.map((task) => normalizeTask(task, members))
    : [];

  return { members, tasks };
}

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const initialData = { members: [], tasks: [] };
    await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
  }
}

export async function loadData() {
  await ensureDataFile();
  const fileContents = await fs.readFile(DATA_FILE, "utf8");
  return normalizeDataShape(JSON.parse(fileContents));
}

export async function saveData(data) {
  const normalized = normalizeDataShape(data);
  await fs.writeFile(DATA_FILE, JSON.stringify(normalized, null, 2));
}

export async function listMembers() {
  const data = await loadData();
  return data.members;
}

export async function createMember(payload) {
  const { name, email, role } = payload;
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail) {
    throw new Error("Name and email required");
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new Error("Please provide a valid email address");
  }

  const data = await loadData();
  const existingMember = data.members.find((member) => member.email === normalizedEmail);

  if (existingMember) {
    throw new Error("A member with this email already exists");
  }

  const member = normalizeMember({
    id: createId(),
    name,
    email: normalizedEmail,
    role: role || "Developer",
    createdAt: new Date().toISOString(),
  });

  data.members.push(member);
  await saveData(data);
  return member;
}

export async function updateMember(id, updates) {
  const data = await loadData();
  const memberIndex = data.members.findIndex((member) => member.id === id);

  if (memberIndex === -1) {
    return null;
  }

  const nextUpdates = { ...updates };

  if ("email" in nextUpdates) {
    const normalizedEmail = normalizeEmail(nextUpdates.email);

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      throw new Error("Please provide a valid email address");
    }

    const duplicateMember = data.members.find(
      (member) => member.id !== id && member.email === normalizedEmail
    );

    if (duplicateMember) {
      throw new Error("A member with this email already exists");
    }

    nextUpdates.email = normalizedEmail;
  }

  data.members[memberIndex] = normalizeMember({
    ...data.members[memberIndex],
    ...nextUpdates,
  });

  await saveData(data);
  return data.members[memberIndex];
}

export async function deleteMember(id) {
  const data = await loadData();
  data.members = data.members.filter((member) => member.id !== id);
  data.tasks = data.tasks.filter(
    (task) =>
      task.assignedDeveloperId !== id &&
      task.assignedTesterId !== id &&
      task.currentAssigneeId !== id
  );
  await saveData(data);
  return { ok: true };
}

function filterTasksByRole(tasks, filters = {}) {
  const {
    date,
    status,
    priority,
    search,
    assignedDeveloperId,
    assignedTesterId,
    currentAssigneeId,
    memberId,
    accessRole,
    userId,
  } = filters;

  let filteredTasks = tasks;

  if (accessRole && userId && accessRole !== "admin") {
    filteredTasks = filteredTasks.filter((task) => {
      if (accessRole === "developer") {
        return task.assignedDeveloperId === userId || task.currentAssigneeId === userId;
      }

      if (accessRole === "tester") {
        return task.assignedTesterId === userId || task.currentAssigneeId === userId;
      }

      return false;
    });
  }

  if (date) {
    filteredTasks = filteredTasks.filter((task) => task.deadline === date);
  }

  if (status) {
    filteredTasks = filteredTasks.filter((task) => task.status === status);
  }

  if (priority) {
    filteredTasks = filteredTasks.filter((task) => task.priority === priority);
  }

  if (assignedDeveloperId) {
    filteredTasks = filteredTasks.filter(
      (task) => task.assignedDeveloperId === assignedDeveloperId
    );
  }

  if (assignedTesterId) {
    filteredTasks = filteredTasks.filter(
      (task) => task.assignedTesterId === assignedTesterId
    );
  }

  if (currentAssigneeId) {
    filteredTasks = filteredTasks.filter(
      (task) => task.currentAssigneeId === currentAssigneeId
    );
  }

  if (memberId) {
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.assignedDeveloperId === memberId ||
        task.assignedTesterId === memberId ||
        task.currentAssigneeId === memberId
    );
  }

  if (search) {
    const normalizedSearch = search.trim().toLowerCase();
    filteredTasks = filteredTasks.filter((task) =>
      [
        task.taskKey,
        task.title,
        task.description,
        task.priority,
        task.status,
        task.type,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedSearch))
    );
  }

  return filteredTasks.sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export async function listTasks(filters = {}) {
  const data = await loadData();
  return filterTasksByRole(data.tasks, filters);
}

export async function getTaskById(id) {
  const data = await loadData();
  return data.tasks.find((task) => task.id === id) || null;
}

function validateTaskPayload(payload) {
  if (!payload.title?.trim()) {
    throw new Error("Task title is required");
  }

  if (!payload.description?.trim()) {
    throw new Error("Task description is required");
  }

  if (!payload.assignedDeveloperId) {
    throw new Error("Assigned developer is required");
  }

  if (!payload.assignedTesterId) {
    throw new Error("Assigned tester is required");
  }

  if (!payload.deadline) {
    throw new Error("Deadline is required");
  }
}

export async function createTask(payload, actor) {
  validateTaskPayload(payload);

  const data = await loadData();
  const timestamp = new Date().toISOString();
  const task = normalizeTask(
    {
      id: createId(),
      taskKey: createTaskKey(data.tasks),
      title: payload.title.trim(),
      description: payload.description.trim(),
      priority: payload.priority || "med",
      type: payload.type || "Feature",
      status: payload.status || "pending",
      assignedDeveloperId: payload.assignedDeveloperId,
      assignedTesterId: payload.assignedTesterId,
      currentAssigneeId: payload.assignedDeveloperId,
      deadline: payload.deadline,
      dueDate: payload.deadline,
      comments: [],
      activityLog: [],
      createdById: actor?.id || "",
      createdByName: actor?.name || "",
      createdByRole: actor?.role || actor?.accessRole || "",
      assignedById: actor?.id || "",
      assignedByName: actor?.name || "",
      assignedByRole: actor?.role || actor?.accessRole || "",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    data.members
  );

  const assignedDeveloper = data.members.find(m => m.id === payload.assignedDeveloperId);

  task.activityLog = [
    createAuditEntry(
      "task_created",
      actor,
      `Task created and assigned to developer ${assignedDeveloper?.name || payload.assignedDeveloperName || ""}.`
    ),
  ];

  data.tasks.push(task);
  await saveData(data);
  
  if (assignedDeveloper) {
    sendTaskAssignedEmail(task, assignedDeveloper, actor).catch(console.error);
  }
  
  return task;
}

export async function updateTask(id, updates, actor) {
  const data = await loadData();
  const taskIndex = data.tasks.findIndex((task) => task.id === id);

  if (taskIndex === -1) {
    return null;
  }

  const currentTask = data.tasks[taskIndex];
  const nextTask = normalizeTask(
    {
      ...currentTask,
      ...updates,
      updatedAt: new Date().toISOString(),
    },
    data.members
  );

  const activityLog = [...(currentTask.activityLog || [])];

  if (updates.status && updates.status !== currentTask.status) {
    nextTask.currentAssigneeId = getNextAssigneeIdForStatus(nextTask, updates.status);
    if (updates.status === "completed") {
      nextTask.completedAt = new Date().toISOString();
    }
    if (updates.status === "closed") {
      nextTask.closedAt = new Date().toISOString();
    }

    activityLog.push(
      createAuditEntry(
        "status_changed",
        actor,
        buildWorkflowMessage(currentTask, updates.status),
        {
          previousStatus: currentTask.status,
          nextStatus: updates.status,
        }
      )
    );
    
    const targetAssignee = data.members.find(m => m.id === nextTask.currentAssigneeId);
    if (targetAssignee) {
      sendTaskStatusUpdateEmail(nextTask, targetAssignee, currentTask.status, actor).catch(console.error);
    }
  }

  if (
    updates.assignedDeveloperId &&
    updates.assignedDeveloperId !== currentTask.assignedDeveloperId
  ) {
    activityLog.push(
      createAuditEntry("developer_changed", actor, "Assigned developer changed.")
    );
    const newDev = data.members.find(m => m.id === updates.assignedDeveloperId);
    if (newDev) {
      sendTaskAssignedEmail(nextTask, newDev, actor).catch(console.error);
    }
  }

  if (
    updates.assignedTesterId &&
    updates.assignedTesterId !== currentTask.assignedTesterId
  ) {
    activityLog.push(
      createAuditEntry("tester_changed", actor, "Assigned tester changed.")
    );
    const newTester = data.members.find(m => m.id === updates.assignedTesterId);
    if (newTester) {
      sendTaskAssignedEmail(nextTask, newTester, actor).catch(console.error);
    }
  }

  if (updates.commentForDelay?.trim()) {
    const delayComment = normalizeComment(
      {
        body: updates.commentForDelay.trim(),
      },
      actor
    );
    nextTask.comments = [...(currentTask.comments || []), delayComment];
    activityLog.push(
      createAuditEntry("comment_added", actor, "Added an update comment.")
    );
  } else {
    nextTask.comments = currentTask.comments || [];
  }

  nextTask.activityLog = activityLog;
  data.tasks[taskIndex] = nextTask;

  await saveData(data);
  return nextTask;
}

export async function deleteTask(id) {
  const data = await loadData();
  data.tasks = data.tasks.filter((task) => task.id !== id);
  await saveData(data);
  return { ok: true };
}

export async function addTaskComment(taskId, payload, actor) {
  const data = await loadData();
  const taskIndex = data.tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return null;
  }

  if (!payload.body?.trim()) {
    throw new Error("Comment text is required");
  }

  const comment = normalizeComment(
    {
      body: payload.body.trim(),
    },
    actor
  );

  data.tasks[taskIndex].comments = [...(data.tasks[taskIndex].comments || []), comment];
  data.tasks[taskIndex].activityLog = [
    ...(data.tasks[taskIndex].activityLog || []),
    createAuditEntry("comment_added", actor, "Added a task comment."),
  ];
  data.tasks[taskIndex].updatedAt = new Date().toISOString();

  await saveData(data);
  return {
    task: data.tasks[taskIndex],
    comment,
  };
}

export async function getStats(date, filters = {}) {
  const tasks = await listTasks({
    ...filters,
    date,
  });
  const today = getTodayDate();

  const flags = tasks.map((task) => getTaskAttentionFlags(task, today));

  return {
    total: tasks.length,
    pending: tasks.filter((task) => task.status === "pending").length,
    inprogress: tasks.filter((task) => task.status === "inprogress").length,
    testing: tasks.filter((task) =>
      ["readyfortesting", "testing"].includes(task.status)
    ).length,
    completed: tasks.filter((task) => task.status === "completed").length,
    closed: tasks.filter((task) => task.status === "closed").length,
    reopened: tasks.filter((task) => task.status === "reopened").length,
    overdue: flags.filter((entry) => entry.overdue).length,
    notUpdated: flags.filter((entry) => entry.notUpdated).length,
  };
}

export async function getReports(filters = {}) {
  const tasks = await listTasks(filters);
  const members = await listMembers();
  const today = getTodayDate();
  const byMember = members.map((member) => {
    const memberTasks = tasks.filter(
      (task) =>
        task.assignedDeveloperId === member.id ||
        task.assignedTesterId === member.id ||
        task.currentAssigneeId === member.id
    );

    return {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      total: memberTasks.length,
      pending: memberTasks.filter((task) => task.status === "pending").length,
      inprogress: memberTasks.filter((task) => task.status === "inprogress").length,
      testing: memberTasks.filter((task) =>
        ["readyfortesting", "testing"].includes(task.status)
      ).length,
      completed: memberTasks.filter((task) => task.status === "completed").length,
      closed: memberTasks.filter((task) => task.status === "closed").length,
      overdue: memberTasks.filter((task) =>
        getTaskAttentionFlags(task, today).overdue
      ).length,
    };
  });

  return {
    summary: await getStats(filters.date, filters),
    byMember,
    pendingTasks: tasks.filter(
      (task) => !["completed", "closed"].includes(task.status)
    ),
  };
}
