import "dotenv/config";
import nodemailer from "nodemailer";
import { loadData } from "./data-store.js";
import { isValidEmail, normalizeEmail } from "../shared/email.js";
import { getTaskAttentionFlags, getStatusLabel } from "../shared/workflow.js";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function createTransporter() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST;
  const port = Number.parseInt(
    process.env.SMTP_PORT || process.env.MAIL_PORT || "587",
    10
  );
  const secure =
    process.env.SMTP_SECURE === "true" ||
    process.env.MAIL_ENCRYPTION === "ssl";
  const user = process.env.EMAIL_USER || process.env.MAIL_USERNAME;
  const pass = process.env.EMAIL_PASS || process.env.MAIL_PASSWORD;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false",
    },
  });
}

function getSenderAddress() {
  const senderEmail = normalizeEmail(
    process.env.SENDER_EMAIL ||
      process.env.MAIL_FROM_ADDRESS ||
      process.env.EMAIL_USER
  );

  if (!isValidEmail(senderEmail)) {
    throw new Error(
      "Missing valid sender email. Set SENDER_EMAIL in .env to a verified email address."
    );
  }

  return {
    envelopeFrom: senderEmail,
    headerFrom: `"${process.env.SENDER_NAME || "Task Automation"}" <${senderEmail}>`,
  };
}

function getRecipientEmail(member) {
  const email = normalizeEmail(member?.email);
  return isValidEmail(email) ? email : null;
}

