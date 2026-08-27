import { Users, CheckCircle, AlertCircle, Clock } from "lucide-react";

// Quick-glance counts at the top of the admin dashboard — computed
// from the member list we already fetched, so no extra API call needed.
function AdminStatsBar({ members }) {
  const totalMembers = members.length;
  const paidCount = members.filter((member) => member.payment_status === "paid").length;
  const unpaidCount = members.filter((member) => member.payment_status === "unpaid").length;

  const expiringSoonCount = members.filter((member) => {
    if (!member.end_date) return false;
    const daysRemaining = Math.ceil(
      (new Date(member.end_date) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return daysRemaining <= 5 && daysRemaining >= 0;
  }).length;

  const statCards = [
    { label: "Total Members", value: totalMembers, icon: Users, tone: "text-ink" },
    { label: "Paid", value: paidCount, icon: CheckCircle, tone: "text-success" },
    { label: "Unpaid", value: unpaidCount, icon: AlertCircle, tone: "text-accent" },
    { label: "Expiring Soon", value: expiringSoonCount, icon: Clock, tone: "text-warning" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <div key={stat.label} className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-ink-muted text-xs uppercase tracking-wide">{stat.label}</p>
            <stat.icon className={stat.tone} size={16} />
          </div>
          <p className={`text-2xl font-heading ${stat.tone}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}

export default AdminStatsBar;