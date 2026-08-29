/**
 * Auth Error Translator
 * Maps raw Supabase / OAuth error strings to clean, user-friendly Vietnamese messages.
 */

export function translateAuthError(error: unknown): string {
  if (!error) return 'Đã có lỗi xảy ra. Vui lòng thử lại.';

  const message = typeof error === 'string' ? error : (error as { message?: string }).message || '';
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
  }

  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'Địa chỉ email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.';
  }

  if (lower.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư đến của bạn để kích hoạt tài khoản.';
  }

  if (lower.includes('password should be at least')) {
    return 'Mật khẩu phải có độ dài ít nhất 6 ký tự.';
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng chờ vài phút rồi thử lại.';
  }

  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra kết nối mạng.';
  }

  if (lower.includes('user not found')) {
    return 'Không tìm thấy tài khoản người dùng tương ứng.';
  }

  if (lower.includes('oauth') || lower.includes('popup')) {
    return 'Đăng nhập bằng Google bị gián đoạn hoặc cửa sổ đăng nhập đã bị đóng.';
  }

  if (lower.includes('missing') && lower.includes('key')) {
    return 'Chưa cấu hình Supabase API keys trên môi trường này.';
  }

  return message || 'Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.';
}
