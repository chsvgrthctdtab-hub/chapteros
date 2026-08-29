import { z } from 'zod';

export const activityFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Tên hoạt động phải có ít nhất 3 ký tự')
      .max(200, 'Tên hoạt động không được vượt quá 200 ký tự'),
    termId: z
      .string()
      .min(1, 'Vui lòng chọn nhiệm kỳ tổ chức'),
    code: z
      .string()
      .trim()
      .max(50, 'Mã hoạt động không quá 50 ký tự')
      .optional()
      .or(z.literal(''))
      .nullable(),
    category: z.enum(
      ['general', 'volunteer', 'academic', 'sports', 'culture', 'meeting', 'training'],
      {
        error: 'Vui lòng chọn phân loại hoạt động hợp lệ',
      }
    ),
    status: z.enum(
      ['draft', 'planning', 'published', 'in_progress', 'completed', 'cancelled'],
      {
        error: 'Vui lòng chọn trạng thái hợp lệ',
      }
    ),
    location: z
      .string()
      .trim()
      .max(255, 'Địa điểm không quá 255 ký tự')
      .optional()
      .or(z.literal(''))
      .nullable(),
    startDate: z
      .string()
      .min(1, 'Vui lòng chọn thời gian bắt đầu'),
    endDate: z
      .string()
      .min(1, 'Vui lòng chọn thời gian kết thúc'),
    targetMembers: z
      .coerce
      .number({
        message: 'Số lượng người tham gia dự kiến phải là số',
      })
      .int('Số lượng phải là số nguyên')
      .min(0, 'Số lượng dự kiến không thể nhỏ hơn 0')
      .max(10000, 'Số lượng dự kiến tối đa 10,000 người')
      .default(0),
    bannerUrl: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .nullable(),
    leadMemberId: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .nullable(),
    description: z
      .string()
      .trim()
      .max(3000, 'Mô tả không được vượt quá 3000 ký tự')
      .optional()
      .or(z.literal(''))
      .nullable(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end >= start;
    },
    {
      message: 'Thời gian kết thúc không được trước thời gian bắt đầu',
      path: ['endDate'],
    }
  );

export type ActivityFormData = z.infer<typeof activityFormSchema>;

export const addParticipantSchema = z.object({
  memberId: z
    .string()
    .min(1, 'Vui lòng chọn hội viên tham gia'),
  registrationStatus: z
    .enum(['registered', 'confirmed', 'waitlist', 'cancelled'], {
      error: 'Trạng thái đăng ký không hợp lệ',
    })
    .default('registered'),
  attendanceStatus: z
    .enum(['unmarked', 'present', 'absent', 'excused'], {
      error: 'Trạng thái điểm danh không hợp lệ',
    })
    .default('unmarked'),
  notes: z
    .string()
    .trim()
    .max(500, 'Ghi chú không quá 500 ký tự')
    .optional()
    .or(z.literal(''))
    .nullable(),
});

export type AddParticipantFormData = z.infer<typeof addParticipantSchema>;

export const updateParticipantSchema = z.object({
  registrationStatus: z
    .enum(['registered', 'confirmed', 'waitlist', 'cancelled'])
    .optional(),
  attendanceStatus: z
    .enum(['unmarked', 'present', 'absent', 'excused'])
    .optional(),
  attendedAt: z
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

export type UpdateParticipantFormData = z.infer<typeof updateParticipantSchema>;
