import { CreditCard, Calendar } from "lucide-react";
import StatusPill from "./StatusPill";

// Shows the member's current plan, price, expiry date, and payment
// status — with the expiry date highlighted in warning color if
// it's within the next 5 days.
function MembershipStatusCard({ membership }) {
  if (!membership) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6">
        <p className="text-ink-muted">
          No active membership yet. Please contact the gym front desk.
        </p>
      </div>
    );
  }

  const endDate = new Date(membership.end_date);
  const today = new Date();
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysRemaining <= 5 && daysRemaining >= 0;

  const planLabel = membership.plan_type === "1_month" ? "1 Month Plan" : "3 Month Plan";

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="text-accent" size={20} />
          <h2 className="text-base text-ink">Membership</h2>
        </div>
        <StatusPill
          label={membership.payment_status}
          tone={membership.payment_status === "paid" ? "success" : "danger"}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-ink-muted mb-1">Plan</p>
          <p className="text-ink font-semibold">{planLabel}</p>
        </div>
        <div>
          <p className="text-ink-muted mb-1">Price</p>
          <p className="text-ink font-semibold">₹{membership.price}</p>
        </div>
        <div className="col-span-2">
          <p className="text-ink-muted mb-1 flex items-center gap-1">
            <Calendar size={14} /> Expires on
          </p>
          <p className={`font-semibold ${isExpiringSoon ? "text-warning" : "text-ink"}`}>
            {endDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            {isExpiringSoon && ` — ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} left`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MembershipStatusCard;