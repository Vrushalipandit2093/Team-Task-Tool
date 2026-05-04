import { REPORT_CARDS } from "../../lib/constants";

export default function StatsBar({ stats }) {
  return (
    <div className="stats-grid stats-grid-expanded">
      {REPORT_CARDS.map((item) => (
        <div key={item.key} className={`stat-card stat-${item.tone}`}>
          <div className="stat-number">{stats[item.key] || 0}</div>
          <div className="stat-label">{item.label}</div>
          <div className="stat-line" />
        </div>
      ))}
    </div>
  );
}
