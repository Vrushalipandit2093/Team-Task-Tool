const DEVELOPER_ROLE_MATCHERS = ["developer", "tech lead", "frontend", "backend", "full stack"];
const TESTER_ROLE_MATCHERS = ["tester", "qa", "quality"];

export function getAccessRoleFromMemberRole(role) {
  const normalizedRole = (role || "").trim().toLowerCase();

  if (!normalizedRole) {
    return null;
  }

  if (normalizedRole === "admin") {
    return "admin";
  }

  if (TESTER_ROLE_MATCHERS.some((matcher) => normalizedRole.includes(matcher))) {
    return "tester";
  }

  if (DEVELOPER_ROLE_MATCHERS.some((matcher) => normalizedRole.includes(matcher))) {
    return "developer";
  }

  return null;
}

export function canMemberAccessDashboard(member) {
  return Boolean(getAccessRoleFromMemberRole(member?.role));
}

export function getVisibleMembersForRole(members, accessRole) {
  if (accessRole === "admin") {
    return members;
  }

  return members.filter((member) => getAccessRoleFromMemberRole(member.role) !== "admin");
}

export function getAssignableDevelopers(members) {
  return members.filter(
    (member) => getAccessRoleFromMemberRole(member.role) === "developer"
  );
}

export function getAssignableTesters(members) {
  return members.filter(
    (member) => getAccessRoleFromMemberRole(member.role) === "tester"
  );
}

export function canManageUsers(accessRole) {
  return accessRole === "admin";
}

export function canCreateTasks(accessRole) {
  return accessRole === "admin" || accessRole === "developer";
}

export function canDeleteTasks(accessRole) {
  return accessRole === "admin";
}

export function canViewReports(accessRole) {
  return accessRole === "admin";
}

export function canCloseTasks(accessRole) {
  return accessRole === "admin";
}

export function canCommentOnTask(accessRole) {
  return accessRole === "admin" || accessRole === "developer" || accessRole === "tester";
}

export function isTaskVisibleToRole(task, userId, accessRole) {
  if (accessRole === "admin") {
    return true;
  }

  if (accessRole === "developer") {
    return task.assignedDeveloperId === userId || task.currentAssigneeId === userId;
  }

  if (accessRole === "tester") {
    return task.assignedTesterId === userId || task.currentAssigneeId === userId;
  }

  return false;
}
