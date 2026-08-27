import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Dumbbell, Lock, KeyRound } from "lucide-react";
import apiClient from "../api/client";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await apiClient.post("/auth/reset-password", {
        token,
        new_password: newPasswordInput,
      });
      navigate("/login");
    } catch (error) {
      const message = error.response?.data || "Could not reset password.";
      setErrorMessage(typeof message === "string" ? message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-ink-muted">
        This reset link is missing its token.{" "}
        <Link to="/forgot-password" className="text-accent hover:underline ml-1">Request a new one</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-accent/15 border border-accent/30 rounded-full p-3 mb-3">
            <Dumbbell className="text-accent" size={28} />
          </div>
          <h1 className="text-2xl text-ink">Set New Password</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          {errorMessage && (
            <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="reset-password-new-input" className="text-sm text-ink-muted mb-1 block">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                id="reset-password-new-input"
                type="password"
                required
                minLength={8}
                value={newPasswordInput}
                onChange={(event) => setNewPasswordInput(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
          >
            <KeyRound size={18} />
            {isSubmitting ? "Saving..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;