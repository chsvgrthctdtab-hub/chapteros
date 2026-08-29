import { z } from 'zod';
import type { TaskStatus, TaskPriority } from '../types/task.types';

export const taskFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Tên công việc phải có ít nhất 3 ký tự')
    .max(200, 'Tên công việc không vượt quá 200 ký tự'),
  description: z.string().max(2000, 'Mô tả không vượt quá 2000 ký tự').optional(),
  termId: z.string().min(1, 'Vui lòng chọn nhiệm kỳ thực hiện'),
  activityId: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  progress: z.coerce.number().min(0).max(100),
  dueDate: z.string().optional().nullable(),
});

export interface TaskFormData {
  title: string;
  description?: string;
  termId: string;
  activityId?: string | null;
  assignedTo?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate?: string | null;
}

export const quickStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'in_review', 'completed', 'cancelled']),
  autoProgress: z.boolean().optional(),
});

export const quickProgressSchema = z.object({
  progress: z.coerce.number().int().min(0).max(100),
});
