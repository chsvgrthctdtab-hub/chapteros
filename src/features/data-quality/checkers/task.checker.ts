import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DataQualityChecker, DataQualityIssue } from '../types';

interface RawTaskRecord {
  id: string;
  title: string;
  status: string;
  priority: string;
  progress: number;
  due_date: string | null;
  assigned_to: string | null;
  term_id: string;
  activity_id: string | null;
  organization_id: string;
}

export const taskQualityChecker: DataQualityChecker = {
  category: 'tasks',
  name: 'Task Quality Checker',
  description: 'Kiểm tra người thực hiện, hạn hoàn thành, tiến độ và tính nhất quán của trạng thái công việc.',

  async check(organizationId: string): Promise<DataQualityIssue[]> {
    if (!isSupabaseConfigured || !organizationId) {
      return [];
    }

    const issues: DataQualityIssue[] = [];
    const now = new Date();
    const nowIso = now.toISOString();
    const todayStr = nowIso.split('T')[0];
    const todayTime = now.getTime();
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    // 1. Fetch all tasks for this organization (single query)
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, status, priority, progress, due_date, assigned_to, term_id, activity_id, organization_id')
      .eq('organization_id', organizationId);

    if (tasksError || !tasksData) {
      console.error('[TaskQualityChecker] Fetch tasks error:', tasksError);
      return [];
    }

    const tasksRaw = tasksData as unknown as RawTaskRecord[];

    for (const task of tasksRaw) {
      const isClosed = task.status === 'completed' || task.status === 'cancelled';

      // Check 1: Missing assignee on active tasks
      if (!isClosed && !task.assigned_to) {
        issues.push({
          id: `dq_tasks_TASK_MISSING_ASSIGNEE_${task.id}`,
          organizationId,
          category: 'tasks',
          severity: 'warning',
          code: 'TASK_MISSING_ASSIGNEE',
          title: 'Công việc chưa được giao cho người phụ trách',
          description: `Công việc "${task.title}" (trạng thái: ${task.status}) chưa được gán cho bất kỳ hội viên nào thực hiện.`,
          entityType: 'task',
          entityId: task.id,
          entityName: task.title,
          detectedAt: nowIso,
          actionLabel: 'Giao việc',
          actionRoute: `/tasks`,
          metadata: { taskId: task.id, status: task.status, priority: task.priority },
        });
      }

      // Check 2: Overdue / Long overdue tasks
      if (!isClosed && task.due_date) {
        const dueDate = new Date(task.due_date);
        const dueDateTime = dueDate.getTime();

        if (task.due_date < todayStr) {
          const overdueDuration = todayTime - dueDateTime;
          const isLongOverdue = overdueDuration > fourteenDaysMs;

          if (isLongOverdue) {
            issues.push({
              id: `dq_tasks_TASK_LONG_OVERDUE_${task.id}`,
              organizationId,
              category: 'tasks',
              severity: 'critical',
              code: 'TASK_LONG_OVERDUE',
              title: 'Công việc quá hạn nghiêm trọng (> 14 ngày)',
              description: `Công việc "${task.title}" đã quá hạn chót (${task.due_date}) hơn 2 tuần mà chưa hoàn thành hoặc hủy bỏ.`,
              entityType: 'task',
              entityId: task.id,
              entityName: task.title,
              detectedAt: nowIso,
              actionLabel: 'Xử lý công việc',
              actionRoute: `/tasks`,
              metadata: { taskId: task.id, dueDate: task.due_date, progress: task.progress },
            });
          } else {
            issues.push({
              id: `dq_tasks_TASK_OVERDUE_${task.id}`,
              organizationId,
              category: 'tasks',
              severity: 'warning',
              code: 'TASK_OVERDUE',
              title: 'Công việc đã quá hạn',
              description: `Công việc "${task.title}" đã quá hạn chót (${task.due_date}) nhưng chưa được hoàn tất.`,
              entityType: 'task',
              entityId: task.id,
              entityName: task.title,
              detectedAt: nowIso,
              actionLabel: 'Xem chi tiết',
              actionRoute: `/tasks`,
              metadata: { taskId: task.id, dueDate: task.due_date, progress: task.progress },
            });
          }
        }
      }

      // Check 3: Completed with progress < 100%
      if (task.status === 'completed' && task.progress < 100) {
        issues.push({
          id: `dq_tasks_TASK_COMPLETED_BELOW_100_${task.id}`,
          organizationId,
          category: 'tasks',
          severity: 'warning',
          code: 'TASK_COMPLETED_BELOW_100',
          title: 'Công việc đã hoàn thành nhưng tiến độ < 100%',
          description: `Công việc "${task.title}" có trạng thái "Đã hoàn thành" nhưng tiến độ ghi nhận chỉ đạt ${task.progress}%.`,
          entityType: 'task',
          entityId: task.id,
          entityName: task.title,
          detectedAt: nowIso,
          actionLabel: 'Chuẩn hóa tiến độ',
          actionRoute: `/tasks`,
          metadata: { taskId: task.id, progress: task.progress },
        });
      }

      // Check 4: In progress with 0% progress
      if (task.status === 'in_progress' && task.progress === 0) {
        issues.push({
          id: `dq_tasks_TASK_IN_PROGRESS_WITH_ZERO_PROGRESS_${task.id}`,
          organizationId,
          category: 'tasks',
          severity: 'info',
          code: 'TASK_IN_PROGRESS_WITH_ZERO_PROGRESS',
          title: 'Công việc đang làm nhưng tiến độ 0%',
          description: `Công việc "${task.title}" đã chuyển sang "Đang làm" nhưng chưa cập nhật tiến độ (> 0%).`,
          entityType: 'task',
          entityId: task.id,
          entityName: task.title,
          detectedAt: nowIso,
          actionLabel: 'Cập nhật tiến độ',
          actionRoute: `/tasks`,
          metadata: { taskId: task.id },
        });
      }

      // Check 5: Inconsistent status & progress (e.g. Todo with progress > 0)
      if (task.status === 'todo' && task.progress > 0) {
        issues.push({
          id: `dq_tasks_TASK_PROGRESS_INCONSISTENT_${task.id}`,
          organizationId,
          category: 'tasks',
          severity: 'warning',
          code: 'TASK_PROGRESS_INCONSISTENT',
          title: 'Trạng thái và tiến độ không đồng bộ',
          description: `Công việc "${task.title}" ở trạng thái "Cần làm" (todo) nhưng tiến độ đã ghi nhận ${task.progress}%. Cần chuyển sang "Đang làm".`,
          entityType: 'task',
          entityId: task.id,
          entityName: task.title,
          detectedAt: nowIso,
          actionLabel: 'Đồng bộ trạng thái',
          actionRoute: `/tasks`,
          metadata: { taskId: task.id, status: task.status, progress: task.progress },
        });
      }
    }

    return issues;
  },
};
