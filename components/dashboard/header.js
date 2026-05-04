export default function AppHeader({
  adminConfigured,
  adminEmail,
  currentUserName,
  currentUserRole,
  isAdminAuthenticated,
  isMemberAuthenticated,
  isSendingReminders,
  onAdminLogin,
  onAdminLogout,
  onMemberLogout,
  onAddMember,
  onRunDailyAutomation,
  onRunEveningAutomation,
  onRunOverdueAlerts,
}) {
  const showAdminActions = isAdminAuthenticated;

  return (
    <header className="app-header app-header-lg">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" opacity=".9" />
            <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" opacity=".6" />
            <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" opacity=".6" />
            <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" opacity=".3" />
          </svg>
        </div>

        <div>
          <div className="brand-text">team-tasks</div>
          <div className="board-subtitle">Role-based workflow for Admin, Developer, and QA</div>
        </div>
      </div>

      <div className="header-actions header-actions-wrap">
        {isMemberAuthenticated ? (
          <>
            <span className="admin-chip">
              {currentUserName} ({currentUserRole})
            </span>
            <button className="button button-ghost button-sm" onClick={onMemberLogout}>
              Sign out
            </button>
          </>
        ) : null}

        {adminConfigured ? (
          isAdminAuthenticated ? (
            <>
              <span className="admin-chip">Admin: {adminEmail}</span>
              <button className="button button-ghost button-sm" onClick={onAdminLogout}>
                Admin logout
              </button>
            </>
          ) : (
            <button className="button button-ghost button-sm" onClick={onAdminLogin}>
              Admin login
            </button>
          )
        ) : (
          <span className="admin-chip admin-chip-warning">Admin not configured</span>
        )}

        {showAdminActions ? (
          <>
            <button className="button button-ghost button-sm" onClick={onAddMember}>
              + User
            </button>
            <button
              className="button button-ghost button-sm"
              disabled={isSendingReminders}
              onClick={onRunOverdueAlerts}
            >
              Overdue Alerts
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}
