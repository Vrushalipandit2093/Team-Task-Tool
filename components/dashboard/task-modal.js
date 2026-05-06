"use client";

import { useEffect, useState } from "react";
import {
  PRIORITY_OPTIONS,
  STATUS_COLUMNS,
  TASK_TYPES,
} from "../../lib/constants";
import {
  canCloseTasks,
  canCreateTasks,
  canDeleteTasks,
} from "../../lib/shared/access";

function getInitialFormState(defaultDate, modalState, currentUser, accessRole) {
  const task = modalState.task;

  let defaultAssignedDeveloperId = task?.assignedDeveloperId || "";
  if (!task && accessRole === "developer") {
    defaultAssignedDeveloperId = currentUser.id;
  }

  return {
    id: task?.id || "",
    taskKey: task?.taskKey || "",
    title: task?.title || "",
    description: task?.description || "",
    assignedDeveloperId: defaultAssignedDeveloperId,
    assignedTesterId: task?.assignedTesterId || "",
    deadline: task?.deadline || defaultDate,
    type: task?.type || "Feature",
    priority: task?.priority || "med",
    status: task?.status || "pending",
    commentForDelay: "",
  };
}

function getAllowedStatuses(accessRole, taskStatus) {
  if (accessRole === "admin") {
    return STATUS_COLUMNS.filter(
      (status) => status.id !== "closed" || taskStatus === "completed" || taskStatus === "closed"
    );
  }

  if (accessRole === "developer") {
    return STATUS_COLUMNS.filter((status) =>
      ["pending", "inprogress", "readyfortesting", "reopened"].includes(status.id)
    );
  }

  if (accessRole === "tester") {
    return STATUS_COLUMNS.filter((status) =>
      ["readyfortesting", "testing", "completed", "reopened"].includes(status.id)
    );
  }

  return [];
}

