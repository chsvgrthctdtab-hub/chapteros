import { z } from 'zod';
import type { FinanceType } from '../types/finance.types';

export const transactionFormSchema = z.object({
  transactionType: z.enum(['income', 'expense'], {
    message: 'Vui lòng chọn loại giao dịch (Thu hoặc Chi)',
  }),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục thu / chi'),
  termId: z.string().min(1, 'Vui lòng chọn nhiệm kỳ ghi nhận'),
  amount: z
    .coerce
    .number()
    .positive('Số tiền giao dịch phải lớn hơn 0 ₫')
    .max(10_000_000_000, 'Số tiền giao dịch không vượt quá 10 tỷ VNĐ'),
  transactionDate: z.string().min(1, 'Vui lòng chọn ngày phát sinh giao dịch'),
  description: z
    .string()
    .min(3, 'Nội dung giao dịch phải có ít nhất 3 ký tự')
    .max(1000, 'Nội dung giao dịch tối đa 1000 ký tự'),
  activityId: z.string().optional().nullable(),
  receiptUrl: z
    .string()
    .url('Đường dẫn chứng từ phải là URL hợp lệ (https://...)')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export interface TransactionFormData {
  transactionType: FinanceType;
  categoryId: string;
  termId: string;
  amount: number;
  transactionDate: string;
  description: string;
  activityId?: string | null;
  receiptUrl?: string | null;
}

export const categoryFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Tên danh mục phải có ít nhất 2 ký tự')
    .max(100, 'Tên danh mục tối đa 100 ký tự'),
  type: z.enum(['income', 'expense'], {
    message: 'Vui lòng chọn loại danh mục (Thu hoặc Chi)',
  }),
  description: z.string().max(300, 'Mô tả danh mục tối đa 300 ký tự').optional().nullable(),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;
