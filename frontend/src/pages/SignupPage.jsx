import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Mail, Lock, User, UserPlus, ShieldCheck } from "lucide-react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

function SignupPage() {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  async function handleSendOtpClick() {
    if (!emailInput) {
      setErrorMessage("Enter your email first.");
      return;
    }
    setErrorMessage("");
    setIsSendingOtp(true);

    try {
      await apiClient.post("/auth/send-signup-otp", { email: emailInput });
      setIsOtpSent(true);
    } catch (error) {
      const message = error.response?.data || "Could not send verification code.";
      setErrorMessage(typeof message === "string" ? message : "Something went wrong.");
    } finally {
      setIsSendingOtp(false);
    }
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/auth/signup", {
        name: nameInput,
        email: emailInput,
        password: passwordInput,
        otp: otpInput,
      });

      const { token, user } = response.data;
      loginWithToken(token, user);
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data || "Could not create account.";
      setErrorMessage(typeof message === "string" ? message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-accent/15 border border-accent/30 rounded-full p-3 mb-3">
            <Dumbbell className="text-accent" size={28} />
          </div>
          <h1 className="text-2xl text-ink">Iron Track Gym</h1>
          <p className="text-ink-muted text-sm mt-1 font-body normal-case">
            Create your member account
          </p>
        </div>

        <form onSubmit={handleSignupSubmit} className="bg-surface border border-border rounded-xl p-6 space-y-4">
          {errorMessage && (
            <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="signup-name-input" className="text-sm text-ink-muted mb-1 block">
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                id="signup-name-input"
                type="text"
                required
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Rahul Sharma"
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="signup-email-input" className="text-sm text-ink-muted mb-1 block">
              Email
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                <input
                  id="signup-email-input"
                  type="email"
                  required
                  disabled={isOtpSent}
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent disabled:opacity-60"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtpClick}
                disabled={isOtpSent || isSendingOtp}
                className="shrink-0 bg-surface-hover border border-border text-ink text-xs font-semibold px-3 rounded-lg disabled:opacity-60"
              >
                {isOtpSent ? "Sent" : isSendingOtp ? "Sending..." : "Send Code"}
              </button>
            </div>
          </div>

          {isOtpSent && (
            <div>
              <label htmlFor="signup-otp-input" className="text-sm text-ink-muted mb-1 block">
                Verification Code
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
                <input
                  id="signup-otp-input"
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(event) => setOtpInput(event.target.value)}
                  placeholder="6-digit code"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
                />
              </div>
              <p className="text-xs text-ink-muted mt-1 font-body normal-case">
                Check your inbox — code expires in 10 minutes.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="signup-password-input" className="text-sm text-ink-muted mb-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                id="signup-password-input"
                type="password"
                required
                minLength={8}
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isOtpSent}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
          >
            <UserPlus size={18} />
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-ink-muted text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;