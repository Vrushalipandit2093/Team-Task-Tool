"use client";

import { useState } from "react";
import { AVATAR_COLORS, STATUS_COLUMNS } from "../../lib/constants";
import { apiRequest } from "../../lib/client/api";
import {
  formatTaskTime,
  getInitials,
  getTodayDate,
} from "../../lib/client/format";
import {
  canCreateTasks,
  getAccessRoleFromMemberRole,
  getAssignableDevelopers,
  getAssignableTesters,
  getVisibleMembersForRole,
} from "../../lib/shared/access";
import AppHeader from "./header";
import TeamSidebar from "./team-sidebar";
import StatsBar from "./stats-bar";
import BoardToolbar from "./board-toolbar";
import TaskBoard from "./task-board";
import TaskModal from "./task-modal";
import MemberModal from "./member-modal";
import AdminLoginModal from "./admin-login-modal";
import MemberLoginScreen from "./member-login-screen";
import ReportsPanel from "./reports-panel";
import ToastStack from "../ui/toast-stack";

const EMPTY_STATS = {
  total: 0,
  pending: 0,
  inprogress: 0,
  testing: 0,
  completed: 0,
  closed: 0,
  overdue: 0,
  notUpdated: 0,
};

const DEFAULT_FILTERS = {
  date: getTodayDate(),
  search: "",
  status: "",
  priority: "",
  memberId: "",
};

