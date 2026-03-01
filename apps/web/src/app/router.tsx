import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../components/app-layout";
import { GuardedRoute } from "../components/guarded-route";
import { LoginPage } from "../features/auth/login-page";
import { RegisterPage } from "../features/auth/register-page";
import { DashboardPage } from "../features/dashboard/dashboard-page";
import { AssignmentsPage } from "../features/assignments/assignments-page";
import { NewAssignmentPage } from "../features/assignments/new-assignment-page";
import { AssignmentDetailPage } from "../features/assignments/assignment-detail-page";
import { NewLogPage } from "../features/ai-logs/new-log-page";
import { DeclarationPreviewPage } from "../features/declarations/declaration-preview-page";
import { AnalyticsPage } from "../features/analytics/analytics-page";
import { PrivacySettingsPage } from "../features/privacy/privacy-settings-page";
import { ProfilePage } from "../features/settings/profile-page";
import { AdminGuidelinesPage } from "../features/admin/admin-guidelines-page";
import { AdminRetentionPage } from "../features/admin/admin-retention-page";

function ProtectedLayout() {
  return (
    <GuardedRoute>
      <AppLayout />
    </GuardedRoute>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/assignments", element: <AssignmentsPage /> },
      { path: "/assignments/new", element: <NewAssignmentPage /> },
      { path: "/assignments/:assignmentId", element: <AssignmentDetailPage /> },
      { path: "/assignments/:assignmentId/logs/new", element: <NewLogPage /> },
      { path: "/assignments/:assignmentId/declaration/preview", element: <DeclarationPreviewPage /> },
      { path: "/analytics", element: <AnalyticsPage /> },
      { path: "/settings/privacy", element: <PrivacySettingsPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/admin/guidelines", element: <AdminGuidelinesPage /> },
      { path: "/admin/retention", element: <AdminRetentionPage /> },
    ],
  },
]);
