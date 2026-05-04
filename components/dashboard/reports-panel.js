export default function ReportsPanel({ report }) {
  if (!report) {
    return null;
  }

  return (
    <section className="reports-panel">
      <div className="reports-header">
        <div>
          <div className="board-title">Admin reports</div>
          <div className="board-subtitle">Pending workload and member-level summary</div>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <div className="sidebar-label">By member</div>
          <div className="report-table">
            {report.byMember.map((entry) => (
              <div key={entry.memberId} className="report-row">
                <div>
                  <div className="member-name">{entry.memberName}</div>
                  <div className="member-role">{entry.role}</div>
                </div>
                <div className="report-row-values">
                  <span>{entry.total} total</span>
                  <span>{entry.overdue} overdue</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-card">
          <div className="sidebar-label">Pending queue</div>
          <div className="report-table">
            {report.pendingTasks.slice(0, 8).map((task) => (
              <div key={task.id} className="report-row">
                <div>
                  <div className="member-name">
                    {task.taskKey} {task.title}
                  </div>
                  <div className="member-role">{task.status}</div>
                </div>
                <div className="report-row-values">
                  <span>{task.priority}</span>
                  <span>{task.deadline || "-"}</span>
                </div>
              </div>
            ))}
            {report.pendingTasks.length === 0 ? (
              <div className="member-role">No pending tasks.</div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
