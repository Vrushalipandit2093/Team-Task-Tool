import { getInitials } from "../../lib/client/format";

function getAvatarStyle(colors) {
  return {
    background: colors.bg,
    color: colors.color,
    borderColor: colors.border,
  };
}

export default function TeamSidebar({
  avatarColors,
  date,
  members,
  selectedMember,
  selectedMemberId,
  tasks,
  onSelectMember,
  onDeleteMember,
  isAdmin,
}) {
  return (
    <aside className="team-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-label">Team</div>

        <button
          className={`all-members-button ${!selectedMemberId ? "is-active" : ""}`}
          onClick={() => onSelectMember(null)}
        >
          <span className="all-members-dot" />
          All members
        </button>
      </div>

      <div className="member-list">
        {members.map((member, index) => {
          const colors = avatarColors[index % avatarColors.length];
          const memberTasks = tasks.filter(
            (task) =>
              [task.assignedDeveloperId, task.assignedTesterId, task.currentAssigneeId].includes(
                member.id
              ) && (!date || task.deadline === date)
          );
          const openCount = memberTasks.filter(
            (task) => !["completed", "closed"].includes(task.status)
          ).length;

          return (
            <button
              key={member.id}
              className={`member-list-item ${selectedMemberId === member.id ? "is-active" : ""}`}
              onClick={() => onSelectMember(member.id)}
            >
              <span className="member-avatar member-avatar-sm" style={getAvatarStyle(colors)}>
                {getInitials(member.name)}
              </span>

              <span className="member-meta">
                <span className="member-name">{member.name}</span>
                <span className="member-role">{member.role}</span>
              </span>

              <span
                className={`member-badge ${selectedMemberId === member.id ? "member-badge-active" : ""}`}
              >
                {openCount}/{memberTasks.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="member-detail-panel">
        {selectedMember ? (
          <SelectedMemberPanel
            avatarColors={avatarColors}
            date={date}
            member={selectedMember}
            members={members}
            tasks={tasks}
            onDeleteMember={onDeleteMember}
            isAdmin={isAdmin}
          />
        ) : (
          <div className="empty-member-detail">
            <div className="member-detail-role">Select a team member to see workload.</div>
          </div>
        )}
      </div>
    </aside>
  );
}

function SelectedMemberPanel({
  avatarColors,
  date,
  member,
  members,
  tasks,
  onDeleteMember,
  isAdmin,
}) {
  const avatarIndex = members.findIndex((item) => item.id === member.id);
  const colors = avatarColors[avatarIndex % avatarColors.length];
  const memberTasks = tasks.filter(
    (task) =>
      [task.assignedDeveloperId, task.assignedTesterId, task.currentAssigneeId].includes(member.id) &&
      (!date || task.deadline === date)
  );
  const closedCount = memberTasks.filter((task) => task.status === "closed").length;
  const activeCount = memberTasks.filter(
    (task) => !["completed", "closed"].includes(task.status)
  ).length;
  const progress = memberTasks.length
    ? Math.round((closedCount / memberTasks.length) * 100)
    : 0;

  return (
    <div>
      <div className="member-detail-header">
        <span className="member-avatar member-avatar-lg" style={getAvatarStyle(colors)}>
          {getInitials(member.name)}
        </span>

        <div className="member-detail-copy">
          <div className="member-detail-name">{member.name}</div>
          <div className="member-detail-role">{member.role}</div>
          <div className="member-detail-email" title={member.email}>
            {member.email}
          </div>
          {isAdmin ? (
            <button 
              className="button button-danger button-sm" 
              style={{ marginTop: '8px' }}
              onClick={() => onDeleteMember(member.id)}
            >
              Delete Member
            </button>
          ) : null}
        </div>
      </div>

      <div className="member-stat-grid">
        <div className="member-stat-card member-stat-violet">
          <div className="member-stat-value">{activeCount}</div>
          <div className="member-stat-label">Open</div>
        </div>

        <div className="member-stat-card member-stat-green">
          <div className="member-stat-value">{closedCount}</div>
          <div className="member-stat-label">Closed</div>
        </div>
      </div>

      <div className="progress-meta">
        <span>Completion</span>
        <span>{progress}%</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
