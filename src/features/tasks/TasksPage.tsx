import React, { useState } from 'react';
import {
  Plus,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  AlertCircle,
} from 'lucide-react';
import { useCurrentOrg } from '@/features/auth/hooks/useCurrentOrg';
import { useToast } from '@/contexts/ToastContext';
import {
  useTasksList,
  useTaskStats,
  useTaskAssignees,
  useTaskActivities,
  useTaskTerms,
} from './queries/task.queries';
import {
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useUpdateTaskProgress,
  useDeleteTask,
} from './mutations/task.mutations';
import { TaskSummary } from './components/TaskSummary';
import { TaskFilterBar } from './components/TaskFilterBar';
import { TaskCard } from './components/TaskCard';
import { TaskTable } from './components/TaskTable';
import { TaskKanbanBoard } from './components/TaskKanbanBoard';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { TaskSkeleton } from './components/TaskSkeleton';
import { TaskFormModal } from './components/TaskFormModal';
import { TaskQuickStatusModal } from './components/TaskQuickStatusModal';
import { TaskQuickProgressModal } from './components/TaskQuickProgressModal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { GoogleSheetsExportModal } from '@/integrations/google/sheets/components/GoogleSheetsExportModal';
import { GoogleSheetsImportWizardModal } from '@/integrations/google/sheets/components/GoogleSheetsImportWizardModal';
import type { TaskFilterParams, TaskListItem, TaskStatus } from './types/task.types';
import type { TaskFormData } from './schemas/task.schema';
import { cn } from '@/lib/utils';

