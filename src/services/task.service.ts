import {
  taskRepository,
  type TasksListResponse,
  type DbTaskInsert,
  type DbTaskUpdate,
} from '@/repositories/task.repository';
import { termRepository } from '@/repositories/term.repository';
import { activityRepository } from '@/repositories/activity.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { validateTaskStatusTransition } from '@/features/tasks/utils/task-workflow';
import { validateTermMutation } from '@/features/terms/utils/term-workflow';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  Activity,
  Term,
} from '@/types';
import type {
  TaskListItem,
  TaskDetail,
  TaskFilterParams,
  TaskStats,
  TaskAssigneeOption,
} from '@/features/tasks/types/task.types';
import type { TaskFormData } from '@/features/tasks/schemas/task.schema';

export const taskService = {
  /**
   * List paginated and filtered tasks in an organization
   */
  async listTasks(
    organizationId: string,
    params: TaskFilterParams = {}
  ): Promise<TasksListResponse> {
    if (!organizationId) {
      return { data: [], totalCount: 0, page: 1, pageSize: params.pageSize || 15, totalPages: 0 };
    }
    return taskRepository.getTasks(organizationId, params);
  },

  /**
   * Get single task detail with joined relations and assignee member info
   */
  async getTaskById(id: string, organizationId?: string): Promise<TaskDetail | null> {
    if (!id) return null;
    return taskRepository.getById(id, organizationId);
  },

  /**
   * Get tasks associated with an activity
   */
  async getTasksByActivity(activityId: string, organizationId?: string): Promise<TaskListItem[]> {
    if (!activityId) return [];
    return taskRepository.getTasksByActivity(activityId, organizationId);
  },

  /**
   * Get statistics & KPI summary for tasks
   */
  async getTaskStats(organizationId: string, termId?: string): Promise<TaskStats> {
    if (!organizationId) {
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        inReview: 0,
        completed: 0,
        cancelled: 0,
        overdue: 0,
        highOrUrgent: 0,
        completionRate: 0,
      };
    }
    return taskRepository.getStats(organizationId, termId);
  },

  /**
   * Get available assignees with active membership in the organization
   */
  async getTaskAssignees(organizationId: string): Promise<TaskAssigneeOption[]> {
    if (!organizationId) return [];
    return taskRepository.getAssignees(organizationId);
  },

  /**
   * Get activities available for linking
   */
  async getTaskActivities(organizationId: string, termId?: string): Promise<Activity[]> {
    if (!organizationId) return [];
    return taskRepository.getActivities(organizationId, termId);
  },

  /**
   * Get terms for organization
   */
  async getTaskTerms(organizationId: string): Promise<Term[]> {
    if (!organizationId) return [];
    return taskRepository.getTerms(organizationId);
  },

  /**
   * Create a new task with strict tenant and relational validations
   */
  async createTask(
    organizationId: string,
    formData: TaskFormData,
    actorUserId?: string
  ): Promise<Task> {
    if (!organizationId) {
      throw new Error('Mã chi hội không hợp lệ');
    }

    // 1. Parallelize Multi-Tenant Validations
    await Promise.all([
      // Validate Term ownership & lock status
      (async () => {
        if (!formData.termId) {
          throw new Error('Vui lòng chọn nhiệm kỳ thực hiện');
        }
        const term = await termRepository.getById(formData.termId);
        if (!term || term.organizationId !== organizationId) {
          throw new Error('Nhiệm kỳ không thuộc Đơn vị hiện tại');
        }
        validateTermMutation(term.status, 'tạo công việc trong nhiệm kỳ đã khóa');
      })(),

      // Validate Activity ownership if provided
      formData.activityId
        ? (async () => {
            const activity = await activityRepository.getById(formData.activityId!);
            if (!activity || activity.organizationId !== organizationId) {
              throw new Error('Hoạt động không thuộc Đơn vị hiện tại');
            }
          })()
        : Promise.resolve(),

      // Validate Assignee membership if provided
      formData.assignedTo
        ? (async () => {
            const isValidAssignee = await taskRepository.validateAssigneeMembership(
              organizationId,
              formData.assignedTo!
            );
            if (!isValidAssignee) {
              throw new Error('Hội viên được giao nhiệm vụ không thuộc Đơn vị hiện tại');
            }
          })()
        : Promise.resolve(),
    ]);

    // 2. Progress & Status synchronization
    let finalProgress = formData.progress ?? 0;
    if (formData.status === 'completed' && finalProgress < 100) {
      finalProgress = 100;
    }

    const payload: DbTaskInsert = {
      organization_id: organizationId,
      term_id: formData.termId,
      activity_id: formData.activityId || null,
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      status: formData.status,
      priority: formData.priority,
      progress: finalProgress,
      due_date: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      assigned_to: formData.assignedTo || null,
      created_by: actorUserId || null,
    };

    const task = await taskRepository.create(payload);

    // 3. Non-blocking Background Audit Logging
    if (actorUserId) {
      auditLogRepository
        .log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'task.create',
          entity_type: 'task',
          entity_id: task.id,
          metadata: {
            title: task.title,
            priority: task.priority,
            status: task.status,
            assigned_to: task.assignedTo,
            activity_id: task.activityId,
          },
        })
        .catch((err) => console.warn('Audit log ignored during task create:', err));
    }

    return task;
  },

  /**
   * Update task details with full validation
   */
  async updateTask(
    taskId: string,
    organizationId: string,
    formData: Partial<TaskFormData>,
    actorUserId?: string
  ): Promise<Task> {
    if (!taskId || !organizationId) {
      throw new Error('Thông tin công việc hoặc chi hội không hợp lệ');
    }

    // Verify existing task exists and belongs to current organization
    const existing = await taskRepository.getById(taskId, organizationId);
    if (!existing) {
      throw new Error('Không tìm thấy công việc trong chi hội hiện tại');
    }

    // Parallelize all validation checks
    await Promise.all([
      // Check existing term lock
      existing.termId
        ? (async () => {
            const currentTerm = await termRepository.getById(existing.termId!);
            validateTermMutation(currentTerm?.status, 'chỉnh sửa công việc thuộc nhiệm kỳ đã khóa');
          })()
        : Promise.resolve(),

      // Check updated term ownership
      formData.termId !== undefined && formData.termId !== existing.termId
        ? (async () => {
            const term = await termRepository.getById(formData.termId!);
            if (!term || term.organizationId !== organizationId) {
              throw new Error('Nhiệm kỳ không thuộc Đơn vị hiện tại');
            }
            validateTermMutation(term.status, 'chuyển công việc sang nhiệm kỳ đã khóa');
          })()
        : Promise.resolve(),

      // Check updated activity ownership
      formData.activityId !== undefined && formData.activityId !== existing.activityId && formData.activityId
        ? (async () => {
            const activity = await activityRepository.getById(formData.activityId!);
            if (!activity || activity.organizationId !== organizationId) {
              throw new Error('Hoạt động không thuộc Đơn vị hiện tại');
            }
          })()
        : Promise.resolve(),

      // Check updated assignee membership
      formData.assignedTo !== undefined && formData.assignedTo !== existing.assignedTo && formData.assignedTo
        ? (async () => {
            const isValidAssignee = await taskRepository.validateAssigneeMembership(
              organizationId,
              formData.assignedTo!
            );
            if (!isValidAssignee) {
              throw new Error('Hội viên được giao nhiệm vụ không thuộc Đơn vị hiện tại');
            }
          })()
        : Promise.resolve(),
    ]);

    // Progress and Status alignment
    const payload: DbTaskUpdate = {};
    if (formData.title !== undefined) payload.title = formData.title.trim();
    if (formData.description !== undefined) payload.description = formData.description?.trim() || null;
    if (formData.termId !== undefined) payload.term_id = formData.termId;
    if (formData.activityId !== undefined) payload.activity_id = formData.activityId || null;
    if (formData.assignedTo !== undefined) payload.assigned_to = formData.assignedTo || null;
    if (formData.priority !== undefined) payload.priority = formData.priority;

    if (formData.status !== undefined && formData.status !== existing.status) {
      const validation = validateTaskStatusTransition({
        currentStatus: existing.status,
        targetStatus: formData.status,
        userRole: null, // If full edit, form permissions already check canManage
      });

      if (!validation.allowed) {
        throw new Error(validation.errorMessage || 'Chuyển đổi trạng thái không hợp lệ');
      }

      payload.status = formData.status;
      if (formData.status === 'completed' && (formData.progress === undefined || formData.progress < 100)) {
        payload.progress = 100;
      }
    }

    if (formData.progress !== undefined && payload.progress === undefined) {
      payload.progress = formData.progress;
    }

    if (formData.dueDate !== undefined) {
      payload.due_date = formData.dueDate ? new Date(formData.dueDate).toISOString() : null;
    }

    const updatedTask = await taskRepository.update(taskId, payload, organizationId);

    // Non-blocking Background Audit Logging
    if (actorUserId) {
      auditLogRepository
        .log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'task.update',
          entity_type: 'task',
          entity_id: taskId,
          metadata: {
            title: updatedTask.title,
            status: updatedTask.status,
            priority: updatedTask.priority,
            progress: updatedTask.progress,
            previous_status: existing.status,
          },
        })
        .catch((err) => console.warn('Audit log ignored during task update:', err));
    }

    return updatedTask;
  },

  /**
   * Fast update status with State Machine transition validation, RBAC and audit logging
   */
  async updateTaskStatus(
    taskId: string,
    organizationId: string,
    status: TaskStatus,
    progress?: number,
    actorUserId?: string,
    userRole?: string | null
  ): Promise<Task> {
    if (!taskId || !organizationId) {
      throw new Error('Thông tin công việc không hợp lệ');
    }

    // 1. Fetch current task with tenant check
    const existing = await taskRepository.getById(taskId, organizationId);
    if (!existing) {
      throw new Error('Không tìm thấy công việc trong chi hội hiện tại');
    }

    if (existing.termId) {
      const term = await termRepository.getById(existing.termId);
      validateTermMutation(term?.status, 'cập nhật trạng thái công việc thuộc nhiệm kỳ đã khóa');
    }

    // 2. Validate state machine transition & RBAC
    const validation = validateTaskStatusTransition({
      currentStatus: existing.status,
      targetStatus: status,
      userRole,
      isAssignee: Boolean(actorUserId && existing.assignedTo === actorUserId),
      isCreator: Boolean(actorUserId && existing.createdBy === actorUserId),
    });

    if (!validation.allowed) {
      throw new Error(validation.errorMessage || 'Chuyển đổi trạng thái không hợp lệ');
    }

    const payload: DbTaskUpdate = { status };

    // 3. Progress and status alignment
    if (status === 'completed') {
      payload.progress = 100;
    } else if (status === 'todo' && progress === undefined) {
      payload.progress = 0;
    } else if (progress !== undefined) {
      payload.progress = Math.min(100, Math.max(0, Math.round(progress)));
    } else if (validation.recommendedProgress !== undefined && existing.progress === 0) {
      payload.progress = validation.recommendedProgress;
    }

    const updatedTask = await taskRepository.update(taskId, payload, organizationId);

    // 4. Non-blocking Background Audit Logging
    if (actorUserId) {
      auditLogRepository
        .log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'task.status_change',
          entity_type: 'task',
          entity_id: taskId,
          metadata: {
            task_id: taskId,
            task_title: existing.title,
            previous_status: existing.status,
            new_status: status,
            changed_by: actorUserId,
            progress: updatedTask.progress,
          },
        })
        .catch((err) => console.warn('Audit log ignored during task status change:', err));
    }

    return updatedTask;
  },

  /**
   * Fast update progress with optional status alignment
   */
  async updateTaskProgress(
    taskId: string,
    organizationId: string,
    progress: number,
    status?: TaskStatus,
    actorUserId?: string
  ): Promise<Task> {
    if (!taskId || !organizationId) {
      throw new Error('Thông tin công việc không hợp lệ');
    }

    const existing = await taskRepository.getById(taskId, organizationId);
    if (!existing) {
      throw new Error('Không tìm thấy công việc trong chi hội hiện tại');
    }

    if (existing.termId) {
      const term = await termRepository.getById(existing.termId);
      validateTermMutation(term?.status, 'cập nhật tiến độ công việc thuộc nhiệm kỳ đã khóa');
    }

    const cleanProgress = Math.min(100, Math.max(0, Math.round(progress)));
    const payload: DbTaskUpdate = { progress: cleanProgress };

    if (status) {
      payload.status = status;
    } else if (cleanProgress === 100) {
      payload.status = 'completed';
    }

    const updatedTask = await taskRepository.update(taskId, payload, organizationId);

    // Non-blocking Background Audit Logging
    if (actorUserId) {
      auditLogRepository
        .log({
          organization_id: organizationId,
          user_id: actorUserId,
          action: 'task.progress_update',
          entity_type: 'task',
          entity_id: taskId,
          metadata: {
            progress: cleanProgress,
            status: updatedTask.status,
          },
        })
        .catch((err) => console.warn('Audit log ignored during task progress update:', err));
    }

    return updatedTask;
  },

  /**
   * Delete a task
   */
  async deleteTask(
    taskId: string,
    organizationId: string,
    actorUserId?: string
  ): Promise<void> {
    if (!taskId || !organizationId) {
      throw new Error('Thông tin công việc không hợp lệ');
    }

    const existing = await taskRepository.getById(taskId, organizationId);
    if (!existing) {
      throw new Error('Không tìm thấy công việc trong chi hội hiện tại');
    }

    if (existing.termId) {
      const term = await termRepository.getById(existing.termId);
      validateTermMutation(term?.status, 'xóa công việc thuộc nhiệm kỳ đã khóa');
    }

    await taskRepository.delete(taskId, organizationId);

    if (actorUserId) {
      await auditLogRepository.log({
        organization_id: organizationId,
        user_id: actorUserId,
        action: 'task.delete',
        entity_type: 'task',
        entity_id: taskId,
        metadata: {},
      });
    }
  },
};
