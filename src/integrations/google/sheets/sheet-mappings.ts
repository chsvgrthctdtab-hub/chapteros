import type { GoogleSheetModule, ColumnMappingField, ColumnMappingConfig } from './google-sheets.types';
import type {
  Member,
  Activity,
  Task,
  ActivityParticipant,
  FinanceTransaction,
} from '@/types';

// ==============================================================================
// 1. MODULE COLUMN FIELD SCHEMAS
// ==============================================================================

export const MEMBER_FIELDS: ColumnMappingField[] = [
  {
    key: 'studentId',
    label: 'MSSV',
    aliases: ['mssv', 'mã số sv', 'mã sinh viên', 'mã số sinh viên', 'student_id', 'student id', 'student_code'],
    dataType: 'string',
    isRequired: true,
    isIdentityKey: true,
    description: 'Mã số sinh viên duy nhất của hội viên',
    sampleValue: 'B2101234',
  },
  {
    key: 'fullName',
    label: 'Họ và tên',
    aliases: ['họ và tên', 'họ tên', 'tên hội viên', 'full_name', 'full name', 'name', 'họ & tên'],
    dataType: 'string',
    isRequired: true,
    description: 'Họ và tên đầy đủ',
    sampleValue: 'Nguyễn Văn An',
  },
  {
    key: 'email',
    label: 'Email',
    aliases: ['email', 'thư điện tử', 'gmail', 'e-mail'],
    dataType: 'email',
    isRequired: false,
    description: 'Địa chỉ thư điện tử',
    sampleValue: 'an.nv@student.edu.vn',
  },
  {
    key: 'phone',
    label: 'Số điện thoại',
    aliases: ['số điện thoại', 'sđt', 'điện thoại', 'phone', 'phone_number', 'mobile'],
    dataType: 'phone',
    isRequired: false,
    description: 'Số điện thoại liên lạc',
    sampleValue: '0912345678',
  },
  {
    key: 'className',
    label: 'Lớp',
    aliases: ['lớp', 'lớp sinh hoạt', 'mã lớp', 'class', 'class_name'],
    dataType: 'string',
    isRequired: false,
    description: 'Lớp sinh hoạt chính khóa',
    sampleValue: 'DI21V7A1',
  },
  {
    key: 'major',
    label: 'Chuyên ngành',
    aliases: ['chuyên ngành', 'ngành', 'ngành học', 'major'],
    dataType: 'string',
    isRequired: false,
    description: 'Ngành hoặc chuyên ngành đào tạo',
    sampleValue: 'Công nghệ thông tin',
  },
  {
    key: 'cohort',
    label: 'Khóa',
    aliases: ['khóa', 'niên khóa', 'cohort', 'k'],
    dataType: 'string',
    isRequired: false,
    description: 'Khóa sinh viên (VD: K47)',
    sampleValue: 'K47',
  },
  {
    key: 'position',
    label: 'Chức vụ',
    aliases: ['chức vụ', 'chức vụ chi hội', 'vai trò', 'position', 'role'],
    dataType: 'string',
    isRequired: false,
    description: 'Chức vụ trong Chi hội (Hội viên, Chi hội trưởng...)',
    sampleValue: 'Hội viên',
  },
  {
    key: 'status',
    label: 'Trạng thái',
    aliases: ['trạng thái', 'tình trạng', 'status', 'trạng thái hội viên'],
    dataType: 'enum',
    isRequired: false,
    description: 'Trạng thái hoạt động (active, alumni)',
    sampleValue: 'Đang hoạt động',
    enumOptions: [
      { value: 'active', label: 'Đang hoạt động', aliases: ['active', 'đang hoạt động', 'hoạt động', 'bình thường'] },
      { value: 'alumni', label: 'Cựu hội viên', aliases: ['alumni', 'cựu hội viên', 'ra trường', 'đã tốt nghiệp'] },
    ],
  },
  {
    key: 'joinedDate',
    label: 'Ngày tham gia',
    aliases: ['ngày tham gia', 'ngày gia nhập', 'ngày vào hội', 'joined_date', 'joined date'],
    dataType: 'date',
    isRequired: false,
    description: 'Ngày kết nạp hoặc bắt đầu sinh hoạt',
    sampleValue: '2023-09-15',
  },
  {
    key: 'notes',
    label: 'Ghi chú',
    aliases: ['ghi chú', 'nhận xét', 'notes', 'note'],
    dataType: 'string',
    isRequired: false,
    description: 'Thông tin ghi chú thêm',
    sampleValue: '',
  },
];

