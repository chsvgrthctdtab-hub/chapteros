import { z } from 'zod';

export const termFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên nhiệm kỳ.')
      .max(100, 'Tên nhiệm kỳ không được vượt quá 100 ký tự.'),
    startDate: z
      .string()
      .min(1, 'Vui lòng chọn ngày bắt đầu.'),
    endDate: z
      .string()
      .min(1, 'Vui lòng chọn ngày kết thúc.'),
    status: z.enum(['draft', 'active', 'completed', 'archived']),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return data.endDate >= data.startDate;
    },
    {
      message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
      path: ['endDate'],
    }
  );

export type TermFormData = {
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
};

export const termMemberAssignmentSchema = z.object({
  memberId: z
    .string()
    .min(1, 'Vui lòng chọn hội viên trong Chi hội.'),
  position: z
    .string()
    .trim()
    .min(1, 'Chức vụ trong nhiệm kỳ không được để trống.')
    .max(50, 'Chức vụ không được quá 50 ký tự.'),
  department: z
    .string()
    .trim()
    .max(100, 'Tên ban / bộ phận không quá 100 ký tự.')
    .optional(),
  status: z.enum(['active', 'leave', 'completed', 'resigned']),
  joinedDate: z
    .string()
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'Ghi chú không được quá 500 ký tự.')
    .optional(),
});

export type TermMemberAssignmentFormData = {
  memberId: string;
  position: string;
  department?: string;
  status: 'active' | 'leave' | 'completed' | 'resigned';
  joinedDate?: string;
  notes?: string;
};
