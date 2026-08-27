// A small colored badge, e.g. "PAID" in green or "UNPAID" in red.
// Centralizing this means every status badge in the app looks
// identical instead of being styled differently in each page.
function StatusPill({ label, tone = "neutral" }) {
  const toneStyles = {
    success: "bg-success/15 text-success border-success/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    danger: "bg-accent/15 text-accent border-accent/30",
    neutral: "bg-surface-hover text-ink-muted border-border",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${toneStyles[tone]}`}
    >
      {label}
    </span>
  );
}

export default StatusPill;