export const ACTIVITY_FIELDS: ColumnMappingField[] = [
  {
    key: 'code',
    label: 'Mã hoạt động',
    aliases: ['mã hoạt động', 'mã sự kiện', 'code', 'activity_code'],
    dataType: 'string',
    isRequired: false,
    description: 'Mã ký hiệu hoạt động',
    sampleValue: 'HD-2026-01',
  },
  {
    key: 'title',
    label: 'Tên hoạt động',
    aliases: ['tên hoạt động', 'tiêu đề', 'tên sự kiện', 'title', 'activity_name', 'tên'],
    dataType: 'string',
    isRequired: true,
    isIdentityKey: true,
    description: 'Tên hoặc chủ đề chương trình',
    sampleValue: 'Chiến dịch Mùa Hè Xanh 2026',
  },
  {
    key: 'category',
    label: 'Danh mục',
    aliases: ['danh mục', 'thể loại', 'loại hoạt động', 'category', 'mảng'],
    dataType: 'enum',
    isRequired: false,
    description: 'Mảng hoạt động (volunteer, academic, sports, culture, meeting, training, general)',
    sampleValue: 'Tình nguyện',
    enumOptions: [
      { value: 'volunteer', label: 'Tình nguyện', aliases: ['tình nguyện', 'từ thiện', 'xã hội', 'volunteer'] },
      { value: 'academic', label: 'Học thuật', aliases: ['học thuật', 'nghiên cứu', 'học tập', 'academic'] },
      { value: 'sports', label: 'Thể thao', aliases: ['thể thao', 'hội thao', 'sports'] },
      { value: 'culture', label: 'Văn nghệ / Giao lưu', aliases: ['văn nghệ', 'văn hóa', 'giao lưu', 'culture'] },
      { value: 'meeting', label: 'Họp / Đại hội', aliases: ['họp', 'đại hội', 'sinh hoạt', 'meeting'] },
      { value: 'training', label: 'Tập huấn', aliases: ['tập huấn', 'kỹ năng', 'đào tạo', 'training'] },
      { value: 'general', label: 'Hoạt động chung', aliases: ['chung', 'khác', 'general'] },
    ],
  },
  {
    key: 'status',
    label: 'Trạng thái',
    aliases: ['trạng thái', 'tiến độ', 'tình trạng', 'status'],
    dataType: 'enum',
    isRequired: false,
    description: 'Trạng thái tổ chức (draft, planning, published, in_progress, completed, cancelled)',
    sampleValue: 'Đã lên kế hoạch',
    enumOptions: [
      { value: 'draft', label: 'Bản nháp', aliases: ['nháp', 'draft'] },
      { value: 'planning', label: 'Lập kế hoạch', aliases: ['kế hoạch', 'lập kế hoạch', 'planning'] },
      { value: 'published', label: 'Đã công bố', aliases: ['công bố', 'mở đăng ký', 'published'] },
      { value: 'in_progress', label: 'Đang diễn ra', aliases: ['đang diễn ra', 'tiến hành', 'in_progress'] },
      { value: 'completed', label: 'Đã hoàn thành', aliases: ['hoàn thành', 'kết thúc', 'completed'] },
      { value: 'cancelled', label: 'Đã hủy', aliases: ['đã hủy', 'hủy', 'cancelled'] },
    ],
  },
  {
    key: 'location',
    label: 'Địa điểm',
    aliases: ['địa điểm', 'nơi tổ chức', 'vị trí', 'location', 'địa chỉ'],
    dataType: 'string',
    isRequired: false,
    description: 'Nơi diễn ra hoạt động',
    sampleValue: 'Hội trường B1, Trường Đại học Cần Thơ',
  },
  {
    key: 'startDate',
    label: 'Thời gian bắt đầu',
    aliases: ['thời gian bắt đầu', 'ngày bắt đầu', 'bắt đầu', 'start_date', 'start date', 'từ ngày'],
    dataType: 'date',
    isRequired: true,
    description: 'Ngày và giờ bắt đầu',
    sampleValue: '2026-08-20 07:30',
  },
  {
    key: 'endDate',
    label: 'Thời gian kết thúc',
    aliases: ['thời gian kết thúc', 'ngày kết thúc', 'kết thúc', 'end_date', 'end date', 'đến ngày'],
    dataType: 'date',
    isRequired: true,
    description: 'Ngày và giờ kết thúc',
    sampleValue: '2026-08-20 17:00',
  },
  {
    key: 'targetMembers',
    label: 'Chỉ tiêu số lượng',
    aliases: ['chỉ tiêu số lượng', 'số lượng dự kiến', 'chỉ tiêu', 'target_members', 'quota'],
    dataType: 'number',
    isRequired: false,
    description: 'Số lượng hội viên dự kiến tham gia',
    sampleValue: 50,
  },
  {
    key: 'description',
    label: 'Mô tả hoạt động',
    aliases: ['mô tả hoạt động', 'mô tả', 'nội dung', 'description', 'kế hoạch chi tiết'],
    dataType: 'string',
    isRequired: false,
    description: 'Mục đích và nội dung chi tiết',
    sampleValue: 'Tổ chức sinh hoạt chuyên đề và giao lưu kỹ năng',
  },
];

