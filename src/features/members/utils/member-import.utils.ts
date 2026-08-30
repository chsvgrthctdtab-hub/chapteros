import * as XLSX from 'xlsx';

export interface ImportedMemberRow {
  rowIndex: number;
  fullName: string;
  studentId: string;
  className: string;
  cohort: string;
  email?: string;
  phone?: string;
  major?: string;
  joinedDate?: string;
  notes?: string;
}

export interface ImportValidationResult {
  valid: ImportedMemberRow[];
  errors: { rowIndex: number; row: Record<string, string>; reason: string }[];
}

const COLUMN_ALIASES: Record<string, string> = {
  'họ và tên': 'fullName', 'ho va ten': 'fullName', 'họ tên': 'fullName', 'ho ten': 'fullName',
  'tên': 'fullName', 'full name': 'fullName', 'fullname': 'fullName', 'name': 'fullName',
  'mssv': 'studentId', 'mã số sinh viên': 'studentId', 'mã sv': 'studentId',
  'student id': 'studentId', 'studentid': 'studentId', 'student_id': 'studentId', 'id': 'studentId',
  'lớp': 'className', 'lop': 'className', 'class': 'className', 'classname': 'className',
  'class name': 'className', 'class_name': 'className',
  'khóa': 'cohort', 'khoa': 'cohort', 'cohort': 'cohort', 'niên khóa': 'cohort',
  'nien khoa': 'cohort', 'năm': 'cohort', 'year': 'cohort',
  'email': 'email', 'e-mail': 'email', 'địa chỉ email': 'email',
  'số điện thoại': 'phone', 'so dien thoai': 'phone', 'sdt': 'phone',
  'phone': 'phone', 'phone number': 'phone', 'điện thoại': 'phone',
  'ngành': 'major', 'nganh': 'major', 'major': 'major', 'chuyên ngành': 'major',
  'ngày tham gia': 'joinedDate', 'ngay tham gia': 'joinedDate', 'joined date': 'joinedDate',
  'joineddate': 'joinedDate', 'joined_date': 'joinedDate',
  'ghi chú': 'notes', 'ghi chu': 'notes', 'notes': 'notes', 'note': 'notes',
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseDate(value: string): string | undefined {
  const trimmed = value.trim();
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2,'0')}-${dmyMatch[1].padStart(2,'0')}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return undefined;
}

export function parseFileToRows(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'binary', raw: false });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false }));
      } catch {
        reject(new Error('Không thể đọc file. Vui lòng kiểm tra định dạng (.xlsx, .xls, .csv).'));
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file.'));
    reader.readAsBinaryString(file);
  });
}

export function validateImportRows(rows: Record<string, string>[]): ImportValidationResult {
  const valid: ImportedMemberRow[] = [];
  const errors: { rowIndex: number; row: Record<string, string>; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const rowIndex = i + 2;
    const mapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const fieldName = COLUMN_ALIASES[normalizeHeader(key)];
      if (fieldName) mapped[fieldName] = String(value || '').trim();
    }

    const fullName = mapped['fullName'] || '';
    const studentId = mapped['studentId'] || '';
    const className = mapped['className'] || '';
    const cohort = mapped['cohort'] || '';

    if (!fullName || fullName.length < 2) { errors.push({ rowIndex, row: raw, reason: 'Thiếu Họ và tên' }); continue; }
    if (!studentId || studentId.length < 2) { errors.push({ rowIndex, row: raw, reason: 'Thiếu MSSV' }); continue; }
    if (!className) { errors.push({ rowIndex, row: raw, reason: 'Thiếu Lớp' }); continue; }
    if (!cohort) { errors.push({ rowIndex, row: raw, reason: 'Thiếu Khóa' }); continue; }

    valid.push({
      rowIndex, fullName, studentId, className, cohort,
      email: mapped['email'] || undefined,
      phone: mapped['phone'] || undefined,
      major: mapped['major'] || undefined,
      joinedDate: mapped['joinedDate'] ? parseDate(mapped['joinedDate']) : undefined,
      notes: mapped['notes'] || undefined,
    });
  }
  return { valid, errors };
}

export function downloadTemplateFile() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Họ và tên', 'MSSV', 'Lớp', 'Khóa', 'Email', 'Số điện thoại', 'Ngành', 'Ngày tham gia', 'Ghi chú'],
    ['Nguyễn Văn An', '2251001', 'CNTT01', 'K22', 'an@email.com', '0901234567', 'Công nghệ thông tin', '01/09/2022', ''],
    ['Trần Thị Bảo', '2251002', 'CNTT01', 'K22', '', '0912345678', '', '', 'Hội viên tích cực'],
  ]);
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách hội viên');
  XLSX.writeFile(wb, 'Mau_import_hoi_vien.xlsx');
}
