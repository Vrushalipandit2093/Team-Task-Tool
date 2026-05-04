"use client";

import { useState } from "react";

const EMPTY_FORM = {
  email: "",
};

export default function MemberLoginScreen({
  adminConfigured,
  onAdminLogin,
  onMemberLogin,
}) {
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!formState.email.trim()) {
      setErrorMessage("Work email is required");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onMemberLogin({
        email: formState.email.trim(),
      });
      setFormState(EMPTY_FORM);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-kicker">Team Task Manager</div>
        <h1 className="login-title">Developer and tester sign in</h1>
        <p className="login-copy">
          Use your work email to open the task board. Developers can assign work to
          testers, testers can assign tickets back to developers, and done tasks are
          controlled by testers or admins.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Work email</label>
            <input
              autoFocus
              placeholder="name@yourcompany.com"
              type="email"
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({ ...current, email: event.target.value }))
              }
            />
          </div>

          {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

          <button className="button button-primary login-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-divider" />

        <div className="login-admin-row">
          <span className="login-admin-copy">
            {adminConfigured ? "Need admin access?" : "Admin login is not configured yet."}
          </span>
          {adminConfigured ? (
            <button className="button button-ghost button-sm" onClick={onAdminLogin} type="button">
              Admin login
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
