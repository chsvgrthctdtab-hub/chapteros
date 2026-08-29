import type {
  GoogleSheetModule,
  GoogleSheetConnectionStatus,
  SheetSyncStatus,
  ImportRowStatus,
  DuplicatePolicy,
  ConflictPolicy,
  GoogleSheetConnection,
} from '@/types';

export type {
  GoogleSheetModule,
  GoogleSheetConnectionStatus,
  SheetSyncStatus,
  ImportRowStatus,
  DuplicatePolicy,
  ConflictPolicy,
  GoogleSheetConnection,
};

export type FieldDataType = 'string' | 'number' | 'date' | 'enum' | 'boolean' | 'email' | 'phone';

export interface ColumnMappingField {
  key: string;
  label: string;
  aliases: string[];
  dataType: FieldDataType;
  isRequired: boolean;
  isIdentityKey?: boolean;
  description?: string;
  sampleValue?: string | number;
  enumOptions?: Array<{ value: string; label: string; aliases?: string[] }>;
}

export type ColumnMappingConfig = Record<string, string>; // { [sheetHeader: string]: databaseFieldKey }

export interface ImportConflictDetail {
  fieldKey: string;
  fieldLabel: string;
  existingValue: unknown;
  incomingValue: unknown;
  selectedResolution: 'keep_supabase' | 'use_sheet';
}

export interface ImportPreviewRow {
  rowIndex: number; // 1-indexed (row 1 is usually header in sheet, row 2 is data)
  rawValues: Record<string, unknown>;
  parsedData: Record<string, unknown>;
  status: ImportRowStatus;
  errors: string[];
  warnings: string[];
  conflicts: ImportConflictDetail[];
  isDuplicate: boolean;
  existingRecordId?: string | null;
  identityKeyName: string;
  identityKeyValue?: string | null;
}

export interface ImportPreviewSummary {
  totalRows: number;
  validRows: number;
  warningRows: number;
  duplicateRows: number;
  conflictRows: number;
  invalidRows: number;
}

export interface ImportPreviewResult {
  module: GoogleSheetModule;
  headers: string[];
  mapping: ColumnMappingConfig;
  rows: ImportPreviewRow[];
  summary: ImportPreviewSummary;
  unmappedHeaders: string[];
  missingRequiredFields: string[];
}

export interface ImportExecutionOptions {
  organizationId: string;
  termId?: string | null;
  module: GoogleSheetModule;
  previewRows: ImportPreviewRow[];
  duplicatePolicy: DuplicatePolicy;
  conflictPolicy: ConflictPolicy;
  customResolutions?: Record<number, Record<string, 'keep_supabase' | 'use_sheet'>>; // rowIndex -> { fieldKey: resolution }
}

export interface ImportErrorLog {
  rowIndex: number;
  identifier: string;
  message: string;
}

export interface ImportExecutionResult {
  module: GoogleSheetModule;
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errors: ImportErrorLog[];
  importedAt: string;
  message: string;
}

export interface ExportModuleOptions {
  organizationId: string;
  termId?: string | null;
  module: GoogleSheetModule;
  spreadsheetId?: string;
  spreadsheetName?: string;
  createNewSpreadsheet?: boolean;
  sheetName?: string;
  filters?: {
    status?: string;
    category?: string;
    fromDate?: string;
    toDate?: string;
    activityId?: string;
    search?: string;
  };
}

export interface ExportExecutionResult {
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  sheetName: string;
  rowCount: number;
  exportedAt: string;
  downloadData?: {
    csvContent: string;
    fileName: string;
  };
}

export interface CreateSheetConnectionPayload {
  organizationId: string;
  userId?: string | null;
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  moduleTabs?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateSheetConnectionPayload {
  id: string;
  organizationId?: string;
  spreadsheetName?: string;
  status?: GoogleSheetConnectionStatus;
  moduleTabs?: string[];
  metadata?: Record<string, unknown>;
}
