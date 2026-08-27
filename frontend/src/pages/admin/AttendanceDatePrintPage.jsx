import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import apiClient from "../../api/client";
import { formatTime12Hour } from "../../utils/formatTime";

// A dedicated print-friendly page for one specific day's full
// attendance — reached by clicking a cell on the heatmap. The
// browser's own "Print" dialog lets the admin save it as a PDF.
function AttendanceDatePrintPage() {
  const { date } = useParams();
  const navigate = useNavigate();
  const [attendanceRows, setAttendanceRows] = useState([]);

  useEffect(() => {
    apiClient.get(`/admin/attendance/date/${date}`).then((response) => setAttendanceRows(response.data));
  }, [date]);

  const dateLabel = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background text-ink p-8 print:bg-white print:text-black">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={() => navigate("/admin/attendance")}
            className="flex items-center gap-2 text-ink-muted hover:text-ink text-sm"
          >
            <ArrowLeft size={16} /> Back to Attendance
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>

        <h1 className="text-2xl mb-1">A-1 Fitness Attendance Sheet</h1>
        <p className="text-ink-muted print:text-gray-600 mb-6 font-body normal-case">{dateLabel}</p>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border print:border-gray-400 text-left">
              <th className="py-2 pr-4">#</th>
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2">Arrival Time</th>
            </tr>
          </thead>
          <tbody>
            {attendanceRows.map((row, index) => (
              <tr key={row.id} className="border-b border-border print:border-gray-300">
                <td className="py-2 pr-4 text-ink-muted print:text-gray-600">{index + 1}</td>
                <td className="py-2 pr-4">{row.name}</td>
                <td className="py-2 pr-4 text-ink-muted print:text-gray-600">{row.email}</td>
                <td className="py-2">{formatTime12Hour(row.arrival_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {attendanceRows.length === 0 && (
          <p className="text-ink-muted text-center py-10">No attendance recorded for this date.</p>
        )}
      </div>
    </div>
  );
}

export default AttendanceDatePrintPage;