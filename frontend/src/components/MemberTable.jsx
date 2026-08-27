import { Settings, Trash2 } from "lucide-react";
import StatusPill from "./StatusPill";

function MemberTable({ members, onManageClick, onRemoveClick }) {
  if (members.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-10 text-center text-ink-muted">
        No members match these filters.
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-ink-muted text-xs uppercase tracking-wide">
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Email</th>
            <th className="text-left px-4 py-3">Batch</th>
            <th className="text-left px-4 py-3">Plan</th>
            <th className="text-left px-4 py-3">Payment</th>
            <th className="text-left px-4 py-3">Expires</th>
            <th className="text-right px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
              <td className="px-4 py-3 text-ink font-medium">{member.name}</td>
              <td className="px-4 py-3 text-ink-muted">{member.email}</td>
              <td className="px-4 py-3 text-ink-muted">
                {member.batch_name ? `${member.batch_name} (${member.shift})` : "Unassigned"}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {member.plan_type === "1_month" ? "1 Month" : member.plan_type === "3_month" ? "3 Month" : "—"}
              </td>
              <td className="px-4 py-3">
                {member.payment_status ? (
                  <StatusPill
                    label={member.payment_status}
                    tone={member.payment_status === "paid" ? "success" : "danger"}
                  />
                ) : (
                  <StatusPill label="no plan" tone="neutral" />
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {member.end_date
                  ? new Date(member.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onManageClick(member)}
                    className="p-2 rounded-lg hover:bg-surface text-ink-muted hover:text-accent transition-colors"
                    aria-label={`Manage ${member.name}`}
                    title="Manage batch, plan & workout"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => onRemoveClick(member)}
                    className="p-2 rounded-lg hover:bg-surface text-ink-muted hover:text-accent transition-colors"
                    aria-label={`Remove ${member.name}`}
                    title="Remove member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MemberTable;