export const TASK_FIELDS: ColumnMappingField[] = [
  {
    key: 'title',
    label: 'Tên nhiệm vụ',
    aliases: ['tên nhiệm vụ', 'tiêu đề', 'công việc', 'nhiệm vụ', 'title', 'task_name', 'nội dung công việc'],
    dataType: 'string',
    isRequired: true,
    isIdentityKey: true,
    description: 'Tiêu đề công việc cần thực hiện',
    sampleValue: 'Thiết kế backdrop và banner tuyên truyền',
  },
  {
    key: 'description',
    label: 'Mô tả chi tiết',
    aliases: ['mô tả chi tiết', 'mô tả', 'nội dung', 'description'],
    dataType: 'string',
    isRequired: false,
    description: 'Hướng dẫn và yêu cầu công việc',
    sampleValue: 'Kích thước 3m x 2m, phong cách trẻ trung năng động',
  },
  {
    key: 'priority',
    label: 'Mức độ ưu tiên',
    aliases: ['mức độ ưu tiên', 'độ ưu tiên', 'ưu tiên', 'priority'],
    dataType: 'enum',
    isRequired: false,
    description: 'Mức độ ưu tiên (low, medium, high, urgent)',
    sampleValue: 'Cao',
    enumOptions: [
      { value: 'low', label: 'Thấp', aliases: ['thấp', 'low'] },
      { value: 'medium', label: 'Trung bình', aliases: ['trung bình', 'vừa', 'medium'] },
      { value: 'high', label: 'Cao', aliases: ['cao', 'high'] },
      { value: 'urgent', label: 'Khẩn cấp', aliases: ['khẩn cấp', 'gấp', 'urgent'] },
    ],
  },
  {
    key: 'status',
    label: 'Trạng thái',
    aliases: ['trạng thái', 'tiến độ', 'status'],
    dataType: 'enum',
    isRequired: false,
    description: 'Trạng thái công việc (todo, in_progress, in_review, completed, cancelled)',
    sampleValue: 'Đang làm',
    enumOptions: [
      { value: 'todo', label: 'Cần làm', aliases: ['cần làm', 'chưa làm', 'todo'] },
      { value: 'in_progress', label: 'Đang thực hiện', aliases: ['đang thực hiện', 'đang làm', 'in_progress'] },
      { value: 'in_review', label: 'Đang kiểm duyệt', aliases: ['kiểm duyệt', 'chờ duyệt', 'in_review'] },
      { value: 'completed', label: 'Đã hoàn thành', aliases: ['hoàn thành', 'xong', 'completed'] },
      { value: 'cancelled', label: 'Đã hủy', aliases: ['đã hủy', 'hủy', 'cancelled'] },
    ],
  },
  {
    key: 'progress',
    label: 'Tiến độ (%)',
    aliases: ['tiến độ (%)', 'tiến độ', '% hoàn thành', 'progress', 'percentage'],
    dataType: 'number',
    isRequired: false,
    description: 'Tỷ lệ hoàn thành từ 0 đến 100%',
    sampleValue: 75,
  },
  {
    key: 'dueDate',
    label: 'Hạn hoàn thành',
    aliases: ['hạn hoàn thành', 'hạn chót', 'deadline', 'due_date', 'due date', 'ngày hết hạn'],
    dataType: 'date',
    isRequired: false,
    description: 'Ngày và giờ hạn chót',
    sampleValue: '2026-08-18',
  },
];

