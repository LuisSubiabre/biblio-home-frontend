import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function App() {
  return (
    <Routes>
      <Route element={<AuthPage />} path="/auth" />
      <Route
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
        path="/dashboard"
      />
      <Route element={<Navigate to="/dashboard" replace />} path="/" />
    </Routes>
  );
}

export default App;