export function TasksPage() {
  const { currentOrg, isBoard, isAdmin, role, user } = useCurrentOrg();
  const toast = useToast();
  const canManage = isBoard || isAdmin;

  // View & Filter State
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'cards'>(() => {
    try {
      const saved = localStorage.getItem('chihoidb_tasks_view_mode');
      if (saved === 'table' || saved === 'kanban' || saved === 'cards') return saved;
    } catch {
      // Ignore localStorage error
    }
    return 'table';
  });

  const [filters, setFilters] = useState<TaskFilterParams>({
    search: '',
    status: 'all',
    priority: 'all',
    termId: 'all',
    activityId: 'all',
    assignedTo: 'all',
    onlyOverdue: false,
    page: 1,
    pageSize: viewMode === 'kanban' ? 60 : 15,
    sortBy: 'due_date',
    sortOrder: 'asc',
  });

  const handleSetViewMode = (mode: 'table' | 'kanban' | 'cards') => {
    setViewMode(mode);
    try {
      localStorage.setItem('chihoidb_tasks_view_mode', mode);
    } catch {
      // Ignore localStorage error
    }
    if (mode === 'kanban') {
      setFilters((prev) => ({ ...prev, pageSize: 60, page: 1 }));
    } else {
      setFilters((prev) => ({ ...prev, pageSize: 15, page: 1 }));
    }
  };

  // Selected Task Drawer State
  const [selectedTask, setSelectedTask] = useState<TaskListItem | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskListItem | null>(null);
  const [quickStatusTask, setQuickStatusTask] = useState<TaskListItem | null>(null);
  const [quickProgressTask, setQuickProgressTask] = useState<TaskListItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskListItem | null>(null);
  const [sheetsExportOpen, setSheetsExportOpen] = useState(false);
  const [sheetsImportOpen, setSheetsImportOpen] = useState(false);

  // Queries
  const {
    data: tasksResponse,
    isLoading: isTasksLoading,
    isFetching: isTasksFetching,
    error: tasksError,
    refetch,
  } = useTasksList(currentOrg?.id, filters);

  const { data: stats = {
    total: 0,
    todo: 0,
    inProgress: 0,
    inReview: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    highOrUrgent: 0,
    completionRate: 0,
  } } = useTaskStats(currentOrg?.id, filters.termId);

  const { data: assignees = [] } = useTaskAssignees(currentOrg?.id);
  const { data: allActivities = [] } = useTaskActivities(currentOrg?.id);
  const { data: terms = [] } = useTaskTerms(currentOrg?.id);

  // Mutations
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const updateStatusMutation = useUpdateTaskStatus();
  const updateProgressMutation = useUpdateTaskProgress();
  const deleteTaskMutation = useDeleteTask();

  const handleFilterChange = (newFilters: Partial<TaskFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      termId: 'all',
      activityId: 'all',
      assignedTo: 'all',
      onlyOverdue: false,
      page: 1,
      pageSize: viewMode === 'kanban' ? 60 : 15,
      sortBy: 'due_date',
      sortOrder: 'asc',
    });
  };

  const handleCreateOrUpdateSubmit = async (data: TaskFormData) => {
    if (!currentOrg) return;
    try {
      if (editingTask) {
        await updateTaskMutation.mutateAsync({
          taskId: editingTask.id,
          organizationId: currentOrg.id,
          data,
          updatedBy: user?.id,
        });
        toast.success(`Updated task "${data.title}" successfully.`);
        // Update selected task in drawer if open
        if (selectedTask && selectedTask.id === editingTask.id) {
          setSelectedTask((prev) => (prev ? { ...prev, ...data } : null));
        }
        setEditingTask(null);
      } else {
        await createTaskMutation.mutateAsync({
          organizationId: currentOrg.id,
          data,
          createdBy: user?.id,
        });
        toast.success(`Created task "${data.title}" successfully.`);
        setIsCreateOpen(false);
      }
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleQuickStatusUpdate = async (status: TaskStatus, progress?: number) => {
    if (!currentOrg || !quickStatusTask) return;
    try {
      await updateStatusMutation.mutateAsync({
        taskId: quickStatusTask.id,
        organizationId: currentOrg.id,
        status,
        progress,
        activityId: quickStatusTask.activityId,
        updatedBy: user?.id,
        userRole: role,
      });
      toast.success('Task status updated successfully.');
      if (selectedTask && selectedTask.id === quickStatusTask.id) {
        setSelectedTask((prev) => (prev ? { ...prev, status, progress: progress !== undefined ? progress : prev.progress } : null));
      }
      setQuickStatusTask(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleDirectStatusUpdate = async (taskId: string, targetStatus: TaskStatus, currentProgress?: number) => {
    if (!currentOrg) return;
    const task = tasksList.find((t) => t.id === taskId) || (selectedTask?.id === taskId ? selectedTask : null);
    try {
      await updateStatusMutation.mutateAsync({
        taskId,
        organizationId: currentOrg.id,
        status: targetStatus,
        progress: currentProgress,
        activityId: task?.activityId,
        updatedBy: user?.id,
        userRole: role,
      });
      toast.success('Task status updated.');
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask((prev) => (prev ? { ...prev, status: targetStatus } : null));
      }
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleQuickProgressUpdate = async (progress: number) => {
    const target = quickProgressTask || selectedTask;
    if (!currentOrg || !target) return;
    try {
      await updateProgressMutation.mutateAsync({
        taskId: target.id,
        organizationId: currentOrg.id,
        progress,
        activityId: target.activityId,
        updatedBy: user?.id,
      });
      toast.success(`Updated progress to ${progress}%.`);
      if (selectedTask && selectedTask.id === target.id) {
        setSelectedTask((prev) => (prev ? { ...prev, progress } : null));
      }
      setQuickProgressTask(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleDelete = (task: TaskListItem) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = async () => {
    if (!currentOrg || !taskToDelete) return;
    try {
      await deleteTaskMutation.mutateAsync({
        taskId: taskToDelete.id,
        organizationId: currentOrg.id,
        activityId: taskToDelete.activityId,
        deletedBy: user?.id,
      });
      toast.success(`Deleted task "${taskToDelete.title}".`);
      if (selectedTask?.id === taskToDelete.id) {
        setSelectedTask(null);
      }
      setTaskToDelete(null);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const tasksList = tasksResponse?.data || [];
  const totalCount = tasksResponse?.totalCount || 0;
  const totalPages = tasksResponse?.totalPages || 0;
  const currentPage = filters.page || 1;

  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.status && filters.status !== 'all') ||
      (filters.priority && filters.priority !== 'all') ||
      (filters.termId && filters.termId !== 'all') ||
      (filters.activityId && filters.activityId !== 'all') ||
      (filters.assignedTo && filters.assignedTo !== 'all') ||
      filters.onlyOverdue
  );

  return (
    <div className="w-full space-y-4 pb-12">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Tasks
            </h1>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full font-mono">
              {stats.total} tasks
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage assignments, deadlines and execution progress.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setSheetsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Export Sheets</span>
          </button>

          {canManage && (
            <button
              type="button"
              onClick={() => setSheetsImportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>Import</span>
            </button>
          )}

          {canManage && (
            <button
              type="button"
              id="create-task-main-btn"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TASK SUMMARY (Compact Horizontal Metrics) */}
      <TaskSummary
        stats={stats}
        currentStatusFilter={filters.status}
        isOverdueFilterActive={Boolean(filters.onlyOverdue)}
        onSelectStatusFilter={(status) =>
          handleFilterChange({ status: status as TaskStatus, page: 1, onlyOverdue: false })
        }
        onToggleOverdueFilter={() =>
          handleFilterChange({ onlyOverdue: !filters.onlyOverdue, page: 1 })
        }
      />

      {/* 3. TOOLBAR & FILTERS */}
      <TaskFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
        onToggleViewMode={handleSetViewMode}
        terms={terms}
        activities={allActivities}
        assignees={assignees}
        totalResults={totalCount}
        onRefresh={refetch}
        isRefreshing={isTasksFetching}
        onExportSheets={() => setSheetsExportOpen(true)}
        onImportSheets={() => setSheetsImportOpen(true)}
        canManage={canManage}
      />

      {/* 4. CONTENT VIEWS / SKELETON / ERROR / EMPTY */}
      {isTasksLoading ? (
        <TaskSkeleton viewMode={viewMode} count={viewMode === 'table' ? 8 : 6} />
      ) : tasksError ? (
        <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
          <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Unable to load tasks</h3>
            <p className="text-xs text-slate-500 mt-1">
              Something went wrong while loading the task list.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      ) : tasksList.length === 0 ? (
        <EmptyState
          icon={<ListTodo className="w-8 h-8 text-slate-400" />}
          title={hasActiveFilters ? 'No tasks found' : 'No tasks created yet'}
          description={
            hasActiveFilters
              ? 'Try changing your filters or create a new task.'
              : 'Create tasks and assign them to team members to track execution.'
          }
          actionLabel={
            hasActiveFilters
              ? 'Clear filters'
              : canManage
              ? 'Create Task'
              : undefined
          }
          onAction={
            hasActiveFilters
              ? handleResetFilters
              : () => setIsCreateOpen(true)
          }
        />
      ) : (
        <div className="space-y-4">
          {viewMode === 'kanban' ? (
            <TaskKanbanBoard
              tasks={tasksList}
              onUpdateStatus={handleDirectStatusUpdate}
              onSelectTask={(t) => setSelectedTask(t)}
              onEdit={(t) => setEditingTask(t)}
              onDelete={handleDelete}
              onQuickStatus={(t) => setQuickStatusTask(t)}
              onQuickProgress={(t) => setQuickProgressTask(t)}
              userRole={role}
              canManage={canManage}
              currentUserId={user?.id}
              isUpdating={updateStatusMutation.isPending}
            />
          ) : viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {tasksList.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onSelectTask={(t) => setSelectedTask(t)}
                  onEdit={(t) => setEditingTask(t)}
                  onDelete={handleDelete}
                  onQuickStatus={(t) => setQuickStatusTask(t)}
                  onQuickProgress={(t) => setQuickProgressTask(t)}
                  canManage={canManage}
                  isAssignee={Boolean(user && task.assignedTo === user.id)}
                />
              ))}
            </div>
          ) : (
            <TaskTable
              tasks={tasksList}
              onSelectTask={(t) => setSelectedTask(t)}
              onEdit={(t) => setEditingTask(t)}
              onDelete={handleDelete}
              onQuickStatus={(t) => setQuickStatusTask(t)}
              onQuickProgress={(t) => setQuickProgressTask(t)}
              canManage={canManage}
              currentUserId={user?.id}
            />
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && viewMode !== 'kanban' && (
            <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="text-xs text-slate-500">
                Showing page <strong className="font-semibold text-slate-900 font-mono">{currentPage}</strong> of{' '}
                <strong className="font-semibold text-slate-900 font-mono">{totalPages}</strong> ({totalCount} tasks)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="prev-page-btn"
                  disabled={currentPage <= 1}
                  onClick={() => handleFilterChange({ page: currentPage - 1 })}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    }
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handleFilterChange({ page: pageNum })}
                        className={cn(
                          'w-7.5 h-7.5 rounded-lg text-xs font-semibold transition-all cursor-pointer font-mono',
                          currentPage === pageNum
                            ? 'bg-emerald-700 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  id="next-page-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => handleFilterChange({ page: currentPage + 1 })}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Slide-Over Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        onEdit={(t) => {
          setSelectedTask(null);
          setEditingTask(t);
        }}
        onDelete={(t) => {
          setSelectedTask(null);
          handleDelete(t);
        }}
        onUpdateStatus={handleDirectStatusUpdate}
        onUpdateProgress={handleQuickProgressUpdate}
        canManage={canManage}
        userRole={role}
        currentUserId={user?.id}
        isUpdating={updateStatusMutation.isPending || updateProgressMutation.isPending}
      />

      {/* Task Create / Edit Modal */}
      <TaskFormModal
        isOpen={isCreateOpen || Boolean(editingTask)}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateSubmit}
        initialTask={editingTask}
        defaultTermId={filters.termId !== 'all' ? filters.termId : undefined}
        defaultActivityId={filters.activityId !== 'all' && filters.activityId !== 'standalone' ? filters.activityId : undefined}
        terms={terms}
        activities={allActivities}
        assignees={assignees}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />

      {/* Quick Status Modal */}
      <TaskQuickStatusModal
        isOpen={Boolean(quickStatusTask)}
        onClose={() => setQuickStatusTask(null)}
        task={quickStatusTask}
        onUpdateStatus={handleQuickStatusUpdate}
        userRole={role}
        isLoading={updateStatusMutation.isPending}
      />

      {/* Quick Progress Modal */}
      <TaskQuickProgressModal
        isOpen={Boolean(quickProgressTask)}
        onClose={() => setQuickProgressTask(null)}
        task={quickProgressTask}
        onUpdateProgress={(p) => handleQuickProgressUpdate(p)}
        isLoading={updateProgressMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
        title="Delete task?"
        description={`Are you sure you want to delete task "${taskToDelete?.title}"?`}
        warningNote="This action cannot be undone and will permanently remove the task."
        confirmLabel="Confirm delete"
        variant="destructive"
        isLoading={deleteTaskMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      {/* Google Sheets Export Modal */}
      <GoogleSheetsExportModal
        open={sheetsExportOpen}
        onOpenChange={setSheetsExportOpen}
        module="tasks"
        termId={filters.termId !== 'all' ? filters.termId : undefined}
        customFilters={filters as unknown as Record<string, unknown>}
      />

      {/* Google Sheets Import Wizard Modal */}
      <GoogleSheetsImportWizardModal
        open={sheetsImportOpen}
        onOpenChange={setSheetsImportOpen}
        module="tasks"
        termId={filters.termId !== 'all' ? filters.termId : undefined}
        onImportSuccess={() => refetch()}
      />
    </div>
  );
}

export default TasksPage;