export const PARTICIPANT_FIELDS: ColumnMappingField[] = [
  {
    key: 'studentId',
    label: 'MSSV',
    aliases: ['mssv', 'mã số sv', 'mã sinh viên', 'student_id', 'student id'],
    dataType: 'string',
    isRequired: true,
    isIdentityKey: true,
    description: 'Mã số sinh viên của người tham gia',
    sampleValue: 'B2109876',
  },
  {
    key: 'fullName',
    label: 'Họ và tên',
    aliases: ['họ và tên', 'họ tên', 'người tham gia', 'full_name', 'name'],
    dataType: 'string',
    isRequired: true,
    description: 'Họ và tên người tham gia',
    sampleValue: 'Trần Thị Bích',
  },
  {
    key: 'registrationStatus',
    label: 'Trạng thái đăng ký',
    aliases: ['trạng thái đăng ký', 'tình trạng đăng ký', 'registration_status'],
    dataType: 'enum',
    isRequired: false,
    description: 'Trạng thái đăng ký (registered, confirmed, cancelled, waitlist)',
    sampleValue: 'Đã xác nhận',
    enumOptions: [
      { value: 'registered', label: 'Đã đăng ký', aliases: ['đã đăng ký', 'registered'] },
      { value: 'confirmed', label: 'Đã xác nhận', aliases: ['xác nhận', 'confirmed'] },
      { value: 'waitlist', label: 'Danh sách chờ', aliases: ['chờ', 'waitlist'] },
      { value: 'cancelled', label: 'Đã hủy đăng ký', aliases: ['hủy', 'cancelled'] },
    ],
  },
  {
    key: 'attendanceStatus',
    label: 'Trạng thái điểm danh',
    aliases: ['trạng thái điểm danh', 'điểm danh', 'chuyên cần', 'attendance_status', 'có mặt'],
    dataType: 'enum',
    isRequired: false,
    description: 'Trạng thái có mặt (present, absent, excused, unmarked)',
    sampleValue: 'Có mặt',
    enumOptions: [
      { value: 'present', label: 'Có mặt', aliases: ['có mặt', 'tham gia', 'present'] },
      { value: 'absent', label: 'Vắng mặt', aliases: ['vắng', 'vắng mặt', 'absent'] },
      { value: 'excused', label: 'Có phép', aliases: ['có phép', 'vắng có phép', 'excused'] },
      { value: 'unmarked', label: 'Chưa điểm danh', aliases: ['chưa điểm danh', 'unmarked'] },
    ],
  },
  {
    key: 'attendedAt',
    label: 'Thời gian điểm danh',
    aliases: ['thời gian điểm danh', 'giờ điểm danh', 'attended_at'],
    dataType: 'date',
    isRequired: false,
    description: 'Thời điểm quét hoặc ghi nhận điểm danh',
    sampleValue: '2026-08-20 07:45',
  },
  {
    key: 'source',
    label: 'Nguồn đăng ký',
    aliases: ['nguồn đăng ký', 'nguồn', 'source', 'kênh đăng ký'],
    dataType: 'string',
    isRequired: false,
    description: 'Google Forms, thủ công, hoặc hệ thống',
    sampleValue: 'google_form',
  },
  {
    key: 'notes',
    label: 'Ghi chú',
    aliases: ['ghi chú', 'nhận xét', 'notes'],
    dataType: 'string',
    isRequired: false,
    description: 'Ghi chú người tham gia',
    sampleValue: '',
  },
];

