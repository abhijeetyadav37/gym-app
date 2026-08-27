import { useState, useEffect } from "react";
import apiClient from "../api/client";
import Modal from "./Modal";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Manage a single member: which batch they're in, their membership
// plan/payment, and their personal weekly workout plan — the workout
// text here is unique to this member and only visible to them (via
// their own dashboard) and to the admin (here).
function ManageMemberModal({ member, batches, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState("plan"); // "plan" or "workout"

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedPlanType, setSelectedPlanType] = useState("1_month");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("paid");

  const [workoutByDay, setWorkoutByDay] = useState(
    Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, ""]))
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadExistingWorkout();
  }, [member.id]);

  async function loadExistingWorkout() {
    const response = await apiClient.get(`/admin/members/${member.id}/exercises`);
    const existingByDay = Object.fromEntries(DAYS_OF_WEEK.map((day) => [day, ""]));

    response.data.forEach((entry) => {
      existingByDay[entry.day_of_week] = entry.exercise_details;
    });

    setWorkoutByDay(existingByDay);
  }

  function updateWorkoutForDay(day, value) {
    setWorkoutByDay((previous) => ({ ...previous, [day]: value }));
  }

  async function handleSaveClick() {
    setIsSaving(true);

    const requests = [];

    if (selectedBatchId) {
      requests.push(
        apiClient.post(`/admin/members/${member.id}/batch`, {
          batch_id: Number(selectedBatchId),
        })
      );
    }

    requests.push(
      apiClient.post(`/admin/members/${member.id}/membership`, {
        plan_type: selectedPlanType,
        payment_status: selectedPaymentStatus,
      })
    );

    // Save every day's workout text — even an empty string is sent,
    // so clearing a day's plan and saving actually removes it.
    DAYS_OF_WEEK.forEach((day) => {
      requests.push(
        apiClient.post(`/admin/members/${member.id}/exercises`, {
          day_of_week: day,
          exercise_details: workoutByDay[day] || "Rest day",
        })
      );
    });

    await Promise.all(requests);

    setIsSaving(false);
    onSaved();
  }

  return (
    <Modal title={`Manage ${member.name}`} onClose={onClose}>
      <div className="flex gap-1 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab("plan")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "plan" ? "border-accent text-ink" : "border-transparent text-ink-muted"
          }`}
        >
          Batch & Plan
        </button>
        <button
          onClick={() => setActiveTab("workout")}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "workout" ? "border-accent text-ink" : "border-transparent text-ink-muted"
          }`}
        >
          Weekly Workout
        </button>
      </div>

      {activeTab === "plan" && (
        <div className="space-y-4">
          <div>
            <label htmlFor="manage-batch-select" className="text-sm text-ink-muted mb-1 block">
              Assign to Batch
            </label>
            <select
              id="manage-batch-select"
              value={selectedBatchId}
              onChange={(event) => setSelectedBatchId(event.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
            >
              <option value="">Keep current batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name} ({batch.shift})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manage-plan-select" className="text-sm text-ink-muted mb-1 block">
              Membership Plan
            </label>
            <select
              id="manage-plan-select"
              value={selectedPlanType}
              onChange={(event) => setSelectedPlanType(event.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
            >
              <option value="1_month">1 Month — ₹600</option>
              <option value="3_month">3 Month — ₹1500</option>
            </select>
          </div>

          <div>
            <label htmlFor="manage-payment-select" className="text-sm text-ink-muted mb-1 block">
              Payment Status
            </label>
            <select
              id="manage-payment-select"
              value={selectedPaymentStatus}
              onChange={(event) => setSelectedPaymentStatus(event.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
            >
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>

          <p className="text-xs text-ink-muted">
            Saving a new plan starts a fresh membership period from today.
          </p>
        </div>
      )}

      {activeTab === "workout" && (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day}>
              <label htmlFor={`workout-${day.toLowerCase()}-input`} className="text-sm text-ink-muted mb-1 block">
                {day}
              </label>
              <textarea
                id={`workout-${day.toLowerCase()}-input`}
                value={workoutByDay[day]}
                onChange={(event) => updateWorkoutForDay(day, event.target.value)}
                placeholder="e.g. Chest + Triceps: Bench press 4x10, Dips 3x12"
                rows={2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-muted resize-none"
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSaveClick}
        disabled={isSaving}
        className="w-full mt-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save All Changes"}
      </button>
    </Modal>
  );
}

export default ManageMemberModal;