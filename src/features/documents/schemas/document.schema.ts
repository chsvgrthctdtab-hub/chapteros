import { z } from 'zod';

export const documentUploadFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Vui lòng nhập tên tài liệu / văn bản')
    .max(255, 'Tên tài liệu không được vượt quá 255 ký tự'),
  category: z.enum(
    ['general', 'resolution', 'decision', 'plan', 'report', 'template', 'handover', 'financial_receipt'],
    { error: 'Vui lòng chọn loại danh mục tài liệu' }
  ),
  accessLevel: z.enum(['public', 'internal', 'board_only', 'admin_only'], {
    error: 'Vui lòng chọn mức độ bảo mật',
  }),
  termId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
});

export type DocumentUploadFormData = z.infer<typeof documentUploadFormSchema>;

export const documentEditMetadataFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Vui lòng nhập tên tài liệu / văn bản')
    .max(255, 'Tên tài liệu không được vượt quá 255 ký tự'),
  category: z.enum(
    ['general', 'resolution', 'decision', 'plan', 'report', 'template', 'handover', 'financial_receipt'],
    { error: 'Vui lòng chọn loại danh mục tài liệu' }
  ),
  accessLevel: z.enum(['public', 'internal', 'board_only', 'admin_only'], {
    error: 'Vui lòng chọn mức độ bảo mật',
  }),
  termId: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
});

export type DocumentEditMetadataFormData = z.infer<typeof documentEditMetadataFormSchema>;
