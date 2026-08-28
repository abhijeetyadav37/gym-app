import { useState } from "react";
import { CalendarX } from "lucide-react";
import Modal from "./Modal";

// A tappable stat card showing how many days the member has missed
// since they joined (or the last 91 days, whichever is shorter).
// Clicking it opens the exact list of missed dates.
function MyAbsenceBoard({ summaryData, accountCreatedAt }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const attendedDates = new Set(summaryData.map((entry) => entry.date));

  const today = new Date();
  const ninetyOneDaysAgo = new Date(today);
  ninetyOneDaysAgo.setDate(today.getDate() - 90);

  const accountCreatedDate = accountCreatedAt ? new Date(accountCreatedAt) : ninetyOneDaysAgo;
  const windowStart = accountCreatedDate > ninetyOneDaysAgo ? accountCreatedDate : ninetyOneDaysAgo;

  const absentDates = [];
  for (let cursor = new Date(windowStart); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const dateKey = cursor.toISOString().split("T")[0];
    if (!attendedDates.has(dateKey)) {
      absentDates.push(dateKey);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-surface border border-border rounded-xl p-4 flex items-center justify-between w-full hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <CalendarX className="text-accent" size={18} />
          <span className="text-sm text-ink-muted">Days Absent</span>
        </div>
        <span className="text-xl font-heading text-accent">{absentDates.length}</span>
      </button>

      {isModalOpen && (
        <Modal title="Absent Days" onClose={() => setIsModalOpen(false)}>
          {absentDates.length === 0 ? (
            <p className="text-ink-muted text-sm">No absences — perfect record!</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1">
              {absentDates.slice().reverse().map((dateKey) => (
                <div key={dateKey} className="text-sm text-ink border-b border-border last:border-0 py-2">
                  {new Date(dateKey).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

export default MyAbsenceBoard;