export default function DashboardApp({
  adminConfigured = false,
  initialAdminSession = { authenticated: false, email: "" },
  initialMemberSession = { authenticated: false },
  initialDate = getTodayDate(),
  initialMembers = [],
  initialStats = EMPTY_STATS,
  initialTasks = [],
}) {
  const [adminSession, setAdminSession] = useState(initialAdminSession);
  const [memberSession, setMemberSession] = useState(initialMemberSession);
  const [members, setMembers] = useState(initialMembers);
  const [tasks, setTasks] = useState(initialTasks);
  const [stats, setStats] = useState(initialStats);
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    date: initialDate,
  });
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  const accessRole = memberSession.authenticated
    ? memberSession.accessRole
    : adminSession.authenticated
      ? "admin"
      : null;
  const hasBoardAccess = memberSession.authenticated || adminSession.authenticated;
  const currentUser = memberSession.authenticated
    ? memberSession
    : {
        id: "admin",
        name: "Admin",
        role: "Admin",
        accessRole: "admin",
      };
  const visibleMembers = getVisibleMembersForRole(members, accessRole);
  const developerOptions = getAssignableDevelopers(members);
  const testerOptions = getAssignableTesters(members);
  const canAddTask = canCreateTasks(accessRole);
  const selectedTask = selectedTaskId
    ? tasks.find((task) => task.id === selectedTaskId) || null
    : null;
  const selectedMember = selectedMemberId
    ? members.find((member) => member.id === selectedMemberId) || null
    : null;

  const boardTasks = selectedMemberId
    ? tasks.filter(
        (task) =>
          [task.assignedDeveloperId, task.assignedTesterId, task.currentAssigneeId].includes(
            selectedMemberId
          )
      )
    : tasks;

  function pushToast(message, tone = "info") {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }

  function buildQuery(nextFilters) {
    const params = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    return params.toString();
  }

  async function loadDashboard(nextFilters = filters) {
    try {
      setIsLoading(true);
      const query = buildQuery(nextFilters);
      const [nextMembers, nextTasks, nextStats] = await Promise.all([
        apiRequest("GET", "/api/members"),
        apiRequest("GET", `/api/tasks${query ? `?${query}` : ""}`),
        apiRequest("GET", `/api/stats${query ? `?${query}` : ""}`),
      ]);

      setMembers(nextMembers);
      setTasks(nextTasks);
      setStats(nextStats);

      const currentAccessRole =
        memberSession.authenticated
          ? memberSession.accessRole
          : adminSession.authenticated
            ? "admin"
            : null;

      if (currentAccessRole === "admin") {
        try {
          const nextReport = await apiRequest(
            "GET",
            `/api/reports${query ? `?${query}` : ""}`
          );
          setReport(nextReport);
        } catch {
          setReport(null);
        }
      } else {
        setReport(null);
      }
    } catch (error) {
      pushToast(`Failed to load dashboard: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(key, value) {
    const nextFilters = {
      ...filters,
      [key]: value,
    };
    setFilters(nextFilters);
    loadDashboard(nextFilters);
  }

  function handleResetFilters() {
    const nextFilters = {
      ...DEFAULT_FILTERS,
      date: getTodayDate(),
    };
    setFilters(nextFilters);
    setSelectedMemberId(null);
    loadDashboard(nextFilters);
  }

  function openNewTaskModal() {
    setSelectedTaskId(null);
    setTaskModalOpen(true);
  }

  function openEditTaskModal(taskId) {
    setSelectedTaskId(taskId);
    setTaskModalOpen(true);
  }

  function closeTaskModal() {
    setTaskModalOpen(false);
    setSelectedTaskId(null);
  }

  async function handleTaskSave(payload, taskId) {
    try {
      if (taskId) {
        const updatedTask = await apiRequest("PUT", `/api/tasks/${taskId}`, payload);
        setTasks((current) =>
          current.map((task) => (task.id === taskId ? updatedTask : task))
        );
        setSelectedTaskId(updatedTask.id);
        pushToast("Task updated", "success");
      } else {
        const createdTask = await apiRequest("POST", "/api/tasks", payload);
        setTasks((current) => [createdTask, ...current]);
        setSelectedTaskId(createdTask.id);
        pushToast("Task created", "success");
      }

      await loadDashboard(filters);
      closeTaskModal();
    } catch (error) {
      pushToast(`Save failed: ${error.message}`, "error");
      throw error;
    }
  }

  async function handleTaskDelete(taskId) {
    const shouldDelete = window.confirm("Delete this task?");

    if (!shouldDelete) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      closeTaskModal();
      await loadDashboard(filters);
      pushToast("Task deleted", "info");
    } catch (error) {
      pushToast(`Delete failed: ${error.message}`, "error");
    }
  }

  async function handleAddComment(taskId, body) {
    const result = await apiRequest("POST", `/api/tasks/${taskId}/comments`, { body });
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? result.task : task))
    );
    setSelectedTaskId(taskId);
    pushToast("Comment added", "success");
    await loadDashboard(filters);
  }

  async function handleMemberSave(payload) {
    try {
      await apiRequest("POST", "/api/members", payload);
      setMemberModalOpen(false);
      await loadDashboard(filters);
      pushToast(`${payload.name} added`, "success");
    } catch (error) {
      pushToast(`Member save failed: ${error.message}`, "error");
      throw error;
    }
  }

  async function handleMemberDelete(memberId) {
    const shouldDelete = window.confirm("Delete this member? All their tasks will be unassigned.");
    if (!shouldDelete) return;

    try {
      await apiRequest("DELETE", `/api/members/${memberId}`);
      if (selectedMemberId === memberId) {
        setSelectedMemberId(null);
      }
      await loadDashboard(filters);
      pushToast("Member deleted", "info");
    } catch (error) {
      pushToast(`Delete failed: ${error.message}`, "error");
    }
  }

  async function runAutomation(path, successMessage) {
    try {
      setIsSendingReminders(true);
      const result = await apiRequest("POST", path, { date: filters.date });
      pushToast(
        result.sent
          ? `${successMessage}: ${result.sent} email${result.sent > 1 ? "s" : ""}`
          : `${successMessage}: no emails sent`,
        result.sent ? "success" : "info"
      );
    } catch (error) {
      pushToast(error.message, "error");
    } finally {
      setIsSendingReminders(false);
    }
  }

  async function handleAdminLogin(payload) {
    const result = await apiRequest("POST", "/api/admin/login", payload);
    setAdminSession(result);
    setAdminLoginOpen(false);
    pushToast("Admin login successful", "success");
    await loadDashboard(filters);
  }

  async function handleAdminLogout() {
    await apiRequest("POST", "/api/admin/logout");
    setAdminSession({ authenticated: false, email: "" });
    setReport(null);
    pushToast("Admin logged out", "info");
  }

  async function handleMemberLogin(payload) {
    const result = await apiRequest("POST", "/api/member/session", payload);
    setMemberSession(result);
    pushToast(`Signed in as ${result.name}`, "success");
    await loadDashboard(filters);
  }

  async function handleMemberLogout() {
    await apiRequest("DELETE", "/api/member/session");
    setMemberSession({ authenticated: false });
    setReport(null);
    pushToast("Signed out", "info");
  }

  if (!hasBoardAccess) {
    return (
      <>
        <MemberLoginScreen
          adminConfigured={adminConfigured}
          onAdminLogin={() => setAdminLoginOpen(true)}
          onMemberLogin={handleMemberLogin}
        />

        <AdminLoginModal
          isOpen={adminLoginOpen}
          onClose={() => setAdminLoginOpen(false)}
          onLogin={handleAdminLogin}
        />

        <ToastStack toasts={toasts} />
      </>
    );
  }

  return (
    <main className="dashboard-shell">
      <AppHeader
        adminConfigured={adminConfigured}
        adminEmail={adminSession.email}
        currentUserName={currentUser.name}
        currentUserRole={currentUser.role}
        isAdminAuthenticated={adminSession.authenticated}
        isMemberAuthenticated={memberSession.authenticated}
        isSendingReminders={isSendingReminders}
        onAddMember={() => setMemberModalOpen(true)}
        onAdminLogin={() => setAdminLoginOpen(true)}
        onAdminLogout={handleAdminLogout}
        onMemberLogout={handleMemberLogout}
        onRunDailyAutomation={() =>
          runAutomation("/api/automation/daily", "Daily email completed")
        }
        onRunEveningAutomation={() =>
          runAutomation(
            "/api/automation/evening-summary",
            "Evening summary completed"
          )
        }
        onRunOverdueAlerts={() =>
          runAutomation("/api/automation/overdue-alerts", "Overdue alerts sent")
        }
      />

      <div className="dashboard-layout">
        <TeamSidebar
          avatarColors={AVATAR_COLORS}
          date={filters.date}
          members={visibleMembers}
          selectedMember={selectedMember}
          selectedMemberId={selectedMemberId}
          tasks={tasks}
          onSelectMember={setSelectedMemberId}
          onDeleteMember={handleMemberDelete}
          isAdmin={accessRole === "admin"}
        />

        <section className="dashboard-main">
          <StatsBar stats={stats} />

          <BoardToolbar
            canAddTask={canAddTask}
            currentUserRole={currentUser.role}
            filters={filters}
            members={visibleMembers}
            onAddTask={openNewTaskModal}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />

          {accessRole === "admin" ? <ReportsPanel report={report} /> : null}

          <TaskBoard
            avatarColors={AVATAR_COLORS}
            columns={STATUS_COLUMNS}
            isLoading={isLoading}
            members={members}
            onEditTask={openEditTaskModal}
            tasks={boardTasks}
            todayDate={getTodayDate()}
            formatTaskTime={formatTaskTime}
            getInitials={getInitials}
          />
        </section>
      </div>

      <TaskModal
        accessRole={accessRole}
        currentUser={currentUser}
        defaultDate={filters.date}
        developers={developerOptions}
        isOpen={taskModalOpen}
        key={`${selectedTaskId || "new"}-${filters.date}-${taskModalOpen ? "open" : "closed"}`}
        onAddComment={handleAddComment}
        onClose={closeTaskModal}
        onDelete={handleTaskDelete}
        onSave={handleTaskSave}
        task={selectedTask}
        testers={testerOptions}
      />

      <MemberModal
        isOpen={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        onSave={handleMemberSave}
      />

      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onLogin={handleAdminLogin}
      />

      <ToastStack toasts={toasts} />
    </main>
  );
}