export const FINANCE_FIELDS: ColumnMappingField[] = [
  {
    key: 'transactionDate',
    label: 'Ngày giao dịch',
    aliases: ['ngày giao dịch', 'ngày chứng từ', 'ngày', 'transaction_date', 'date', 'ngày thu/chi'],
    dataType: 'date',
    isRequired: true,
    description: 'Ngày phát sinh khoản thu hoặc chi',
    sampleValue: '2026-08-10',
  },
  {
    key: 'transactionType',
    label: 'Loại giao dịch (Thu/Chi)',
    aliases: ['loại giao dịch', 'thu/chi', 'loại', 'transaction_type', 'type', 'khoản thu chi'],
    dataType: 'enum',
    isRequired: true,
    description: 'Khoản thu hoặc khoản chi',
    sampleValue: 'Chi',
    enumOptions: [
      { value: 'income', label: 'Thu', aliases: ['thu', 'khoản thu', 'income', '+'] },
      { value: 'expense', label: 'Chi', aliases: ['chi', 'khoản chi', 'expense', '-'] },
    ],
  },
  {
    key: 'amount',
    label: 'Số tiền (VNĐ)',
    aliases: ['số tiền', 'số tiền (vnđ)', 'số tiền (đ)', 'amount', 'tiền', 'giá trị'],
    dataType: 'number',
    isRequired: true,
    description: 'Số tiền thực tế (chỉ ghi số nguyên dương, VD: 1500000)',
    sampleValue: 1500000,
  },
  {
    key: 'categoryName',
    label: 'Danh mục thu chi',
    aliases: ['danh mục thu chi', 'danh mục', 'khoản mục', 'category', 'category_name'],
    dataType: 'string',
    isRequired: true,
    description: 'Tên danh mục thu/chi (Hội phí, Quỹ hoạt động, In ấn...)',
    sampleValue: 'Nước uống & Hậu cần',
  },
  {
    key: 'description',
    label: 'Nội dung / Diễn giải',
    aliases: ['nội dung / diễn giải', 'nội dung', 'mô tả', 'diễn giải', 'lý do', 'description'],
    dataType: 'string',
    isRequired: true,
    description: 'Chi tiết mục đích của khoản thu chi',
    sampleValue: 'Mua nước suối và bánh ngọt phục vụ đại biểu buổi họp Chi hội',
  },
  {
    key: 'recordedByName',
    label: 'Người ghi nhận',
    aliases: ['người ghi nhận', 'thủ quỹ', 'người lập', 'recorded_by', 'recorder'],
    dataType: 'string',
    isRequired: false,
    description: 'Cán bộ thực hiện ghi sổ quỹ',
    sampleValue: 'Lê Văn C (Thủ quỹ)',
  },
  {
    key: 'id',
    label: 'Mã định danh (ID)',
    aliases: ['mã định danh', 'mã giao dịch', 'id', 'transaction_id'],
    dataType: 'string',
    isRequired: false,
    description: 'Mã định danh giao dịch nếu xuất từ hệ thống',
    sampleValue: '',
  },
];

// ==============================================================================
// 2. HELPER FUNCTIONS FOR MAPPINGS
// ==============================================================================

export function getModuleFields(module: GoogleSheetModule): ColumnMappingField[] {
  switch (module) {
    case 'members':
      return MEMBER_FIELDS;
    case 'activities':
      return ACTIVITY_FIELDS;
    case 'tasks':
      return TASK_FIELDS;
    case 'participants':
      return PARTICIPANT_FIELDS;
    case 'finance':
      return FINANCE_FIELDS;
    default:
      return [];
  }
}

/**
 * Clean & normalize a string for header matching
 */
function normalizeHeaderString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Auto-detect column mapping from sheet headers to database field keys
 */
