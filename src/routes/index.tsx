import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageLoadingFallback } from '@/components/common/PageLoadingFallback';

// Helper for type-safe lazy loading of named exports
const lazyNamed = <T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K
) => lazy(() => loader().then((module) => ({ default: module[exportName] })));

const DashboardPage = lazyNamed(() => import('@/features/dashboard/DashboardPage'), 'DashboardPage');
const ChaptersPage = lazyNamed(() => import('@/features/chapters/ChaptersPage'), 'ChaptersPage');
const TermsPage = lazyNamed(() => import('@/features/terms/TermsPage'), 'TermsPage');
const MembersPage = lazyNamed(() => import('@/features/members/MembersPage'), 'MembersPage');
const ActivitiesPage = lazyNamed(() => import('@/features/activities/ActivitiesPage'), 'ActivitiesPage');
const ActivityDetailPage = lazyNamed(() => import('@/features/activities/ActivityDetailPage'), 'ActivityDetailPage');
const TasksPage = lazyNamed(() => import('@/features/tasks/TasksPage'), 'TasksPage');
const TaskDetailPage = lazyNamed(() => import('@/features/tasks/TaskDetailPage'), 'TaskDetailPage');
const FinancePage = lazyNamed(() => import('@/features/finance/FinancePage'), 'FinancePage');
const ReportsPage = lazyNamed(() => import('@/features/reports/ReportsPage'), 'ReportsPage');
const SettingsPage = lazyNamed(() => import('@/features/settings/SettingsPage'), 'SettingsPage');
const AuditLogsPage = lazyNamed(() => import('@/features/audit-logs/AuditLogsPage'), 'AuditLogsPage');
const DataQualityPage = lazyNamed(() => import('@/features/data-quality/DataQualityPage'), 'DataQualityPage');
const LoginPage = lazyNamed(() => import('@/features/auth/LoginPage'), 'LoginPage');
const AuthCallbackPage = lazyNamed(() => import('@/features/auth/AuthCallbackPage'), 'AuthCallbackPage');
const OnboardingPage = lazyNamed(() => import('@/features/onboarding/OnboardingPage'), 'OnboardingPage');
const WorkspacesPage = lazyNamed(() => import('@/features/chapters/WorkspacesPage'), 'WorkspacesPage');
const AcceptInvitePage = lazyNamed(() => import('@/features/auth/AcceptInvitePage'), 'AcceptInvitePage');
const PlansPage = lazyNamed(() => import('@/features/plans/PlansPage'), 'PlansPage');
const PlanDetailPage = lazyNamed(() => import('@/features/plans/PlanDetailPage'), 'PlanDetailPage');
const CollabActivityDetailPage = lazyNamed(() => import('@/features/plans/CollabActivityDetailPage'), 'CollabActivityDetailPage');
const ComponentPlaygroundPage = lazyNamed(() => import('@/features/dev/ComponentPlaygroundPage'), 'ComponentPlaygroundPage');
const NotFoundPage = lazyNamed(() => import('@/features/common/NotFoundPage'), 'NotFoundPage');

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
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
          <Route path="reports" element={<ReportsPage />} />
          <Route path="data-quality" element={<DataQualityPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/audit-logs" element={<AuditLogsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="dev/components" element={<ComponentPlaygroundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
