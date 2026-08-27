import { Dumbbell, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";

// Shared header for every dashboard. Pass navLinks (e.g. Members /
// Attendance) to show a tab-style switcher — omit it on pages that
// don't need one, like the member dashboard.
function TopNavBar({ pageTitle, navLinks }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogoutClick() {
    logout();
    navigate("/login");
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-accent/15 border border-accent/30 rounded-full p-2">
            <Dumbbell className="text-accent" size={20} />
          </div>
          <div>
            <h1 className="text-lg text-ink leading-none">{pageTitle}</h1>
            <p className="text-ink-muted text-xs mt-1 font-body normal-case">
              Welcome, {currentUser?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {navLinks && (
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    location.pathname === link.to
                      ? "bg-accent/15 text-accent"
                      : "text-ink-muted hover:text-ink hover:bg-surface-hover"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 text-ink-muted hover:text-ink text-sm px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopNavBar;