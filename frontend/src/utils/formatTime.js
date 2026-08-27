// Converts a 24-hour time string like "06:45" or "06:45:00" (what
// Postgres TIME returns) into a friendly 12-hour format: "6:45 AM".
// Centralized here so every screen displays time identically.
export function formatTime12Hour(time24) {
  if (!time24) return "—";

  const [hourText, minuteText] = time24.split(":");
  let hour = parseInt(hourText, 10);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return `${hour}:${minuteText} ${period}`;
}