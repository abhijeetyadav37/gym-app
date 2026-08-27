import { useState } from "react";
import apiClient from "../api/client";
import Modal from "./Modal";

function CreateBatchModal({ onClose, onCreated }) {
  const [batchName, setBatchName] = useState("");
  const [batchShift, setBatchShift] = useState("morning");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateClick() {
    if (!batchName.trim()) return;

    setIsSaving(true);
    await apiClient.post("/admin/batches", { name: batchName, shift: batchShift });
    setIsSaving(false);
    onCreated();
  }

  return (
    <Modal title="Create New Batch" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label htmlFor="new-batch-name-input" className="text-sm text-ink-muted mb-1 block">
            Batch Name
          </label>
          <input
            id="new-batch-name-input"
            type="text"
            value={batchName}
            onChange={(event) => setBatchName(event.target.value)}
            placeholder="Morning Batch A"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
        </div>

        <div>
          <label htmlFor="new-batch-shift-select" className="text-sm text-ink-muted mb-1 block">
            Shift
          </label>
          <select
            id="new-batch-shift-select"
            value={batchShift}
            onChange={(event) => setBatchShift(event.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
          >
            <option value="morning">Morning (6–11 AM)</option>
            <option value="evening">Evening (4–11 PM)</option>
          </select>
        </div>

        <button
          onClick={handleCreateClick}
          disabled={isSaving}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
        >
          {isSaving ? "Creating..." : "Create Batch"}
        </button>
      </div>
    </Modal>
  );
}

export default CreateBatchModal;