import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Printer, UserPlus } from "lucide-react";
import apiClient from "../../api/client";
import TopNavBar from "../../components/TopNavBar";
import AdminStatsBar from "../../components/AdminStatsBar";
import MemberFilterBar from "../../components/MemberFilterBar";
import MemberTable from "../../components/MemberTable";
import ManageMemberModal from "../../components/ManageMemberModal";
import CreateBatchModal from "../../components/CreateBatchModal";
import AddMemberModal from "../../components/AddMemberModal";

function AdminDashboard() {
  const [members, setMembers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({

    
    shift: "",
    batch_id: "",
    plan_type: "",
    payment_status: "",
  });

  const navLinks = [
  { label: "Members", to: "/admin" },
  { label: "Attendance", to: "/admin/attendance" },
];

  const [memberBeingManaged, setMemberBeingManaged] = useState(null);
  const [isCreateBatchModalOpen, setIsCreateBatchModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const loadBatches = useCallback(async () => {
    const response = await apiClient.get("/admin/batches");
    setBatches(response.data);
  }, []);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    const activeParams = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== "")
    );
    const response = await apiClient.get("/admin/members", { params: activeParams });
    setMembers(response.data);
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleRemoveClick(member) {
    const isConfirmed = window.confirm(`Remove ${member.name} from the gym? This cannot be undone.`);
    if (!isConfirmed) return;

    await apiClient.delete(`/admin/members/${member.id}`);
    loadMembers();
  }

  // Marks the member present right now, using the current clock time —
  // this is the day-to-day "front desk" action the admin will use most.
  async function handleMarkPresentClick(member) {
    const currentTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await apiClient.post("/admin/attendance", {
      user_id: member.id,
      arrival_time: currentTime,
    });
  }

  function handleMemberSaved() {
    setMemberBeingManaged(null);
    loadMembers();
  }

  function handleBatchCreated() {
    setIsCreateBatchModalOpen(false);
    loadBatches();
  }

  function handleMemberCreated() {
    setIsAddMemberModalOpen(false);
    loadMembers();
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar pageTitle="Admin Dashboard" navLinks={navLinks} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AdminStatsBar members={members} />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <MemberFilterBar filters={filters} onFilterChange={setFilters} batches={batches} />

          <div className="flex gap-2">
            <button
              onClick={() => setIsAddMemberModalOpen(true)}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <UserPlus size={16} /> Add Member
            </button>

            <button
              onClick={() => setIsCreateBatchModalOpen(true)}
              className="flex items-center gap-2 bg-surface border border-border hover:bg-surface-hover text-ink px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Plus size={16} /> New Batch
            </button>

            {filters.batch_id && (
              <Link
                to={`/admin/batches/${filters.batch_id}/print`}
                target="_blank"
                className="flex items-center gap-2 bg-surface border border-border hover:bg-surface-hover text-ink px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <Printer size={16} /> Print Batch Sheet
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-ink-muted text-center py-10">Loading members...</div>
        ) : (
          <MemberTable
            members={members}
            onManageClick={setMemberBeingManaged}
            onRemoveClick={handleRemoveClick}
            onMarkPresentClick={handleMarkPresentClick}
          />
        )}
      </main>

      {memberBeingManaged && (
        <ManageMemberModal
          member={memberBeingManaged}
          batches={batches}
          onClose={() => setMemberBeingManaged(null)}
          onSaved={handleMemberSaved}
        />
      )}

      {isCreateBatchModalOpen && (
        <CreateBatchModal
          onClose={() => setIsCreateBatchModalOpen(false)}
          onCreated={handleBatchCreated}
        />
      )}

      {isAddMemberModalOpen && (
        <AddMemberModal
          batches={batches}
          onClose={() => setIsAddMemberModalOpen(false)}
          onCreated={handleMemberCreated}
        />
      )}
    </div>
  );
}

export default AdminDashboard;