import { getAdminSession, isAdminConfigured } from "../lib/server/admin-auth";
import { getStats, listMembers, listTasks } from "../lib/server/data-store";
import { getMemberSession } from "../lib/server/member-auth";
import DashboardApp from "../components/dashboard/dashboard-app";

export const dynamic = "force-dynamic";

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function HomePage() {
  const initialDate = getTodayDate();
  const [initialMembers, initialTasks, initialStats, adminSession, memberSession] = await Promise.all([
    listMembers(),
    listTasks({ date: initialDate }),
    getStats(initialDate),
    getAdminSession(),
    getMemberSession(),
  ]);

  return (
    <DashboardApp
      adminConfigured={isAdminConfigured()}
      initialAdminSession={adminSession}
      initialMemberSession={memberSession}
      initialDate={initialDate}
      initialMembers={initialMembers}
      initialStats={initialStats}
      initialTasks={initialTasks}
    />
  );
}
