import { useNavigate } from "react-router-dom";

// A GitHub-style contribution heatmap: one column per week, one row
// per weekday, colored by how many members checked in that day.
// Hovering a cell shows the exact date via the browser's native
// tooltip (the "title" attribute) — no extra tooltip library needed.
function AttendanceHeatmap({ summaryData }) {
  const navigate = useNavigate();

  const countsByDate = Object.fromEntries(
    summaryData.map((entry) => [entry.date, entry.count])
  );
  const highestCount = Math.max(1, ...summaryData.map((entry) => entry.count));

  const totalDaysShown = 91;
  const today = new Date();
  const allDays = [];
  for (let i = totalDaysShown - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    allDays.push(day);
  }

  // Pad the start so the grid's first row aligns to Sunday, matching
  // the classic GitHub heatmap layout.
  const paddingCount = allDays[0].getDay();
  const paddedDays = [...Array(paddingCount).fill(null), ...allDays];

  const weekColumns = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weekColumns.push(paddedDays.slice(i, i + 7));
  }

  function toDateKey(date) {
    return date.toISOString().split("T")[0];
  }

  function getCellColorClass(count) {
  if (!count) return "bg-surface-hover";
  const intensity = count / highestCount;
  if (intensity > 0.75) return "bg-success";
  if (intensity > 0.5) return "bg-success/70";
  if (intensity > 0.25) return "bg-success/40";
  return "bg-success/20";
}

  function handleDayCellClick(date) {
    if (!date) return;
    navigate(`/admin/attendance/date/${toDateKey(date)}/print`);
  }

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weekColumns.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((date, dayIndex) => {
            if (!date) {
              return <div key={dayIndex} className="w-3 h-3" />;
            }

            const dateKey = toDateKey(date);
            const count = countsByDate[dateKey] || 0;
            const dateLabel = date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <button
                key={dayIndex}
                onClick={() => handleDayCellClick(date)}
                title={`${dateLabel} — ${count} check-in${count === 1 ? "" : "s"}`}
                className={`w-3 h-3 rounded-sm ${getCellColorClass(count)} hover:ring-1 hover:ring-ink transition-all`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default AttendanceHeatmap;