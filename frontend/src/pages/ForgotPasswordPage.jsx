import { useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, Mail, Send } from "lucide-react";
import apiClient from "../api/client";

function ForgotPasswordPage() {
  const [emailInput, setEmailInput] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    await apiClient.post("/auth/forgot-password", { email: emailInput });

    setIsSubmitting(false);
    setHasSubmitted(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-accent/15 border border-accent/30 rounded-full p-3 mb-3">
            <Dumbbell className="text-accent" size={28} />
          </div>
          <h1 className="text-2xl text-ink">Reset Password</h1>
        </div>

        {hasSubmitted ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center">
            <p className="text-ink text-sm">
              If that email is registered, a reset link has been sent. Check your inbox.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
            <div>
              <label htmlFor="forgot-password-email-input" className="text-sm text-ink-muted mb-1 block">
                Your account email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                <input
                  id="forgot-password-email-input"
                  type="email"
                  required
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="you@gmail.com"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
            >
              <Send size={18} />
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-center text-ink-muted text-sm mt-4">
          <Link to="/login" className="text-accent hover:underline">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;