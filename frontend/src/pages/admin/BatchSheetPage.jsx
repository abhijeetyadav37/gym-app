import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Printer, ArrowLeft } from "lucide-react";
import apiClient from "../../api/client";
import { formatTime12Hour } from "../../utils/formatTime";

// A dedicated, print-friendly page — separate from the dashboard
// layout entirely, so when the admin hits Ctrl+P, it doesn't print
// the nav bar, filters, or stats — just the clean member sheet.
function BatchSheetPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [sheetRows, setSheetRows] = useState([]);
  const [batchInfo, setBatchInfo] = useState(null);

  useEffect(() => {
    loadSheet();
  }, [batchId]);

  async function loadSheet() {
    const [sheetResponse, batchesResponse] = await Promise.all([
      apiClient.get(`/admin/batches/${batchId}/sheet`),
      apiClient.get("/admin/batches"),
    ]);

    setSheetRows(sheetResponse.data);
    setBatchInfo(batchesResponse.data.find((batch) => String(batch.id) === batchId));
  }

  const todayLabel = new Date().toLocaleDateString("en-IN", {
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
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-ink-muted hover:text-ink text-sm"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <Printer size={16} /> Print Sheet
          </button>
        </div>

        <h1 className="text-2xl mb-1">{batchInfo?.name || "Batch"}</h1>
        <p className="text-ink-muted print:text-gray-600 mb-6 font-body normal-case">
          {batchInfo?.shift === "morning" ? "Morning Shift (6–11 AM)" : "Evening Shift (4–11 PM)"} — {todayLabel}
        </p>

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
            {sheetRows.map((row, index) => (
              <tr key={row.id} className="border-b border-border print:border-gray-300">
                <td className="py-2 pr-4 text-ink-muted print:text-gray-600">{index + 1}</td>
                <td className="py-2 pr-4">{row.name}</td>
                <td className="py-2 pr-4 text-ink-muted print:text-gray-600">{row.email}</td>
                <td className="py-2">{formatTime12Hour(row.arrival_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BatchSheetPage;