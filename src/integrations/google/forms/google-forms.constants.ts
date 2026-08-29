import type { ActivityFormStatus, FormMatchStatus, FormSyncStatus } from '@/types';

export const FORM_STATUS_CONFIG: Record<
  ActivityFormStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  active: {
    label: 'Đã xuất bản (Đang mở đơn)',
    description: 'Biểu mẫu đã xuất bản công khai, đang sẵn sàng nhận câu trả lời từ hội viên.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  draft: {
    label: 'Chưa xuất bản (Bản nháp)',
    description: 'Biểu mẫu đang soạn thảo / chỉnh sửa, chưa công khai nhận đơn cho hội viên.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  closed: {
    label: 'Đã đóng đơn (Ngừng nhận)',
    description: 'Biểu mẫu đã hết hạn hoặc tạm dừng nhận câu trả lời.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const SYNC_STATUS_CONFIG: Record<
  FormSyncStatus,
  {
    label: string;
    badgeClass: string;
  }
> = {
  idle: {
    label: 'Chưa đồng bộ',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  syncing: {
    label: 'Đang đồng bộ...',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
  },
  success: {
    label: 'Đã đồng bộ',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  error: {
    label: 'Lỗi đồng bộ',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export const MATCH_STATUS_CONFIG: Record<
  FormMatchStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
  }
> = {
  matched: {
    label: 'Đã khớp hội viên',
    description: 'Đã nhận diện chuẩn xác theo MSSV/Email và tự động ghi nhận tham gia.',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  unmatched: {
    label: 'Chưa khớp hội viên',
    description: 'Người đăng ký là khách ngoài hoặc MSSV/Email chưa có trong danh sách Chi hội.',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  duplicate: {
    label: 'Đăng ký trùng lặp',
    description: 'Người tham gia đã gửi đơn nhiều lần, hệ thống giữ bản ghi hợp lệ duy nhất.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  invalid: {
    label: 'Dữ liệu không hợp lệ',
    description: 'Thiếu thông tin nhận diện cơ bản.',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export const DEFAULT_FORM_QUESTIONS = [
  'Họ và tên đầy đủ',
  'Mã số sinh viên (MSSV)',
  'Địa chỉ Email',
  'Lớp sinh hoạt / Khoa',
  'Số điện thoại liên lạc',
  'Ý kiến đóng góp / Câu hỏi cho Ban tổ chức',
];
