import { getStatusLabel } from "../../lib/shared/workflow";

function getAvatarStyle(colors) {
  return {
    background: colors.bg,
    color: colors.color,
    borderColor: colors.border,
  };
}

function getMemberName(members, id) {
  return members.find((member) => member.id === id)?.name || "Unassigned";
}

export default function TaskBoard({
  avatarColors,
  columns,
  isLoading,
  members,
  onEditTask,
  tasks,
  formatTaskTime,
  getInitials,
  todayDate,
}) {
  return (
    <div className="board-scroll">
      <div className="task-board task-board-expanded">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);

          return (
            <section key={column.id} className={`task-column task-column-${column.tone}`}>
              <header className={`task-column-header task-column-header-${column.tone}`}>
                <div className={`task-column-title task-column-title-${column.tone}`}>
                  <span className="task-column-dot" />
                  {column.label}
                </div>

                <span className={`task-column-count task-column-count-${column.tone}`}>
                  {columnTasks.length}
                </span>
              </header>

              <div className="task-column-body">
                {isLoading ? (
                  <div className="empty-state">
                    <div className="empty-state-dot">...</div>
                    <div className="empty-state-text">Loading tasks</div>
                  </div>
                ) : null}

                {!isLoading && columnTasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-dot">o</div>
                    <div className="empty-state-text">No tasks</div>
                  </div>
                ) : null}

                {!isLoading
                  ? columnTasks.map((task) => {
                      const currentAssignee = members.find(
                        (member) => member.id === task.currentAssigneeId
                      );
                      const colors = currentAssignee
                        ? avatarColors[
                            members.findIndex((member) => member.id === currentAssignee.id) %
                              avatarColors.length
                          ]
                        : avatarColors[0];
                      const isOverdue =
                        Boolean(task.deadline) &&
                        task.deadline < todayDate &&
                        !["completed", "closed"].includes(task.status);

                      return (
                        <button
                          key={task.id}
                          className={`task-card task-card-${task.status}`}
                          onClick={() => onEditTask(task.id)}
                        >
                          <div className="task-card-topline">
                            <span className="task-key">{task.taskKey}</span>
                            <span className={`pill pill-${task.priority}`}>{task.priority}</span>
                          </div>

                          <div className="task-card-title">{task.title}</div>
                          <div className="task-card-description">{task.description}</div>

                          <div className="task-card-pills">
                            <span className="pill pill-type">{task.type}</span>
                            <span className="pill pill-type">{getStatusLabel(task.status)}</span>
                            {isOverdue ? <span className="pill pill-high">Overdue</span> : null}
                          </div>

                          <div className="task-card-meta">
                            <div>Dev: {getMemberName(members, task.assignedDeveloperId)}</div>
                            <div>QA: {getMemberName(members, task.assignedTesterId)}</div>
                            <div>Deadline: {task.deadline || "-"}</div>
                          </div>

                          <div className="task-card-footer">
                            {currentAssignee ? (
                              <span
                                className="member-avatar task-card-avatar"
                                style={getAvatarStyle(colors)}
                                title={currentAssignee.name}
                              >
                                {getInitials(currentAssignee.name)}
                              </span>
                            ) : (
                              <span className="task-card-avatar-placeholder" />
                            )}

                            <span className="task-card-time" suppressHydrationWarning>
                              Updated {formatTaskTime(task.updatedAt)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
