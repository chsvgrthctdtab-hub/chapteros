import type {
  GoogleSheetModule,
  ImportPreviewRow,
  ImportRowStatus,
  ImportConflictDetail,
  ColumnMappingConfig,
} from './google-sheets.types';
import { getModuleFields } from './sheet-mappings';

// ==============================================================================
// 1. DATA PARSING UTILITIES
// ==============================================================================

/**
 * Normalizes Date input from Google Sheets (ISO, DD/MM/YYYY, YYYY-MM-DD, or serial number)
 */
export function normalizeSheetDate(input: unknown): { value: string | null; error?: string } {
  if (input === null || input === undefined || input === '') {
    return { value: null };
  }

  // Handle number (Google Sheet date serial, base date Dec 30 1899)
  if (typeof input === 'number') {
    if (isNaN(input) || input <= 0) {
      return { value: null, error: 'Giá trị ngày dạng số không hợp lệ.' };
    }
    // Convert Excel/Sheets serial to JS Date
    const utcDays = Math.floor(input - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    if (isNaN(date.getTime())) {
      return { value: null, error: 'Không thể chuyển đổi ngày từ số sê-ri.' };
    }
    return { value: date.toISOString().split('T')[0] };
  }

  const str = String(input).trim();
  if (!str) return { value: null };

  // Match YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return { value: d.toISOString().split('T')[0] };
    }
  }

  // Match DD/MM/YYYY or DD-MM-YYYY (Vietnamese standard)
  const vnMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (vnMatch) {
    const day = parseInt(vnMatch[1], 10);
    const month = parseInt(vnMatch[2], 10) - 1;
    const year = parseInt(vnMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day));
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month && d.getUTCDate() === day) {
      return { value: d.toISOString().split('T')[0] };
    }
  }

  // Fallback to JS Date parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return { value: parsed.toISOString().split('T')[0] };
  }

  return { value: null, error: `Định dạng ngày "${str}" không hợp lệ (hỗ trợ YYYY-MM-DD hoặc DD/MM/YYYY).` };
}

/**
 * Normalizes Money/Amount for Finance (strict numeric value > 0)
 */
export function normalizeSheetMoney(input: unknown): { value: number | null; error?: string; warning?: string } {
  if (input === null || input === undefined || input === '') {
    return { value: null, error: 'Số tiền không được để trống.' };
  }

  if (typeof input === 'number') {
    if (isNaN(input)) return { value: null, error: 'Số tiền không phải là số hợp lệ.' };
    if (input <= 0) return { value: null, error: 'Số tiền giao dịch phải lớn hơn 0.' };
    return { value: Math.round(input) };
  }

  let str = String(input).trim();
  // Remove currency symbols, units, spaces
  str = str.replace(/[₫đvndVND$€\s]/g, '');

  // Vietnamese format: 1.500.000 (dots as thousand separators)
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    const rawNum = parseInt(str.replace(/\./g, ''), 10);
    if (rawNum <= 0) return { value: null, error: 'Số tiền phải lớn hơn 0.' };
    return { value: rawNum };
  }

  // English format: 1,500,000 (commas as thousand separators)
  if (/^\d{1,3}(,\d{3})+$/.test(str)) {
    const rawNum = parseInt(str.replace(/,/g, ''), 10);
    if (rawNum <= 0) return { value: null, error: 'Số tiền phải lớn hơn 0.' };
    return { value: rawNum };
  }

  // Pure digits: 1500000
  if (/^\d+$/.test(str)) {
    const rawNum = parseInt(str, 10);
    if (rawNum <= 0) return { value: null, error: 'Số tiền phải lớn hơn 0.' };
    return { value: rawNum };
  }

  // Decimal numbers: 1500.50
  const floatVal = parseFloat(str.replace(/,/g, ''));
  if (!isNaN(floatVal)) {
    if (floatVal <= 0) return { value: null, error: 'Số tiền phải lớn hơn 0.' };
    return {
      value: Math.round(floatVal),
      warning: 'Số tiền thập phân đã được làm tròn thành số nguyên.',
    };
  }

  return { value: null, error: `Giá trị số tiền "${input}" không thể chuyển đổi thành số hợp lệ.` };
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validates phone format (Vietnamese 10 digits)
 */
export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/[\s.-]/g, '');
  return /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(clean);
}

// ==============================================================================
// 2. ROW PARSING & VALIDATION ENGINE
// ==============================================================================

export interface ExistingRecordLookup {
  membersByStudentId?: Map<string, Record<string, unknown>>;
  activitiesByTitleOrCode?: Map<string, Record<string, unknown>>;
  tasksByTitle?: Map<string, Record<string, unknown>>;
  financeById?: Map<string, Record<string, unknown>>;
  financeBySignature?: Map<string, Record<string, unknown>>;
  participantsByStudentId?: Map<string, Record<string, unknown>>;
}

