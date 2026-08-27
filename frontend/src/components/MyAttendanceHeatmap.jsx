// A simplified, view-only version of the admin heatmap — no click
// action (a member doesn't need to "print their own day"), and each
// cell is just attended/not-attended since this is one person's data.
function MyAttendanceHeatmap({ summaryData }) {
  const attendedDates = new Set(summaryData.map((entry) => entry.date));

  const totalDaysShown = 91;
  const today = new Date();
  const allDays = [];
  for (let i = totalDaysShown - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    allDays.push(day);
  }

  const paddingCount = allDays[0].getDay();
  const paddedDays = [...Array(paddingCount).fill(null), ...allDays];

  const weekColumns = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    weekColumns.push(paddedDays.slice(i, i + 7));
  }

  function toDateKey(date) {
    return date.toISOString().split("T")[0];
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
            const didAttend = attendedDates.has(dateKey);
            const dateLabel = date.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={dayIndex}
                title={`${dateLabel} — ${didAttend ? "Attended" : "No visit"}`}
                className={`w-3 h-3 rounded-sm ${didAttend ? "bg-success" : "bg-surface-hover"}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default MyAttendanceHeatmap;