export function autoMapSheetHeaders(
  sheetHeaders: string[],
  module: GoogleSheetModule
): ColumnMappingConfig {
  const fields = getModuleFields(module);
  const mapping: ColumnMappingConfig = {};
  const matchedFieldKeys = new Set<string>();

  for (const rawHeader of sheetHeaders) {
    if (!rawHeader) continue;
    const cleanHeader = normalizeHeaderString(rawHeader);

    let bestMatchKey: string | null = null;

    for (const field of fields) {
      if (matchedFieldKeys.has(field.key)) continue;

      // 1. Direct label match
      if (normalizeHeaderString(field.label) === cleanHeader) {
        bestMatchKey = field.key;
        break;
      }

      // 2. Direct key match
      if (normalizeHeaderString(field.key) === cleanHeader) {
        bestMatchKey = field.key;
        break;
      }

      // 3. Aliases match
      const aliasMatch = field.aliases.some(
        (alias) => normalizeHeaderString(alias) === cleanHeader
      );
      if (aliasMatch) {
        bestMatchKey = field.key;
        break;
      }
    }

    if (bestMatchKey) {
      mapping[rawHeader] = bestMatchKey;
      matchedFieldKeys.add(bestMatchKey);
    }
  }

  return mapping;
}

/**
 * Standard Header Array for Exporting to Sheets
 */
export function getStandardExportHeaders(module: GoogleSheetModule): string[] {
  const fields = getModuleFields(module);
  return fields.map((f) => f.label);
}

/**
 * Transform domain objects to tabular array for Google Sheets export
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function getRecordValue(record: Record<string, unknown>, key: string): unknown {
  if (record[key] !== undefined && record[key] !== null) return record[key];
  const snakeKey = camelToSnake(key);
  if (record[snakeKey] !== undefined && record[snakeKey] !== null) return record[snakeKey];
  return undefined;
}

/**
 * Transforms raw database/domain objects into 2D tabular array for Sheet export & CSV download
 */
/**
 * Parses raw CSV or TSV string into structured headers and rows adhering to RFC 4180
 * (supports quoted fields, delimiters inside quotes, escaped quotes "", multiline values)
 */