export function parseAndValidateRow(
  rawValues: Record<string, unknown>,
  rowIndex: number,
  module: GoogleSheetModule,
  mapping: ColumnMappingConfig,
  existingLookup: ExistingRecordLookup
): ImportPreviewRow {
  const fields = getModuleFields(module);
  const parsedData: Record<string, unknown> = {};
  const errors: string[] = [];
  const warnings: string[] = [];
  const conflicts: ImportConflictDetail[] = [];

  // 1. Map raw headers to database field keys
  for (const [header, rawVal] of Object.entries(rawValues)) {
    const fieldKey = mapping[header];
    if (!fieldKey) continue;

    const fieldDef = fields.find((f) => f.key === fieldKey);
    if (!fieldDef) continue;

    let cleanVal = rawVal;
    if (typeof cleanVal === 'string') {
      cleanVal = cleanVal.trim();
    }

    // Type-specific parsing
    if (fieldDef.dataType === 'date') {
      const { value, error } = normalizeSheetDate(cleanVal);
      if (error) {
        if (fieldDef.isRequired) errors.push(`${fieldDef.label}: ${error}`);
        else warnings.push(`${fieldDef.label}: ${error}`);
      }
      parsedData[fieldKey] = value;
    } else if (fieldDef.dataType === 'number') {
      if (module === 'finance' && fieldKey === 'amount') {
        const { value, error, warning } = normalizeSheetMoney(cleanVal);
        if (error) errors.push(error);
        if (warning) warnings.push(warning);
        parsedData[fieldKey] = value;
      } else {
        if (cleanVal === '' || cleanVal === null || cleanVal === undefined) {
          parsedData[fieldKey] = null;
        } else {
          const num = Number(cleanVal);
          if (isNaN(num)) {
            if (fieldDef.isRequired) errors.push(`${fieldDef.label} phải là số hợp lệ.`);
            else warnings.push(`${fieldDef.label} không phải là số hợp lệ.`);
            parsedData[fieldKey] = null;
          } else {
            parsedData[fieldKey] = num;
          }
        }
      }
    } else if (fieldDef.dataType === 'email') {
      if (cleanVal) {
        const emailStr = String(cleanVal).trim();
        if (!isValidEmail(emailStr)) {
          warnings.push(`Email "${emailStr}" có định dạng chưa chuẩn.`);
        }
        parsedData[fieldKey] = emailStr;
      } else {
        parsedData[fieldKey] = null;
      }
    } else if (fieldDef.dataType === 'phone') {
      if (cleanVal) {
        const phoneStr = String(cleanVal).trim();
        if (!isValidPhone(phoneStr)) {
          warnings.push(`Số điện thoại "${phoneStr}" có thể chưa đúng định dạng chuẩn.`);
        }
        parsedData[fieldKey] = phoneStr;
      } else {
        parsedData[fieldKey] = null;
      }
    } else if (fieldDef.dataType === 'enum' && fieldDef.enumOptions) {
      if (cleanVal) {
        const strVal = String(cleanVal).toLowerCase().trim();
        const matched = fieldDef.enumOptions.find(
          (opt) =>
            opt.value.toLowerCase() === strVal ||
            opt.label.toLowerCase() === strVal ||
            opt.aliases?.some((a) => a.toLowerCase() === strVal)
        );
        if (matched) {
          parsedData[fieldKey] = matched.value;
        } else {
          // If finance transactionType
          if (module === 'finance' && fieldKey === 'transactionType') {
            if (strVal.includes('thu') || strVal === '+') {
              parsedData[fieldKey] = 'income';
            } else if (strVal.includes('chi') || strVal === '-') {
              parsedData[fieldKey] = 'expense';
            } else {
              errors.push('Loại giao dịch phải là "Thu" hoặc "Chi".');
              parsedData[fieldKey] = null;
            }
          } else {
            warnings.push(`Giá trị "${cleanVal}" cho ${fieldDef.label} không khớp danh mục chuẩn; đã gán mặc định.`);
            parsedData[fieldKey] = fieldDef.enumOptions[0].value;
          }
        }
      } else {
        parsedData[fieldKey] = fieldDef.enumOptions[0].value;
      }
    } else {
      parsedData[fieldKey] = cleanVal !== undefined && cleanVal !== null ? String(cleanVal) : null;
    }
  }

  // 2. Check required fields
  for (const field of fields) {
    if (field.isRequired) {
      const val = parsedData[field.key];
      if (val === undefined || val === null || val === '') {
        errors.push(`Trường bắt buộc "${field.label}" bị thiếu hoặc để trống.`);
      }
    }
  }

  // 3. Module Specific Logic
  if (module === 'activities') {
    const start = parsedData.startDate as string | undefined;
    const end = parsedData.endDate as string | undefined;
    if (start && end) {
      if (new Date(start) > new Date(end)) {
        errors.push('Thời gian bắt đầu không được lớn hơn thời gian kết thúc.');
      }
    }
  } else if (module === 'tasks') {
    const prog = parsedData.progress as number | undefined;
    if (prog !== undefined && prog !== null) {
      if (prog < 0 || prog > 100) {
        errors.push('Tiến độ công việc phải nằm trong khoảng 0% - 100%.');
      }
    }
  } else if (module === 'finance') {
    const amt = parsedData.amount as number | undefined;
    if (amt === undefined || amt === null || amt <= 0) {
      errors.push('Số tiền giao dịch phải là số nguyên dương lớn hơn 0.');
    }
  }

  // 4. Duplicate & Conflict Detection against existing database records
  let isDuplicate = false;
  let existingRecordId: string | null = null;
  let identityKeyName = '';
  let identityKeyValue: string | null = null;

  if (module === 'members') {
    identityKeyName = 'MSSV';
    const mssv = (parsedData.studentId as string)?.trim()?.toUpperCase();
    identityKeyValue = mssv || null;

    if (mssv && existingLookup.membersByStudentId?.has(mssv)) {
      isDuplicate = true;
      const existing = existingLookup.membersByStudentId.get(mssv)!;
      existingRecordId = (existing.id as string) || null;

      // Check fields for conflicts
      const compareFields: Array<{ key: string; label: string }> = [
        { key: 'fullName', label: 'Họ và tên' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Số điện thoại' },
        { key: 'className', label: 'Lớp' },
        { key: 'position', label: 'Chức vụ' },
      ];

      for (const cf of compareFields) {
        const existVal = existing[cf.key] || existing[cf.key === 'fullName' ? 'full_name' : cf.key === 'className' ? 'class_name' : cf.key] || '';
        const incomingVal = parsedData[cf.key] || '';

        if (incomingVal && existVal && String(existVal).trim().toLowerCase() !== String(incomingVal).trim().toLowerCase()) {
          conflicts.push({
            fieldKey: cf.key,
            fieldLabel: cf.label,
            existingValue: existVal,
            incomingValue: incomingVal,
            selectedResolution: 'use_sheet',
          });
        }
      }
    }
  } else if (module === 'activities') {
    identityKeyName = 'Tên hoạt động';
    const title = (parsedData.title as string)?.trim()?.toLowerCase();
    const code = (parsedData.code as string)?.trim()?.toLowerCase();
    identityKeyValue = (parsedData.title as string) || (parsedData.code as string) || null;

    const matched = (title && existingLookup.activitiesByTitleOrCode?.get(title)) ||
      (code && existingLookup.activitiesByTitleOrCode?.get(code));

    if (matched) {
      isDuplicate = true;
      existingRecordId = (matched.id as string) || null;
      if (parsedData.location && matched.location && parsedData.location !== matched.location) {
        conflicts.push({
          fieldKey: 'location',
          fieldLabel: 'Địa điểm',
          existingValue: matched.location,
          incomingValue: parsedData.location,
          selectedResolution: 'use_sheet',
        });
      }
    }
  } else if (module === 'tasks') {
    identityKeyName = 'Tên nhiệm vụ';
    const title = (parsedData.title as string)?.trim()?.toLowerCase();
    identityKeyValue = (parsedData.title as string) || null;

    if (title && existingLookup.tasksByTitle?.has(title)) {
      isDuplicate = true;
      const matched = existingLookup.tasksByTitle.get(title)!;
      existingRecordId = (matched.id as string) || null;
    }
  } else if (module === 'finance') {
    identityKeyName = 'Giao dịch';
    const rowId = parsedData.id as string | undefined;
    const date = parsedData.transactionDate as string;
    const amount = parsedData.amount as number;
    const desc = parsedData.description as string;
    const sig = `${date}_${amount}_${(desc || '').slice(0, 20)}`.toLowerCase();
    identityKeyValue = desc ? `${desc.slice(0, 25)} (${amount}đ)` : `${amount}đ`;

    if (rowId && existingLookup.financeById?.has(rowId)) {
      isDuplicate = true;
      existingRecordId = rowId;
    } else if (sig && existingLookup.financeBySignature?.has(sig)) {
      isDuplicate = true;
      const matched = existingLookup.financeBySignature.get(sig)!;
      existingRecordId = (matched.id as string) || null;
    }
  } else if (module === 'participants') {
    identityKeyName = 'MSSV Người tham gia';
    const mssv = (parsedData.studentId as string)?.trim()?.toUpperCase();
    identityKeyValue = mssv || (parsedData.fullName as string) || null;

    if (mssv && existingLookup.participantsByStudentId?.has(mssv)) {
      isDuplicate = true;
      const matched = existingLookup.participantsByStudentId.get(mssv)!;
      existingRecordId = (matched.id as string) || null;
    }
  }

  // 5. Determine Overall Row Status
  let status: ImportRowStatus = 'valid';
  if (errors.length > 0) {
    status = 'invalid';
  } else if (conflicts.length > 0) {
    status = 'conflict';
  } else if (isDuplicate) {
    status = 'duplicate';
  } else if (warnings.length > 0) {
    status = 'warning';
  }

  return {
    rowIndex,
    rawValues,
    parsedData,
    status,
    errors,
    warnings,
    conflicts,
    isDuplicate,
    existingRecordId,
    identityKeyName,
    identityKeyValue,
  };
}