export default function TaskModal({
  accessRole,
  currentUser,
  defaultDate,
  developers,
  isOpen,
  onAddComment,
  onClose,
  onDelete,
  onSave,
  task,
  testers,
}) {
  const [formState, setFormState] = useState(
    getInitialFormState(defaultDate, { task }, currentUser, accessRole)
  );
  const [commentText, setCommentText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isEditing = Boolean(task);
  const canCreate = canCreateTasks(accessRole);
  const canDelete = canDeleteTasks(accessRole);
  const canClose = canCloseTasks(accessRole);
  const allowedStatuses = getAllowedStatuses(accessRole, task?.status);
  const canEditStructure = accessRole === "admin" || accessRole === "developer" || !isEditing;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [defaultDate, isOpen, onClose, task]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formState.title.trim()) {
      setErrorMessage("Task title is required");
      return;
    }

    if (!formState.description.trim()) {
      setErrorMessage("Task description is required");
      return;
    }

    if (!formState.assignedDeveloperId) {
      setErrorMessage("Assigned developer is required");
      return;
    }

    if (!formState.assignedTesterId) {
      setErrorMessage("Assigned tester is required");
      return;
    }

    if (!formState.deadline) {
      setErrorMessage("Deadline is required");
      return;
    }

    if (formState.status === "closed" && !canClose) {
      setErrorMessage("Only admin can close tasks");
      return;
    }

    try {
      await onSave(
        {
          title: formState.title.trim(),
          description: formState.description.trim(),
          assignedDeveloperId: formState.assignedDeveloperId,
          assignedTesterId: formState.assignedTesterId,
          deadline: formState.deadline,
          priority: formState.priority,
          type: formState.type,
          status: formState.status,
          commentForDelay: formState.commentForDelay.trim(),
        },
        formState.id
      );
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  async function handleCommentSubmit(event) {
    event.preventDefault();

    if (!commentText.trim()) {
      return;
    }

    try {
      await onAddComment(task.id, commentText.trim());
      setCommentText("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  function updateField(key, value) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-title">{isEditing ? "Task details" : "Create task"}</span>
            {formState.taskKey ? <div className="board-subtitle">{formState.taskKey}</div> : null}
          </div>
          <button className="modal-close" onClick={onClose}>
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body modal-body-grid">
            <div>
              <div className="field">
                <label>Title *</label>
                <input
                  autoFocus
                  disabled={isEditing && !canEditStructure}
                  type="text"
                  value={formState.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
              </div>

              <div className="field">
                <label>Description *</label>
                <textarea
                  disabled={isEditing && !canEditStructure}
                  value={formState.description}
                  onChange={(event) => updateField("description", event.target.value)}
                />
              </div>

              <div className="field-grid field-grid-2">
                <div className="field">
                  <label>Developer *</label>
                  <select
                    disabled={!canEditStructure || accessRole === "developer"}
                    value={formState.assignedDeveloperId}
                    onChange={(event) => updateField("assignedDeveloperId", event.target.value)}
                  >
                    <option value="">Select developer</option>
                    {developers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Tester *</label>
                  <select
                    disabled={!canEditStructure}
                    value={formState.assignedTesterId}
                    onChange={(event) => updateField("assignedTesterId", event.target.value)}
                  >
                    <option value="">Select tester</option>
                    {testers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field-grid field-grid-3">
                <div className="field">
                  <label>Priority</label>
                  <select
                    disabled={!canEditStructure}
                    value={formState.priority}
                    onChange={(event) => updateField("priority", event.target.value)}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Type</label>
                  <select
                    disabled={!canEditStructure}
                    value={formState.type}
                    onChange={(event) => updateField("type", event.target.value)}
                  >
                    {TASK_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Deadline</label>
                  <input
                    disabled={!canEditStructure}
                    type="date"
                    value={formState.deadline}
                    onChange={(event) => updateField("deadline", event.target.value)}
                  />
                </div>
              </div>

              <div className="field-grid field-grid-2">
                <div className="field">
                  <label>Status</label>
                  <select
                    value={formState.status}
                    onChange={(event) => updateField("status", event.target.value)}
                  >
                    {allowedStatuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Update comment</label>
                  <input
                    placeholder="Delay reason, handoff note, test result..."
                    value={formState.commentForDelay}
                    onChange={(event) => updateField("commentForDelay", event.target.value)}
                  />
                </div>
              </div>

              {errorMessage ? <div className="form-error">{errorMessage}</div> : null}
            </div>

            <div className="task-detail-column">
              <div className="task-detail-section">
                <div className="sidebar-label">Workflow notes</div>
                <div className="member-role">
                  Signed in as {currentUser.name} ({currentUser.role})
                </div>
                <div className="member-role">
                  Admins and Developers can create tasks. Admin can reassign and close tasks. Developers move work to Ready for
                  Testing. Testers move work to Testing, Completed, or Reopen.
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="task-detail-section">
                    <div className="sidebar-label">Comments</div>
                    <div className="timeline-list">
                      {task.comments?.length ? (
                        task.comments
                          .slice()
                          .reverse()
                          .map((comment) => (
                            <div key={comment.id} className="timeline-item">
                              <div className="timeline-title">
                                {comment.authorName} ({comment.authorRole})
                              </div>
                              <div className="timeline-copy">{comment.body}</div>
                              <div className="timeline-time">{comment.createdAt}</div>
                            </div>
                          ))
                      ) : (
                        <div className="member-role">No comments yet.</div>
                      )}
                    </div>

                    <div className="comment-form-container">
                      <div className="field">
                        <label>Add comment</label>
                        <textarea
                          placeholder="Add update, blocker, delay, or QA note..."
                          value={commentText}
                          onChange={(event) => setCommentText(event.target.value)}
                        />
                      </div>
                      <button className="button button-ghost button-sm" type="button" onClick={handleCommentSubmit}>
                        Add comment
                      </button>
                    </div>
                  </div>

                  <div className="task-detail-section">
                    <div className="sidebar-label">Activity log</div>
                    <div className="timeline-list">
                      {task.activityLog?.length ? (
                        task.activityLog
                          .slice()
                          .reverse()
                          .map((entry) => (
                            <div key={entry.id} className="timeline-item">
                              <div className="timeline-title">{entry.message}</div>
                              <div className="timeline-time">
                                {entry.actorName} | {entry.createdAt}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="member-role">No activity yet.</div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="modal-footer">
            <div>
              {isEditing && canDelete ? (
                <button className="button button-danger button-sm" type="button" onClick={() => onDelete(task.id)}>
                  Delete
                </button>
              ) : null}
            </div>

            <div className="modal-footer-actions">
              <button className="button button-ghost button-sm" type="button" onClick={onClose}>
                Cancel
              </button>
              {isEditing || canCreate ? (
                <button className="button button-primary button-sm" type="submit">
                  Save task
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