export function parseCsvOrTsv(content: string): { headers: string[]; rows: Array<Record<string, unknown>> } {
  if (!content || !content.trim()) {
    return { headers: [], rows: [] };
  }

  // Remove UTF-8 BOM if present
  let text = content;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  // Detect delimiter from first non-empty line
  const firstLine = text.split(/\r?\n/)[0] || '';
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

  const records: string[][] = [];
  let currentRecord: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }

      if (char === delimiter) {
        currentRecord.push(currentField.trim());
        currentField = '';
        i++;
        continue;
      }

      if (char === '\r') {
        if (nextChar === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRecord.push(currentField.trim());
        if (currentRecord.some((f) => f.length > 0)) {
          records.push(currentRecord);
        }
        currentRecord = [];
        currentField = '';
        continue;
      }

      if (char === '\n') {
        currentRecord.push(currentField.trim());
        if (currentRecord.some((f) => f.length > 0)) {
          records.push(currentRecord);
        }
        currentRecord = [];
        currentField = '';
        i++;
        continue;
      }

      currentField += char;
      i++;
    }
  }

  // Flush remaining field/record
  if (currentField.length > 0 || currentRecord.length > 0) {
    currentRecord.push(currentField.trim());
    if (currentRecord.some((f) => f.length > 0)) {
      records.push(currentRecord);
    }
  }

  if (records.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = records[0].map((h) => h.trim()).filter(Boolean);
  const rows: Array<Record<string, unknown>> = [];

  for (let r = 1; r < records.length; r++) {
    const rowValues = records[r];
    if (!rowValues || rowValues.every((v) => !v)) continue;

    const rowObj: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = rowValues[idx] !== undefined ? rowValues[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

export function formatDataForSheetExport(
  data: unknown[],
  module: GoogleSheetModule
): Array<Array<string | number | boolean | null>> {
  const fields = getModuleFields(module);
  const headers = fields.map((f) => f.label);

  const rows: Array<Array<string | number | boolean | null>> = [headers];

  for (const item of data) {
    const row: Array<string | number | boolean | null> = [];
    const record = item as Record<string, unknown>;

    for (const field of fields) {
      let value: unknown = getRecordValue(record, field.key);

      // Handle custom getters / formatting
      if (module === 'members') {
        const rawStatus = String(getRecordValue(record, 'status') || '');
        if (field.key === 'status') {
          value =
            rawStatus === 'active'
              ? 'Đang hoạt động'
              : rawStatus === 'alumni'
              ? 'Cựu hội viên'
              : rawStatus;
        }
      } else if (module === 'activities') {
        const rawCat = String(getRecordValue(record, 'category') || '');
        const rawStatus = String(getRecordValue(record, 'status') || '');
        if (field.key === 'category') {
          const catMap: Record<string, string> = {
            volunteer: 'Tình nguyện',
            academic: 'Học thuật',
            sports: 'Thể thao',
            culture: 'Văn nghệ / Giao lưu',
            meeting: 'Họp / Đại hội',
            training: 'Tập huấn',
            general: 'Hoạt động chung',
          };
          value = catMap[rawCat] || rawCat;
        } else if (field.key === 'status') {
          const statusMap: Record<string, string> = {
            draft: 'Bản nháp',
            planning: 'Lập kế hoạch',
            published: 'Đã công bố',
            in_progress: 'Đang diễn ra',
            completed: 'Đã hoàn thành',
            cancelled: 'Đã hủy',
          };
          value = statusMap[rawStatus] || rawStatus;
        }
      } else if (module === 'tasks') {
        const rawPrio = String(getRecordValue(record, 'priority') || '');
        const rawStatus = String(getRecordValue(record, 'status') || '');
        if (field.key === 'priority') {
          const prioMap: Record<string, string> = {
            low: 'Thấp',
            medium: 'Trung bình',
            high: 'Cao',
            urgent: 'Khẩn cấp',
          };
          value = prioMap[rawPrio] || rawPrio;
        } else if (field.key === 'status') {
          const taskStatusMap: Record<string, string> = {
            todo: 'Cần làm',
            in_progress: 'Đang thực hiện',
            in_review: 'Đang kiểm duyệt',
            completed: 'Đã hoàn thành',
            cancelled: 'Đã hủy',
          };
          value = taskStatusMap[rawStatus] || rawStatus;
        }
      } else if (module === 'finance') {
        const rawType = String(getRecordValue(record, 'transactionType') || '');
        if (field.key === 'transactionType') {
          value = rawType === 'income' ? 'Thu' : 'Chi';
        } else if (field.key === 'amount') {
          const rawAmt = getRecordValue(record, 'amount');
          value = typeof rawAmt === 'number' ? rawAmt : Number(rawAmt) || 0;
        } else if (field.key === 'categoryName') {
          const cat = record.category as { name?: string } | undefined;
          value = cat?.name || getRecordValue(record, 'categoryName') || 'Chung';
        } else if (field.key === 'recordedByName') {
          const rec = record.recorder as { full_name?: string; fullName?: string } | undefined;
          value = rec?.full_name || rec?.fullName || getRecordValue(record, 'recordedByName') || '';
        }
      } else if (module === 'participants') {
        const mem = record.member as { student_id?: string; studentId?: string; full_name?: string; fullName?: string } | undefined;
        const rawReg = String(getRecordValue(record, 'registrationStatus') || '');
        const rawAtt = String(getRecordValue(record, 'attendanceStatus') || '');
        if (field.key === 'studentId') {
          value = mem?.student_id || mem?.studentId || getRecordValue(record, 'studentId') || '';
        } else if (field.key === 'fullName') {
          value = mem?.full_name || mem?.fullName || getRecordValue(record, 'fullName') || '';
        } else if (field.key === 'registrationStatus') {
          const regMap: Record<string, string> = {
            registered: 'Đã đăng ký',
            confirmed: 'Đã xác nhận',
            waitlist: 'Danh sách chờ',
            cancelled: 'Đã hủy',
          };
          value = regMap[rawReg] || rawReg;
        } else if (field.key === 'attendanceStatus') {
          const attMap: Record<string, string> = {
            present: 'Có mặt',
            absent: 'Vắng mặt',
            excused: 'Có phép',
            unmarked: 'Chưa điểm danh',
          };
          value = attMap[rawAtt] || rawAtt;
        }
      }

      if (value === undefined || value === null) {
        row.push('');
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        row.push(value);
      } else {
        row.push(String(value));
      }
    }

    rows.push(row);
  }

  return rows;
}
