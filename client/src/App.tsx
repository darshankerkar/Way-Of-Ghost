import { Navigate, Route, Routes } from "react-router-dom";
import { AuthGuard } from "./hooks/useAuthGuard";
import { AdminGuard } from "./hooks/AdminGuard";
import { AboutPage } from "./pages/AboutPage";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { Round1Page } from "./pages/Round1Page";
import { Round2Page } from "./pages/Round2Page";
import { Round3Page } from "./pages/Round3Page";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/"         element={<LandingPage />} />
      <Route path="/login"    element={<LandingPage />} />
      <Route path="/register" element={<LandingPage />} />
      <Route path="/about"    element={<AboutPage />} />

      {/* Protected routes */}
      <Route element={<AuthGuard />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/round/1"   element={<Round1Page />} />
        <Route path="/round/2"   element={<Round2Page />} />
        <Route path="/round/3"   element={<Round3Page />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminPage />
            </AdminGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
