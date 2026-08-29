import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ChaptersPage } from '@/features/chapters/ChaptersPage';
import { TermsPage } from '@/features/terms/TermsPage';
import { MembersPage } from '@/features/members/MembersPage';
import { ActivitiesPage } from '@/features/activities/ActivitiesPage';
import { ActivityDetailPage } from '@/features/activities/ActivityDetailPage';
import { TasksPage } from '@/features/tasks/TasksPage';
import { TaskDetailPage } from '@/features/tasks/TaskDetailPage';
import { FinancePage } from '@/features/finance/FinancePage';
import { DocumentsPage } from '@/features/documents/DocumentsPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { IntegrationsPage } from '@/features/integrations/IntegrationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { AuditLogsPage } from '@/features/audit-logs/AuditLogsPage';
import { DataQualityPage } from '@/features/data-quality';
import { LoginPage } from '@/features/auth/LoginPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { WorkspacesPage } from '@/features/chapters/WorkspacesPage';
import { AcceptInvitePage } from '@/features/auth/AcceptInvitePage';
import { PlansPage } from '@/features/plans/PlansPage';
import { PlanDetailPage } from '@/features/plans/PlanDetailPage';
import { CollabActivityDetailPage } from '@/features/plans/CollabActivityDetailPage';
import { ComponentPlaygroundPage } from '@/features/dev/ComponentPlaygroundPage';
import { NotFoundPage } from '@/features/common/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Invitation Acceptance Route */}
      <Route
        path="/invite/:token"
        element={
          <ProtectedRoute allowNoOrganization={true}>
            <AcceptInvitePage />
          </ProtectedRoute>
        }
      />

      {/* Onboarding Route (Accessible when user is authenticated, even with 0 organizations) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowNoOrganization={true}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Workspace Selection Route (Accessible when user is authenticated, to choose active organization) */}
      <Route
        path="/workspaces"
        element={
          <ProtectedRoute allowNoOrganization={true}>
            <WorkspacesPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Main Management Layout Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="plans" element={<PlansPage />} />
        <Route path="plans/:planId" element={<PlanDetailPage />} />
        <Route path="plans/:planId/collab-activities/:activityId" element={<CollabActivityDetailPage />} />
        <Route path="plans/:planId/activities/:activityId" element={<CollabActivityDetailPage />} />
        <Route path="collaboration" element={<PlansPage />} />
        <Route path="collaboration/plans" element={<PlansPage />} />
        <Route path="collaboration/plans/:planId" element={<PlanDetailPage />} />
        <Route path="collaboration/plans/:planId/collab-activities/:activityId" element={<CollabActivityDetailPage />} />
        <Route path="collaboration/plans/:planId/activities/:activityId" element={<CollabActivityDetailPage />} />
        <Route path="chapters" element={<ChaptersPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="activities/:id" element={<ActivityDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="funds" element={<FinancePage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="data-quality" element={<DataQualityPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/audit-logs" element={<AuditLogsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="dev/components" element={<ComponentPlaygroundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
