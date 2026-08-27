import { useState } from "react";
import { Dumbbell } from "lucide-react";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTodayName() {
  return DAYS_OF_WEEK[(new Date().getDay() + 6) % 7]; // JS Sunday=0 -> shift so Monday=0
}

// A day-tab switcher (Mon–Sun) showing that day's exercise plan.
// Opens on today's day by default so the member sees what's
// relevant right now without extra clicks.
function ExerciseWeekView({ exerciseSchedule }) {
  const [selectedDay, setSelectedDay] = useState(getTodayName());

  const scheduleForSelectedDay = exerciseSchedule.find(
    (item) => item.day_of_week === selectedDay
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell className="text-accent" size={20} />
        <h2 className="text-base text-ink">Weekly Exercise Plan</h2>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = day === selectedDay;
          const isToday = day === getTodayName();

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                isSelected
                  ? "bg-accent text-white"
                  : "bg-background text-ink-muted hover:text-ink border border-border"
              }`}
            >
              {day.slice(0, 3)}
              {isToday && <span className="ml-1">•</span>}
            </button>
          );
        })}
      </div>

      {scheduleForSelectedDay ? (
        <p className="text-ink text-sm leading-relaxed whitespace-pre-line">
          {scheduleForSelectedDay.exercise_details}
        </p>
      ) : (
        <p className="text-ink-muted text-sm">Rest day — no exercises scheduled.</p>
      )}
    </div>
  );
}

export default ExerciseWeekView;