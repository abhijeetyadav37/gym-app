import { Flame } from "lucide-react";
import MyAttendanceHeatmap from "./MyAttendanceHeatmap";

function MyAttendanceCard({ currentStreak, summaryData }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base text-ink">My Attendance</h2>
        <span
          className={`flex items-center gap-1 font-semibold text-sm ${
            currentStreak > 0 ? "text-warning" : "text-ink-muted"
          }`}
        >
          <Flame size={16} />
          {currentStreak} day{currentStreak === 1 ? "" : "s"} streak
        </span>
      </div>

      <MyAttendanceHeatmap summaryData={summaryData} />

      <p className="text-xs text-ink-muted mt-3 font-body normal-case">
        Last 13 weeks of check-ins.
      </p>
    </div>
  );
}

export default MyAttendanceCard;