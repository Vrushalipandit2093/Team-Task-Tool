export const AVATAR_COLORS = [
  { bg: "#0f1035", color: "#818cf8", border: "#232880" },
  { bg: "#021a10", color: "#10b981", border: "#064d2d" },
  { bg: "#1e1400", color: "#f59e0b", border: "#4a3000" },
  { bg: "#160a2a", color: "#a855f7", border: "#3d1570" },
  { bg: "#031d2f", color: "#38bdf8", border: "#0a4060" },
  { bg: "#1f050a", color: "#fb7185", border: "#5c1020" },
  { bg: "#021a18", color: "#2dd4bf", border: "#064d44" },
  { bg: "#1f0e00", color: "#fb923c", border: "#5c2a00" },
];

export const STATUS_COLUMNS = [
  { id: "pending", label: "Pending", tone: "todo" },
  { id: "inprogress", label: "In Progress", tone: "inprogress" },
  { id: "readyfortesting", label: "Ready for Testing", tone: "review" },
  { id: "testing", label: "Testing In Progress", tone: "review" },
  { id: "completed", label: "Completed", tone: "done" },
  { id: "reopened", label: "Reopen", tone: "blocked" },
  { id: "closed", label: "Closed", tone: "done" },
];

export const TASK_TYPES = [
  "Feature",
  "Bug",
  "Review",
  "Testing",
  "DevOps",
  "Backend",
  "Frontend",
  "Docs",
  "Meeting",
];

export const TEAM_ROLES = [
  "Admin",
  "Developer",
  "QA (Tester)",
  "Tester",
  "Senior Developer",
  "Tech Lead",
  "QA Engineer",
  "DevOps Engineer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
];

export const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "med", label: "Medium" },
  { value: "low", label: "Low" },
];

export const WORKFLOW_STATUS_LABELS = {
  pending: "Pending",
  inprogress: "In Progress",
  readyfortesting: "Ready for Testing",
  testing: "Testing In Progress",
  completed: "Completed",
  reopened: "Reopen",
  closed: "Closed",
};

export const REPORT_CARDS = [
  { key: "total", label: "Total", tone: "total" },
  { key: "pending", label: "Pending", tone: "todo" },
  { key: "inprogress", label: "In Progress", tone: "inprogress" },
  { key: "testing", label: "Testing", tone: "review" },
  { key: "completed", label: "Completed", tone: "done" },
  { key: "closed", label: "Closed", tone: "done" },
  { key: "overdue", label: "Overdue", tone: "blocked" },
  { key: "notUpdated", label: "Not Updated", tone: "blocked" },
];
