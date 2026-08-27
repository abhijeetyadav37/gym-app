import { useState } from "react";
import apiClient from "../api/client";
import Modal from "./Modal";

// Lets the admin create a member account directly (no self-signup
// needed), and optionally drop them straight into a batch.
function AddMemberModal({ batches, onClose, onCreated }) {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateClick() {
    setErrorMessage("");
    setIsSaving(true);

    try {
      const createResponse = await apiClient.post("/admin/members", {
        name: nameInput,
        email: emailInput,
        password: passwordInput,
      });

      const newMemberId = createResponse.data.id;

      if (selectedBatchId) {
        await apiClient.post(`/admin/members/${newMemberId}/batch`, {
          batch_id: Number(selectedBatchId),
        });
      }

      onCreated();
    } catch (error) {
      const message = error.response?.data || "Could not create member.";
      setErrorMessage(typeof message === "string" ? message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title="Add New Member" onClose={onClose}>
      <div className="space-y-4">
        {errorMessage && (
          <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-3 py-2">
            {errorMessage}
          </div>
        )}

        <div>
          <label htmlFor="add-member-name-input" className="text-sm text-ink-muted mb-1 block">
            Full Name
          </label>
          <input
            id="add-member-name-input"
            type="text"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="Rahul Sharma"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
        </div>

        <div>
          <label htmlFor="add-member-email-input" className="text-sm text-ink-muted mb-1 block">
            Email (must be unique)
          </label>
          <input
            id="add-member-email-input"
            type="email"
            value={emailInput}
            onChange={(event) => setEmailInput(event.target.value)}
            placeholder="member@example.com"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
        </div>

        <div>
          <label htmlFor="add-member-password-input" className="text-sm text-ink-muted mb-1 block">
            Temporary Password
          </label>
          <input
            id="add-member-password-input"
            type="text"
            minLength={8}
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            placeholder="At least 8 characters"
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
          />
          <p className="text-xs text-ink-muted mt-1">Share this with the member so they can log in.</p>
        </div>

        <div>
          <label htmlFor="add-member-batch-select" className="text-sm text-ink-muted mb-1 block">
            Assign to Batch (optional)
          </label>
          <select
            id="add-member-batch-select"
            value={selectedBatchId}
            onChange={(event) => setSelectedBatchId(event.target.value)}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-ink"
          >
            <option value="">No batch yet</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} ({batch.shift})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCreateClick}
          disabled={isSaving}
          className="w-full bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
        >
          {isSaving ? "Adding..." : "Add Member"}
        </button>
      </div>
    </Modal>
  );
}

export default AddMemberModal;