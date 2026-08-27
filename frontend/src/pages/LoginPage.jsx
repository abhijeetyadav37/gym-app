import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Mail, Lock, LogIn } from "lucide-react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  async function handleLoginSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await apiClient.post("/auth/login", {
        email: emailInput,
        password: passwordInput,
      });

      const { token, user } = response.data;
      loginWithToken(token, user);

      // Send admins and members to different dashboards.
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } catch (error) {
      const message =
        error.response?.data || "Something went wrong. Please try again.";
      setErrorMessage(typeof message === "string" ? message : "Login failed");
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
          <h1 className="text-2xl text-ink">My Gym</h1>
          <p className="text-ink-muted text-sm mt-1 font-body normal-case">
            Log in to your account
          </p>
        </div>

        <form
          onSubmit={handleLoginSubmit}
          className="bg-surface border border-border rounded-xl p-6 space-y-4"
        >
          {errorMessage && (
            <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-3 py-2">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="login-email-input" className="text-sm text-ink-muted mb-1 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                id="login-email-input"
                type="email"
                required
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="you@gmail.com"
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password-input" className="text-sm text-ink-muted mb-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input
                id="login-password-input"
                type="password"
                required
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3 text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent"
              />
              <div className="text-right mt-1">
  <Link to="/forgot-password" className="text-xs text-accent hover:underline">
    Forgot password?
  </Link>
</div>


            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
          >
            <LogIn size={18} />
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="text-center text-ink-muted text-sm mt-4">
          New here?{" "}
          <Link to="/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;