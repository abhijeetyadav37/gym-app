import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps a page and only renders it if the logged-in user's role
// matches what's required. Example usage:
// <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-ink-muted">
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;