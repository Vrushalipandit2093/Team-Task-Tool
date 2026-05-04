import { PRIORITY_OPTIONS, STATUS_COLUMNS } from "../../lib/constants";

export default function BoardToolbar({
  canAddTask,
  currentUserRole,
  filters,
  members,
  onAddTask,
  onFilterChange,
  onResetFilters,
}) {
  return (
    <div className="board-toolbar board-toolbar-stack">
      <div>
        <div className="board-title">{currentUserRole} workspace</div>
        <div className="board-subtitle">
          Filter tasks by status, priority, owner, or search by title and task ID.
        </div>
      </div>

      <div className="toolbar-grid">
        <input
          placeholder="Search task ID, title, description..."
          type="search"
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
        />

        <select
          value={filters.status}
          onChange={(event) => onFilterChange("status", event.target.value)}
        >
          <option value="">All status</option>
          {STATUS_COLUMNS.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(event) => onFilterChange("priority", event.target.value)}
        >
          <option value="">All priority</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>

        <select
          value={filters.memberId}
          onChange={(event) => onFilterChange("memberId", event.target.value)}
        >
          <option value="">All members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>

        <input
          className="date-input"
          type="date"
          value={filters.date}
          onChange={(event) => onFilterChange("date", event.target.value)}
        />

        <div className="board-toolbar-actions">
          <button className="button button-ghost button-sm" onClick={onResetFilters}>
            Reset
          </button>
          <button
            className="button button-primary button-sm"
            disabled={canAddTask === false}
            onClick={onAddTask}
          >
            + Create task
          </button>
        </div>
      </div>
    </div>
  );
}
