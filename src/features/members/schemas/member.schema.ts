import { z } from 'zod';

export const memberFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
  studentId: z
    .string()
    .trim()
    .min(2, 'Mã số sinh viên (MSSV) không được để trống')
    .max(30, 'MSSV không được vượt quá 30 ký tự'),
  email: z
    .string()
    .trim()
    .email('Địa chỉ email không hợp lệ')
    .optional()
    .or(z.literal(''))
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(20, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal(''))
    .nullable(),
  className: z
    .string()
    .trim()
    .max(50, 'Tên lớp không quá 50 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),
  major: z
    .string()
    .trim()
    .max(100, 'Chuyên ngành không quá 100 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),
  cohort: z
    .string()
    .trim()
    .max(50, 'Khóa học không quá 50 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),
  position: z
    .string()
    .trim()
    .max(50, 'Chức vụ không quá 50 ký tự'),
  status: z
    .enum(['active', 'alumni'], {
      error: 'Vui lòng chọn trạng thái hợp lệ',
    }),
  joinedDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(500, 'Ghi chú không quá 500 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),
  assignToTermId: z.string().optional().nullable(),
  termPosition: z.string().optional().nullable(),
  termDepartment: z.string().optional().nullable(),
});

export type MemberFormData = z.infer<typeof memberFormSchema>;

export const termMemberFormSchema = z.object({
  termId: z
    .string()
    .min(1, 'Vui lòng chọn nhiệm kỳ'),
  position: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập chức vụ trong nhiệm kỳ')
    .max(50, 'Chức vụ không quá 50 ký tự'),
  department: z
    .string()
    .trim()
    .max(100, 'Ban / Bộ phận không quá 100 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),
  status: z
    .enum(['active', 'leave', 'completed', 'resigned'], {
      error: 'Vui lòng chọn trạng thái nhiệm kỳ hợp lệ',
    }),
  joinedDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .nullable(),
  notes: z
    .string()
    .trim()
    .max(500, 'Ghi chú không quá 500 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type TermMemberFormData = z.infer<typeof termMemberFormSchema>;
