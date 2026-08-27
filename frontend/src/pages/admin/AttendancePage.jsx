import { useState, useEffect, useCallback } from "react";
import { Flame } from "lucide-react";
import apiClient from "../../api/client";
import TopNavBar from "../../components/TopNavBar";
import AttendanceHeatmap from "../../components/AttendanceHeatmap";
import { formatTime12Hour } from "../../utils/formatTime";

const NAV_LINKS = [
  { label: "Members", to: "/admin" },
  { label: "Attendance", to: "/admin/attendance" },
];

function AttendancePage() {
  const [members, setMembers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [shiftFilter, setShiftFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/admin/batches").then((response) => setBatches(response.data));
    apiClient.get("/admin/attendance/summary?days=91").then((response) => setSummaryData(response.data));
  }, []);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    const params = {};
    if (shiftFilter) params.shift = shiftFilter;
    if (batchFilter) params.batch_id = batchFilter;

    const response = await apiClient.get("/admin/attendance/members", { params });
    setMembers(response.data);
    setIsLoading(false);
  }, [shiftFilter, batchFilter]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleMarkPresentClick(member) {
    const currentTime24 = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await apiClient.post("/admin/attendance", { user_id: member.id, arrival_time: currentTime24 });
    loadMembers();
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar pageTitle="Attendance" navLinks={NAV_LINKS} />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-surface border border-border rounded-xl p-5 mb-6">
          <h2 className="text-sm text-ink-muted uppercase tracking-wide mb-3">Last 13 Weeks</h2>
          <AttendanceHeatmap summaryData={summaryData} />
          <p className="text-xs text-ink-muted mt-3 font-body normal-case">
            Hover a day to see the date and check-in count. Click a day to view and print that day's full sheet.
          </p>
        </div>

        <div className="flex gap-3 mb-4">
          <select
            value={shiftFilter}
            onChange={(event) => setShiftFilter(event.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
          >
            <option value="">All Shifts</option>
            <option value="morning">Morning (6–11 AM)</option>
            <option value="evening">Evening (4–11 PM)</option>
          </select>

          <select
            value={batchFilter}
            onChange={(event) => setBatchFilter(event.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
          >
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>{batch.name}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-ink-muted text-center py-10">Loading members...</div>
        ) : (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-ink-muted text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Batch</th>
                  <th className="text-left px-4 py-3">Streak</th>
                  <th className="text-left px-4 py-3">Today's Arrival</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border last:border-0 hover:bg-surface-hover">
                    <td className="px-4 py-3 text-ink font-medium">{member.name}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {member.batch_name ? `${member.batch_name} (${member.shift})` : "Unassigned"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          member.current_streak > 0 ? "text-warning" : "text-ink-muted"
                        }`}
                      >
                        <Flame size={14} />
                        {member.current_streak}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {member.today_arrival ? formatTime12Hour(member.today_arrival) : "Not arrived yet"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleMarkPresentClick(member)}
                        disabled={!!member.today_arrival}
                        className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {member.today_arrival ? "Marked" : "Mark Present"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default AttendancePage;