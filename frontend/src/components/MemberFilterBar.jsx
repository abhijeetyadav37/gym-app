import { Filter } from "lucide-react";

// Controlled filter dropdowns — each change calls onFilterChange,
// which the parent uses to re-fetch the member list from the backend.
// Filtering server-side (not just in the browser) keeps this fast
// even as the member list grows large.
function MemberFilterBar({ filters, onFilterChange, batches }) {
  function updateFilter(key, value) {
    onFilterChange({ ...filters, [key]: value });
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-ink-muted text-sm mr-2">
        <Filter size={16} />
        Filters
      </div>

      <select
        value={filters.shift}
        onChange={(event) => updateFilter("shift", event.target.value)}
        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
      >
        <option value="">All Shifts</option>
        <option value="morning">Morning (6–11 AM)</option>
        <option value="evening">Evening (4–11 PM)</option>
      </select>

      <select
        value={filters.batch_id}
        onChange={(event) => updateFilter("batch_id", event.target.value)}
        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
      >
        <option value="">All Batches</option>
        {batches.map((batch) => (
          <option key={batch.id} value={batch.id}>{batch.name}</option>
        ))}
      </select>

      <select
        value={filters.plan_type}
        onChange={(event) => updateFilter("plan_type", event.target.value)}
        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
      >
        <option value="">All Plans</option>
        <option value="1_month">1 Month</option>
        <option value="3_month">3 Month</option>
      </select>

      <select
        value={filters.payment_status}
        onChange={(event) => updateFilter("payment_status", event.target.value)}
        className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
      >
        <option value="">All Payment Status</option>
        <option value="paid">Paid</option>
        <option value="unpaid">Unpaid</option>
      </select>
    </div>
  );
}

export default MemberFilterBar;