import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

const AttendancePage = lazy(() => import("./pages/admin/AttendancePage"));
const AttendanceDatePrintPage = lazy(() => import("./pages/admin/AttendanceDatePrintPage"));

const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));

// Lazy loading means the browser only downloads the code for a page
// when the user actually navigates to it — keeps the initial page
// load fast, which matters since you asked for a speedy site.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const MemberDashboard = lazy(() => import("./pages/member/MemberDashboard"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const BatchSheetPage = lazy(() => import("./pages/admin/BatchSheetPage"));


function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-ink-muted">
      Loading...
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="member">
              <MemberDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />

        <Route
  path="/admin/batches/:batchId/print"
  element={
    <ProtectedRoute requiredRole="admin">
      <BatchSheetPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/attendance"
  element={
    <ProtectedRoute requiredRole="admin">
      <AttendancePage />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/attendance/date/:date/print"
  element={
    <ProtectedRoute requiredRole="admin">
      <AttendanceDatePrintPage />
    </ProtectedRoute>
  }
/>
<Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />





      </Routes>
    </Suspense>
  );
}

export default App;