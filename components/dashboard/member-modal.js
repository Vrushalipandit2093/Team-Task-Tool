"use client";

import { useEffect, useState } from "react";
import { TEAM_ROLES } from "../../lib/constants";

const EMPTY_MEMBER = {
  name: "",
  email: "",
  role: "Developer",
};

export default function MemberModal({ isOpen, onClose, onSave }) {
  const [formState, setFormState] = useState(EMPTY_MEMBER);
  const [errorMessage, setErrorMessage] = useState("");

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
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formState.name.trim() || !formState.email.trim()) {
      setErrorMessage("Name and email are required");
      return;
    }

    setErrorMessage("");

    try {
      await onSave({
        name: formState.name.trim(),
        email: formState.email.trim(),
        role: formState.role,
      });
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
      <div className="modal-card modal-card-sm" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add team member</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field">
              <label>Full name *</label>
              <input
                autoFocus
                placeholder="Arjun Mehta"
                type="text"
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </div>

            <div className="field">
              <label>Work email *</label>
              <input
                placeholder="arjun@yourcompany.com"
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>

            <div className="field">
              <label>Role</label>
              <select
                value={formState.role}
                onChange={(event) => updateField("role", event.target.value)}
              >
                {TEAM_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            {errorMessage ? <div className="form-error">{errorMessage}</div> : null}
          </div>

          <div className="modal-footer">
            <div />
            <div className="modal-footer-actions">
              <button className="button button-ghost button-sm" type="button" onClick={onClose}>
                Cancel
              </button>
              <button className="button button-primary button-sm" type="submit">
                Add member
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