function buildTaskRows(tasks) {
  if (tasks.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding:14px;color:#94a3b8;border-bottom:1px solid #1e2130;">No tasks in this section.</td>
      </tr>
    `;
  }

  return tasks
    .map(
      (task) => `
        <tr>
          <td style="padding:10px 12px;color:#e2e8f0;border-bottom:1px solid #1e2130;">${task.taskKey}</td>
          <td style="padding:10px 12px;color:#e2e8f0;border-bottom:1px solid #1e2130;">${task.title}</td>
          <td style="padding:10px 12px;color:#94a3b8;border-bottom:1px solid #1e2130;">${getStatusLabel(task.status)}</td>
          <td style="padding:10px 12px;color:#94a3b8;border-bottom:1px solid #1e2130;">${task.deadline || "-"}</td>
        </tr>
      `
    )
    .join("");
}

function wrapEmail(title, subtitle, sections) {
  return `
    <html>
      <body style="margin:0;padding:24px;background:#090b12;font-family:Segoe UI,sans-serif;color:#e2e8f0;">
        <div style="max-width:760px;margin:0 auto;background:#111522;border:1px solid #20263a;border-radius:18px;overflow:hidden;">
          <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#172554);">
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;margin-bottom:8px;">Task Management System</div>
            <h1 style="margin:0 0 8px;font-size:28px;">${title}</h1>
            <p style="margin:0;color:#cbd5e1;">${subtitle}</p>
          </div>
          <div style="padding:24px 32px;">${sections}</div>
        </div>
      </body>
    </html>
  `;
}

function buildSection(title, tasks) {
  return `
    <div style="margin-bottom:20px;">
      <h2 style="margin:0 0 10px;font-size:16px;">${title}</h2>
      <table style="width:100%;border-collapse:collapse;background:#0b1220;border-radius:10px;overflow:hidden;">
        <thead>
          <tr style="background:#172033;">
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;">ID</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;">Task</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;">Status</th>
            <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:11px;">Deadline</th>
          </tr>
        </thead>
        <tbody>${buildTaskRows(tasks)}</tbody>
      </table>
    </div>
  `;
}

async function sendMail(to, subject, html) {
  const transporter = createTransporter();
  const from = getSenderAddress();

  await transporter.sendMail({
    from: from.headerFrom,
    envelope: {
      from: from.envelopeFrom,
      to,
    },
    to,
    subject,
    html,
  });
}

function groupTasksForMember(tasks, member) {
  return tasks.filter(
    (task) =>
      task.assignedDeveloperId === member.id ||
      task.assignedTesterId === member.id ||
      task.currentAssigneeId === member.id
  );
}

export async function sendDailyTaskListEmail(targetDate = getTodayDate()) {
  const data = await loadData();
  const result = { sent: 0, errors: [] };

  for (const member of data.members) {
    const email = getRecipientEmail(member);
    if (!email) {
      continue;
    }

    const memberTasks = groupTasksForMember(data.tasks, member);
    const assignedTasks = memberTasks.filter((task) => task.currentAssigneeId === member.id);
    const pendingTasks = memberTasks.filter(
      (task) => !["completed", "closed"].includes(task.status)
    );
    const overdueTasks = memberTasks.filter(
      (task) => getTaskAttentionFlags(task, targetDate).overdue
    );

    const html = wrapEmail(
      "11:00 AM Daily Task List",
      `Hello ${member.name}, here is your task snapshot for ${targetDate}.`,
      [
        buildSection("Assigned Tasks", assignedTasks),
        buildSection("Pending Tasks", pendingTasks),
        buildSection("Overdue Tasks", overdueTasks),
      ].join("")
    );

    try {
      await sendMail(email, `[Daily Tasks] ${targetDate}`, html);
      result.sent += 1;
    } catch (error) {
      result.errors.push({ member: member.name, error: error.message });
    }
  }

  return result;
}

export async function sendEveningSummaryEmail(targetDate = getTodayDate()) {
  const data = await loadData();
  const result = { sent: 0, errors: [] };

  for (const member of data.members) {
    const email = getRecipientEmail(member);
    if (!email) {
      continue;
    }

    const memberTasks = groupTasksForMember(data.tasks, member);
    const completedTasks = memberTasks.filter((task) => task.status === "completed");
    const pendingTasks = memberTasks.filter(
      (task) => !["completed", "closed"].includes(task.status)
    );
    const notUpdatedTasks = memberTasks.filter(
      (task) => getTaskAttentionFlags(task, targetDate).notUpdated
    );

    const html = wrapEmail(
      "7:00 PM Summary",
      `Hello ${member.name}, here is your end-of-day summary for ${targetDate}.`,
      [
        buildSection("Completed Tasks", completedTasks),
        buildSection("Pending Tasks", pendingTasks),
        buildSection("Tasks Not Updated", notUpdatedTasks),
      ].join("")
    );

    try {
      await sendMail(email, `[Evening Summary] ${targetDate}`, html);
      result.sent += 1;
    } catch (error) {
      result.errors.push({ member: member.name, error: error.message });
    }
  }

  return result;
}

export async function sendOverdueAlerts(targetDate = getTodayDate()) {
  const data = await loadData();
  const adminMembers = data.members.filter((member) => String(member.role).toLowerCase() === "admin");
  const overdueTasks = data.tasks.filter(
    (task) => getTaskAttentionFlags(task, targetDate).overdue
  );

  const result = { sent: 0, errors: [] };

  for (const task of overdueTasks) {
    const recipients = new Map();
    const assignedUsers = data.members.filter(
      (member) =>
        [task.currentAssigneeId, task.assignedDeveloperId, task.assignedTesterId].includes(member.id)
    );

    [...adminMembers, ...assignedUsers].forEach((member) => {
      const email = getRecipientEmail(member);
      if (email) {
        recipients.set(email, member.name);
      }
    });

    if (recipients.size === 0) {
      continue;
    }

    const html = wrapEmail(
      `Overdue Alert: ${task.taskKey}`,
      `${task.title} has crossed its deadline and needs attention.`,
      buildSection("Overdue Task", [task])
    );

    try {
      await sendMail([...recipients.keys()].join(","), `[Overdue Alert] ${task.taskKey}`, html);
      result.sent += recipients.size;
    } catch (error) {
      result.errors.push({ taskKey: task.taskKey, error: error.message });
    }
  }

  return result;
}

export async function sendTaskAssignedEmail(task, assigneeMember, assignerActor) {
  const email = getRecipientEmail(assigneeMember);
  if (!email) {
    return false;
  }

  const html = wrapEmail(
    `New Task Assigned: ${task.taskKey}`,
    `${assignerActor?.name || 'Admin'} assigned a task to you.`,
    buildSection("Task Details", [task])
  );

  try {
    await sendMail(email, `[Assigned] ${task.taskKey}: ${task.title}`, html);
    return true;
  } catch (error) {
    console.error("Failed to send task assigned email:", error);
    return false;
  }
}

export async function sendTaskStatusUpdateEmail(task, targetMember, previousStatus, actor) {
  const email = getRecipientEmail(targetMember);
  if (!email) {
    return false;
  }

  const previousLabel = getStatusLabel(previousStatus);
  const currentLabel = getStatusLabel(task.status);

  const html = wrapEmail(
    `Task Update: ${task.taskKey}`,
    `${actor?.name || 'A team member'} changed the status from ${previousLabel} to ${currentLabel}.`,
    buildSection("Task Details", [task])
  );

  try {
    await sendMail(email, `[Status Update] ${task.taskKey} is now ${currentLabel}`, html);
    return true;
  } catch (error) {
    console.error("Failed to send status update email:", error);
    return false;
  }
}
