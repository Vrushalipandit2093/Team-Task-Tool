"use client";

import { useState } from "react";

const EMPTY_FORM = {
  email: "",
  password: "",
};

export default function AdminLoginModal({ isOpen, onClose, onLogin }) {
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) {
    return null;
  }

  function updateField(key, value) {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formState.email.trim() || !formState.password) {
      setErrorMessage("Admin email and password are required");
      return;
    }

    setErrorMessage("");

    try {
      await onLogin({
        email: formState.email.trim(),
        password: formState.password,
      });
      setFormState(EMPTY_FORM);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-sm" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Admin login</span>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field">
              <label>Admin email</label>
              <input
                autoFocus
                type="email"
                value={formState.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                value={formState.password}
                onChange={(event) => updateField("password", event.target.value)}
              />
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
                Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
