/**
 * Danh sách 13 Ngành đào tạo chuẩn theo hệ thống đào tạo Đại học Y Dược (CTUMP)
 */
export const OFFICIAL_MAJORS = [
  'Y khoa',
  'Răng Hàm Mặt',
  'Y học cổ truyền',
  'Y học dự phòng',
  'Dược học',
  'Kỹ thuật Y sinh khối A',
  'Kỹ thuật Y sinh khối B',
  'Điều dưỡng',
  'Hộ sinh',
  'Y tế công cộng',
  'Kỹ thuật xét nghiệm y học',
  'Kỹ thuật hình ảnh y học',
  'Dinh dưỡng',
] as const;

export type OfficialMajor = (typeof OFFICIAL_MAJORS)[number];

/**
 * Suy luận Tên Ngành từ chuỗi văn bản (tên lớp, ký hiệu viết tắt, hoặc tên ngành)
 */
export function inferMajorFromText(text?: string | null): string | null {
  if (!text) return null;
  const clean = text.trim();
  if (!clean) return null;

  const lower = clean.toLowerCase();

  // 1. Y học cổ truyền (YHCT)
  if (
    /\byhct\b/i.test(clean) ||
    /^yhct[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'YHCT' ||
    lower.includes('y học cổ truyền') ||
    lower.includes('y hoc co truyen')
  ) {
    return 'Y học cổ truyền';
  }

  // 2. Y học dự phòng (YHDP)
  if (
    /\byhdp\b/i.test(clean) ||
    /^yhdp[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'YHDP' ||
    lower.includes('y học dự phòng') ||
    lower.includes('y hoc du phong')
  ) {
    return 'Y học dự phòng';
  }

  // 3. Răng Hàm Mặt (RHM)
  if (
    /\brhm\b/i.test(clean) ||
    /^rhm[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'RHM' ||
    lower.includes('răng hàm mặt') ||
    lower.includes('rang ham mat')
  ) {
    return 'Răng Hàm Mặt';
  }

  // 4. Kỹ thuật Y sinh khối A / B
  if (
    /\bktys\s*a\b/i.test(clean) ||
    /\bktysa\b/i.test(clean) ||
    lower.includes('y sinh khối a') ||
    lower.includes('y sinh khoi a')
  ) {
    return 'Kỹ thuật Y sinh khối A';
  }
  if (
    /\bktys\s*b\b/i.test(clean) ||
    /\bktysb\b/i.test(clean) ||
    lower.includes('y sinh khối b') ||
    lower.includes('y sinh khoi b')
  ) {
    return 'Kỹ thuật Y sinh khối B';
  }
  if (
    /\bktys\b/i.test(clean) ||
    lower.includes('kỹ thuật y sinh') ||
    lower.includes('ky thuat y sinh')
  ) {
    return 'Kỹ thuật Y sinh khối A';
  }

  // 5. Kỹ thuật xét nghiệm y học (XNYH, KTXN, XN)
  if (
    /\b(xnyh|ktxn)\b/i.test(clean) ||
    /^xn[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'XN' ||
    lower.includes('xét nghiệm') ||
    lower.includes('xet nghiem')
  ) {
    return 'Kỹ thuật xét nghiệm y học';
  }

  // 6. Kỹ thuật hình ảnh y học (KTHAYH, KTHA, HA)
  if (
    /\b(kthayh|ktha)\b/i.test(clean) ||
    /^ha[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'HA' ||
    lower.includes('hình ảnh y học') ||
    lower.includes('hinh anh y hoc') ||
    lower.includes('kỹ thuật hình ảnh')
  ) {
    return 'Kỹ thuật hình ảnh y học';
  }

  // 7. Y tế công cộng (YTCC)
  if (
    /\bytcc\b/i.test(clean) ||
    /^ytcc[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'YTCC' ||
    lower.includes('y tế công cộng') ||
    lower.includes('y te cong cong')
  ) {
    return 'Y tế công cộng';
  }

  // 8. Dinh dưỡng (DDG)
  if (
    /\bddg\b/i.test(clean) ||
    /^ddg[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'DDG' ||
    lower.includes('dinh dưỡng') ||
    lower.includes('dinh duong')
  ) {
    return 'Dinh dưỡng';
  }

  // 9. Điều dưỡng (ĐD, DD) - kiểm tra sau Dinh dưỡng để không nhầm DDG
  if (
    /^đd[\s\d_a-z]/i.test(clean) ||
    /^dd[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'ĐD' ||
    clean.toUpperCase() === 'DD' ||
    lower.includes('điều dưỡng') ||
    lower.includes('dieu duong')
  ) {
    return 'Điều dưỡng';
  }

  // 10. Hộ sinh (HS)
  if (
    /^hs[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'HS' ||
    lower.includes('hộ sinh') ||
    lower.includes('ho sinh')
  ) {
    return 'Hộ sinh';
  }

  // 11. Dược học (Dược, DH)
  if (
    /\b(dược|duoc)\b/i.test(clean) ||
    /^dh[\s\d_a-z]/i.test(clean) ||
    clean.toUpperCase() === 'DH' ||
    lower.includes('dược học') ||
    lower.includes('duoc hoc')
  ) {
    return 'Dược học';
  }

  // 12. Y khoa (YA, YB, YC, YD, YE, YF, YG, YH, YK, Y49, Y50, Y51, Y khoa...)
  // Kiểm tra sau các ngành có tiền tố Y khác như YHCT, YHDP, YTCC
  if (
    /^y[a-z0-9]/i.test(clean) ||
    /\b(yk|ykhoa)\b/i.test(clean) ||
    clean.toUpperCase() === 'Y' ||
    /^y[\s\d_]/i.test(clean) ||
    lower.includes('y khoa') ||
    lower.includes('y đa khoa') ||
    lower.includes('y da khoa')
  ) {
    return 'Y khoa';
  }

  return null;
}

/**
 * Lấy Tên Ngành hiển thị:
 * 1. Nếu có ngành đã nhập (khác rỗng và khác 'Chưa cập nhật'), chuẩn hóa theo danh mục
 * 2. Nếu chưa có hoặc là 'Chưa cập nhật', tự động suy luận từ Tên lớp (className)
 * 3. Nếu vẫn không nhận diện được, trả về fallback (mặc định 'Chưa cập nhật')
 */
export function getMajorFromClassOrValue(
  className?: string | null,
  explicitMajor?: string | null,
  fallback = 'Chưa cập nhật'
): string {
  if (
    explicitMajor &&
    explicitMajor.trim() &&
    explicitMajor.trim().toLowerCase() !== 'chưa cập nhật' &&
    explicitMajor.trim().toLowerCase() !== 'chưa cập nhật ngành'
  ) {
    const trimmed = explicitMajor.trim();
    const matched = inferMajorFromText(trimmed);
    return matched || trimmed;
  }

  if (className && className.trim()) {
    const inferred = inferMajorFromText(className);
    if (inferred) return inferred;
  }

  return fallback;
}
