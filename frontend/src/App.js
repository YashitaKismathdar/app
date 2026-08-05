import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import NotificationsPage from "@/pages/Notifications";
import ActivityLogs from "@/pages/ActivityLogs";
import AboutWavygo from "@/pages/AboutWavygo";
import ModulePlaceholder from "@/pages/ModulePlaceholder";
import Marketplace from "@/pages/Marketplace";
import TaskBoard from "@/pages/TaskBoard";
import Employees from "@/pages/Employees";
import OpportunityHub from "@/pages/OpportunityHub";
import WavygoConnect from "@/pages/WavygoConnect";

const PLACEHOLDER_ROUTES = [
  "/company-vault", "/finance", "/crm",
  "/marketing", "/analytics", "/calendar", "/wavygo-ai",
];

function Shell({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard"      element={<Shell><Dashboard /></Shell>} />
            <Route path="/marketplace"    element={<Shell><Marketplace /></Shell>} />
            <Route path="/task-board"     element={<Shell><TaskBoard /></Shell>} />
            <Route path="/employees"      element={<Shell><Employees /></Shell>} />
            <Route path="/opportunity-hub" element={<Shell><OpportunityHub /></Shell>} />
            <Route path="/wavygo-connect" element={<Shell><WavygoConnect /></Shell>} />
            <Route path="/settings"       element={<Shell><Settings /></Shell>} />
            <Route path="/notifications"  element={<Shell><NotificationsPage /></Shell>} />
            <Route path="/activity-logs"  element={<Shell><ActivityLogs /></Shell>} />
            <Route path="/about-wavygo"   element={<Shell><AboutWavygo /></Shell>} />
            {PLACEHOLDER_ROUTES.map((p) => (
              <Route key={p} path={p} element={<Shell><ModulePlaceholder /></Shell>} />
            ))}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster richColors position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
