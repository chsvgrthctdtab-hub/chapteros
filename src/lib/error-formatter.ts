/**
 * Global Error Formatter & Vietnamese Message Normalizer
 * Translates technical Supabase, PostgreSQL, HTTP, and Network errors
 * into clear, helpful, and professional Vietnamese messages.
 */

export interface FormattedError {
  title: string;
  message: string;
  isPermissionError: boolean;
  isNetworkError: boolean;
  isDuplicateError: boolean;
  isAuthError: boolean;
}

export function formatErrorMessage(error: unknown, fallbackMessage = 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'): FormattedError {
  if (!error) {
    return {
      title: 'Thông báo',
      message: fallbackMessage,
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  const errObj = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};
  const rawMessage = typeof error === 'string' 
    ? error 
    : (errObj.message as string) || (errObj.error_description as string) || (errObj.error as string) || String(error);
  const code = (errObj.code as string) || '';
  const status = (errObj.status as number) || 0;

  const lowerMsg = rawMessage.toLowerCase();

  // 1. Rate Limit / Too Many Requests (429)
  if (
    status === 429 ||
    lowerMsg.includes('429') ||
    lowerMsg.includes('too many requests') ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('quá nhiều yêu cầu') ||
    lowerMsg.includes('vượt giới hạn')
  ) {
    return {
      title: 'Yêu cầu vượt quá giới hạn (HTTP 429)',
      message: 'Hệ thống đang nhận quá nhiều yêu cầu hoặc máy chủ đang tạm thời giới hạn tốc độ. Vui lòng chờ ít phút rồi thử lại.',
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // 2. Network / Connection Errors
  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network error') ||
    lowerMsg.includes('networkrequestfailed') ||
    lowerMsg.includes('abort') ||
    lowerMsg.includes('connection refused') ||
    lowerMsg.includes('timeout')
  ) {
    return {
      title: 'Lỗi kết nối mạng',
      message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối Internet và thử lại.',
      isPermissionError: false,
      isNetworkError: true,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // 2. Authentication / Session Expired
  if (
    status === 401 ||
    code === 'PGRST301' ||
    lowerMsg.includes('jwt') ||
    lowerMsg.includes('token') && lowerMsg.includes('expired') ||
    lowerMsg.includes('invalid claim') ||
    lowerMsg.includes('session not found') ||
    lowerMsg.includes('user not found')
  ) {
    return {
      title: 'Hết phiên đăng nhập',
      message: 'Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: true,
    };
  }

  // 3. Permission / RLS Forbidden (42501 or 403)
  if (
    status === 403 ||
    code === '42501' ||
    lowerMsg.includes('row-level security') ||
    lowerMsg.includes('permission denied') ||
    lowerMsg.includes('insufficient_privilege') ||
    lowerMsg.includes('violates row-level security policy') ||
    lowerMsg.includes('không có quyền')
  ) {
    return {
      title: 'Không có quyền truy cập',
      message: 'Bạn không có quyền thực hiện thao tác này. Vui lòng liên hệ Ban Chấp Hành hoặc Quản trị viên Chi hội.',
      isPermissionError: true,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // 4. Duplicate / Unique Constraint Violation (23505)
  if (
    code === '23505' ||
    lowerMsg.includes('unique constraint') ||
    lowerMsg.includes('already exists') ||
    lowerMsg.includes('đã tồn tại') ||
    lowerMsg.includes('duplicate key')
  ) {
    let duplicateDetail = 'Dữ liệu này đã tồn tại trong Chi hội.';
    if (lowerMsg.includes('student_id') || lowerMsg.includes('mssv')) {
      duplicateDetail = 'Mã số sinh viên này đã được đăng ký cho một hội viên trong Chi hội.';
    } else if (lowerMsg.includes('email')) {
      duplicateDetail = 'Địa chỉ email này đã tồn tại trong hệ thống.';
    } else if (lowerMsg.includes('drive_file_id') || lowerMsg.includes('uq_docs_org_drive')) {
      duplicateDetail = 'Tệp Google Drive này đã được liên kết trong Chi hội hoặc hoạt động tương ứng.';
    } else if (lowerMsg.includes('participant') || lowerMsg.includes('uq_activity_member_participant')) {
      duplicateDetail = 'Hội viên này đã có tên trong danh sách tham gia hoạt động.';
    } else if (lowerMsg.includes('finance_category') || lowerMsg.includes('uq_org_finance_category')) {
      duplicateDetail = 'Danh mục thu/chi cùng tên và loại đã tồn tại trong Chi hội.';
    }

    return {
      title: 'Dữ liệu đã tồn tại',
      message: duplicateDetail,
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: true,
      isAuthError: false,
    };
  }

  // 5. Foreign Key Constraint Violation (23503)
  if (code === '23503' || lowerMsg.includes('foreign key constraint')) {
    return {
      title: 'Không thể xóa dữ liệu liên kết',
      message: 'Không thể xóa dữ liệu này do đang có các bản ghi khác (công việc, giao dịch, hoạt động) liên kết tới.',
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // 6. Record Not Found (PGRST116 or 404)
  if (status === 404 || code === 'PGRST116' || lowerMsg.includes('not found') || lowerMsg.includes('không tìm thấy')) {
    return {
      title: 'Không tìm thấy dữ liệu',
      message: 'Bản ghi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa trước đó.',
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // 7. Supabase Storage Errors
  if (lowerMsg.includes('storage') || lowerMsg.includes('bucket') || lowerMsg.includes('payload too large') || lowerMsg.includes('entity too large')) {
    if (lowerMsg.includes('too large') || lowerMsg.includes('size')) {
      return {
        title: 'Tệp quá dung lượng',
        message: 'Dung lượng tệp vượt quá giới hạn cho phép (tối đa 25MB). Vui lòng chọn tệp nhỏ hơn.',
        isPermissionError: false,
        isNetworkError: false,
        isDuplicateError: false,
        isAuthError: false,
      };
    }
    return {
      title: 'Lỗi lưu trữ tệp',
      message: 'Không thể tải tệp lên hoặc thao tác với bộ lưu trữ. Vui lòng thử lại sau giây lát.',
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // 8. Google OAuth & API Errors
  if (lowerMsg.includes('google') || lowerMsg.includes('oauth') || lowerMsg.includes('popup_closed_by_user')) {
    if (lowerMsg.includes('popup_closed_by_user') || lowerMsg.includes('user cancelled')) {
      return {
        title: 'Đã hủy thao tác',
        message: 'Cửa sổ liên kết Google đã được đóng trước khi hoàn tất xác thực.',
        isPermissionError: false,
        isNetworkError: false,
        isDuplicateError: false,
        isAuthError: false,
      };
    }
    return {
      title: 'Lỗi kết nối Google',
      message: 'Không thể kết nối dịch vụ Google Workspace. Vui lòng kiểm tra quyền truy cập và thử lại.',
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // 9. Validation / Business logic custom message
  if (rawMessage && !rawMessage.startsWith('Error:') && !rawMessage.includes('PostgrestError') && rawMessage.length < 150) {
    return {
      title: 'Lưu ý',
      message: rawMessage.replace(/^Error:\s*/i, ''),
      isPermissionError: false,
      isNetworkError: false,
      isDuplicateError: false,
      isAuthError: false,
    };
  }

  // Default fallback
  return {
    title: 'Đã xảy ra lỗi',
    message: fallbackMessage,
    isPermissionError: false,
    isNetworkError: false,
    isDuplicateError: false,
    isAuthError: false,
  };
}

export const formatError = formatErrorMessage;
