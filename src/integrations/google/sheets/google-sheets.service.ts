import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auditLogService } from '@/services/audit-log.service';
import type { Database, Json } from '@/types/database.types';
import type {
  GoogleSheetConnection,
  GoogleSheetModule,
  ImportPreviewResult,
  ImportPreviewSummary,
  ImportPreviewRow,
  ImportExecutionOptions,
  ImportExecutionResult,
  ExportModuleOptions,
  ExportExecutionResult,
  CreateSheetConnectionPayload,
  UpdateSheetConnectionPayload,
  ColumnMappingConfig,
} from './google-sheets.types';
import {
  autoMapSheetHeaders,
  formatDataForSheetExport,
  getModuleFields,
} from './sheet-mappings';
import {
  parseAndValidateRow,
  type ExistingRecordLookup,
} from './sheet-validator';
import { extractSpreadsheetId, buildSpreadsheetUrl, GOOGLE_SHEETS_MODULE_TABS } from './google-sheets.constants';

const LOCAL_STORAGE_SHEET_CONNS_PREFIX = 'chihoi_google_sheet_conns_';

type DbSheetRow = Database['public']['Tables']['google_sheet_connections']['Row'];
type DbMemberRow = Database['public']['Tables']['members']['Row'];
type DbActivityRow = Database['public']['Tables']['activities']['Row'];
type DbTaskRow = Database['public']['Tables']['tasks']['Row'];
type DbFinanceRow = Database['public']['Tables']['finance_transactions']['Row'];

function mapRowToConnection(row: DbSheetRow): GoogleSheetConnection {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    spreadsheetId: row.spreadsheet_id,
    spreadsheetName: row.spreadsheet_name,
    spreadsheetUrl: row.spreadsheet_url,
    status: (row.status as GoogleSheetConnection['status']) || 'active',
    moduleTabs: Array.isArray(row.module_tabs) ? row.module_tabs : ['members', 'activities', 'tasks', 'participants', 'finance'],
    lastImportAt: row.last_import_at,
    lastExportAt: row.last_export_at,
    lastSyncStatus: (row.last_sync_status as GoogleSheetConnection['lastSyncStatus']) || 'idle',
    lastSyncError: row.last_sync_error,
    metadata: (row.metadata as Record<string, unknown>) || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const googleSheetsService = {
  /**
   * List all linked Google Spreadsheets for an organization
   */
  async getConnectedSpreadsheets(organizationId: string): Promise<GoogleSheetConnection[]> {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_SHEET_CONNS_PREFIX}${organizationId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('google_sheet_connections')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching google sheet connections:', error.message);
        return [];
      }

      return (data || []).map((row) => mapRowToConnection(row));
    } catch (err) {
      console.error('Unexpected error fetching google sheet connections:', err);
      return [];
    }
  },

  /**
   * Link an existing or newly created Google Spreadsheet to the organization
   */
  async linkSpreadsheet(payload: CreateSheetConnectionPayload): Promise<GoogleSheetConnection> {
    const spreadsheetId = extractSpreadsheetId(payload.spreadsheetId || payload.spreadsheetUrl);
    if (!spreadsheetId) {
      throw new Error('Định dạng URL hoặc Spreadsheet ID không hợp lệ.');
    }

    const spreadsheetUrl = buildSpreadsheetUrl(spreadsheetId);
    const moduleTabs = payload.moduleTabs || ['members', 'activities', 'tasks', 'participants', 'finance'];

    if (!isSupabaseConfigured) {
      const existing = await this.getConnectedSpreadsheets(payload.organizationId);
      const newConn: GoogleSheetConnection = {
        id: `mock_sheet_${Date.now()}`,
        organizationId: payload.organizationId,
        spreadsheetId,
        spreadsheetName: payload.spreadsheetName || 'Bảng tính Chi hội',
        spreadsheetUrl,
        status: 'active',
        moduleTabs,
        lastSyncStatus: 'idle',
        metadata: payload.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedList = [newConn, ...existing.filter((s) => s.spreadsheetId !== spreadsheetId)];
      localStorage.setItem(`${LOCAL_STORAGE_SHEET_CONNS_PREFIX}${payload.organizationId}`, JSON.stringify(updatedList));
      return newConn;
    }

    try {
      // Get current user id
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = payload.userId || authData?.user?.id || null;

      const { data, error } = await supabase
        .from('google_sheet_connections')
        .upsert(
          {
            organization_id: payload.organizationId,
            user_id: currentUserId,
            spreadsheet_id: spreadsheetId,
            spreadsheet_name: payload.spreadsheetName,
            spreadsheet_url: spreadsheetUrl,
            status: 'active',
            module_tabs: moduleTabs,
            metadata: (payload.metadata as Json) || {},
          } as never,
          { onConflict: 'organization_id,spreadsheet_id' }
        )
        .select()
        .single();

      if (error) throw error;
      const connection = mapRowToConnection(data as DbSheetRow);

      // Audit Log
      try {
        await auditLogService.logAction({
          organization_id: payload.organizationId,
          user_id: currentUserId,
          action: 'google_sheet.connect',
          entity_type: 'google_sheet_connection',
          entity_id: connection.id,
          metadata: {
            spreadsheetId,
            spreadsheetName: payload.spreadsheetName,
            spreadsheetUrl,
            moduleTabs,
          } as Json,
        });
      } catch (auditErr) {
        console.warn('[GoogleSheets] Audit log error on connect:', auditErr);
      }

      return connection;
    } catch (err: unknown) {
      const error = err as Error;
      throw new Error(`Không thể liên kết bảng tính: ${error.message}`);
    }
  },

  /**
   * Update a connected spreadsheet's metadata or status
   */
  async updateSpreadsheet(payload: UpdateSheetConnectionPayload): Promise<GoogleSheetConnection> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.spreadsheetName !== undefined) updateData.spreadsheet_name = payload.spreadsheetName;
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.moduleTabs !== undefined) updateData.module_tabs = payload.moduleTabs;
    if (payload.metadata !== undefined) updateData.metadata = payload.metadata as Json;

    if (!isSupabaseConfigured) {
      return {
        id: payload.id,
        organizationId: '',
        spreadsheetId: 'mock',
        spreadsheetName: payload.spreadsheetName || 'Bảng tính Chi hội',
        spreadsheetUrl: 'https://docs.google.com/spreadsheets',
        status: payload.status || 'active',
        moduleTabs: payload.moduleTabs || ['members'],
        lastSyncStatus: 'idle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    let query = supabase
      .from('google_sheet_connections')
      .update(updateData as never)
      .eq('id', payload.id);

    if (payload.organizationId) {
      query = query.eq('organization_id', payload.organizationId);
    }

    const { data, error } = await query
      .select()
      .single();

    if (error) throw new Error(error.message);
    const connection = mapRowToConnection(data as DbSheetRow);

    // Audit Log
    try {
      const { data: authData } = await supabase.auth.getUser();
      await auditLogService.logAction({
        organization_id: connection.organizationId,
        user_id: authData?.user?.id || null,
        action: 'google_sheet.update',
        entity_type: 'google_sheet_connection',
        entity_id: connection.id,
        metadata: {
          spreadsheetName: connection.spreadsheetName,
          status: connection.status,
          moduleTabs: connection.moduleTabs,
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleSheets] Audit log error on update:', auditErr);
    }

    return connection;
  },

  /**
   * Unlink a Google Spreadsheet from the organization
   */
  async unlinkSpreadsheet(connectionId: string, orgId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const list = await this.getConnectedSpreadsheets(orgId);
      const filtered = list.filter((c) => c.id !== connectionId);
      localStorage.setItem(`${LOCAL_STORAGE_SHEET_CONNS_PREFIX}${orgId}`, JSON.stringify(filtered));
      return;
    }

    // Fetch before delete for audit metadata
    const { data: existing } = await supabase
      .from('google_sheet_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('organization_id', orgId)
      .maybeSingle();

    const existingRow = existing as DbSheetRow | null;

    const { error } = await supabase
      .from('google_sheet_connections')
      .delete()
      .eq('id', connectionId)
      .eq('organization_id', orgId);

    if (error) throw new Error(error.message);

    // Audit Log
    try {
      const { data: authData } = await supabase.auth.getUser();
      await auditLogService.logAction({
        organization_id: orgId,
        user_id: authData?.user?.id || null,
        action: 'google_sheet.disconnect',
        entity_type: 'google_sheet_connection',
        entity_id: connectionId,
        metadata: {
          spreadsheetId: existingRow?.spreadsheet_id,
          spreadsheetName: existingRow?.spreadsheet_name,
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleSheets] Audit log error on disconnect:', auditErr);
    }
  },

  // ==============================================================================
  // EXPORT PIPELINE: Supabase -> Google Sheets / CSV File
  // ==============================================================================

  /**
   * Export domain data from Supabase to structured Google Sheet format
   */
  async exportModuleData(options: ExportModuleOptions): Promise<ExportExecutionResult> {
    const { organizationId, termId, module, filters } = options;

    let records: unknown[] = [];

    // Query data from Supabase based on module
    if (module === 'members') {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('members')
          .select('*, term_members(*, terms(*))')
          .eq('organization_id', organizationId);

        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status as DbMemberRow['status']);
        }
        if (filters?.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,student_id.ilike.%${filters.search}%`);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        
        let memberList = (data as unknown as Array<DbMemberRow & { term_members?: Array<{ term_id: string }> }>) || [];
        if (termId) {
          memberList = memberList.filter((m) =>
            m.term_members?.some((tm) => tm.term_id === termId)
          );
        }
        records = memberList;
      } else {
        const stored = localStorage.getItem('chihoi_mock_members');
        records = stored ? JSON.parse(stored) : [];
      }
    } else if (module === 'activities') {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('activities')
          .select('*')
          .eq('organization_id', organizationId);

        if (termId) query = query.eq('term_id', termId);
        if (filters?.category && filters.category !== 'all') query = query.eq('category', filters.category as DbActivityRow['category']);
        if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status as DbActivityRow['status']);

        const { data, error } = await query.order('start_date', { ascending: false });
        if (error) throw error;
        records = data || [];
      } else {
        const stored = localStorage.getItem('chihoi_mock_activities');
        records = stored ? JSON.parse(stored) : [];
      }
    } else if (module === 'tasks') {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('tasks')
          .select('*, assignee:profiles(full_name), activity:activities(title)')
          .eq('organization_id', organizationId);

        if (termId) query = query.eq('term_id', termId);
        if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status as DbTaskRow['status']);
        if (filters?.activityId) query = query.eq('activity_id', String(filters.activityId));

        const { data, error } = await query.order('due_date', { ascending: true });
        if (error) throw error;
        records = data || [];
      } else {
        records = [];
      }
    } else if (module === 'participants') {
      if (isSupabaseConfigured) {
        let actQuery = supabase
          .from('activities')
          .select('id')
          .eq('organization_id', organizationId);

        if (filters?.activityId) {
          actQuery = actQuery.eq('id', String(filters.activityId));
        }

        const { data: orgActs, error: actError } = await actQuery;
        if (actError) throw actError;

        const actIds = ((orgActs as Array<{ id: string }> | null) || []).map((a) => a.id);

        if (actIds.length > 0) {
          const { data, error } = await supabase
            .from('activity_participants')
            .select('*, member:members(full_name, student_id, class_name, email, phone)')
            .in('activity_id', actIds)
            .order('registered_at', { ascending: false });

          if (error) throw error;
          records = data || [];
        } else {
          records = [];
        }
      } else {
        records = [];
      }
    } else if (module === 'finance') {
      if (isSupabaseConfigured) {
        let query = supabase
          .from('finance_transactions')
          .select('*, category:finance_categories(name), activity:activities(title)')
          .eq('organization_id', organizationId);

        if (termId) query = query.eq('term_id', termId);
        if (filters?.category && filters.category !== 'all') query = query.eq('category_id', String(filters.category));
        if (filters?.fromDate) query = query.gte('transaction_date', String(filters.fromDate));
        if (filters?.toDate) query = query.lte('transaction_date', String(filters.toDate));

        const { data, error } = await query.order('transaction_date', { ascending: false });
        if (error) throw error;
        
        let txList = (data || []) as Array<Record<string, unknown>>;
        if (txList.length > 0) {
          const recIds = Array.from(
            new Set(
              txList
                .map((r) => r.recorded_by as string | undefined)
                .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
            )
          );
          if (recIds.length > 0) {
            try {
              const { data: profData } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', recIds);
              const profMap = new Map(((profData as Array<{ id: string; full_name: string }>) || []).map((p) => [p.id, p.full_name]));
              txList = txList.map((r) => ({
                ...r,
                recorder: r.recorded_by ? { full_name: profMap.get(r.recorded_by as string) || '' } : null,
              }));
            } catch (profErr) {
              console.warn('[GoogleSheets] Failed to fetch recorder profiles:', profErr);
            }
          }
        }
        records = txList;
      } else {
        records = [];
      }
    }

    // Format into clean rows (Strict: numbers remain numbers, text is escaped)
    const formattedRows = formatDataForSheetExport(records, module);

    // Build CSV content with UTF-8 BOM for instant Excel/Sheets compatibility
    const csvContent =
      '\uFEFF' +
      formattedRows
        .map((row) =>
          row
            .map((val) => {
              if (val === null || val === undefined) return '""';
              if (typeof val === 'number') return String(val);
              return `"${String(val).replace(/"/g, '""')}"`;
            })
            .join(',')
        )
        .join('\n');

    const tabInfo = GOOGLE_SHEETS_MODULE_TABS[module];
    const fileName = `${tabInfo.tabName}_${new Date().toISOString().split('T')[0]}.csv`;

    const spreadsheetId = options.spreadsheetId || '1_mock_spreadsheet_chihoi';
    const spreadsheetUrl = buildSpreadsheetUrl(spreadsheetId);

    // Update last_export_at in DB
    if (isSupabaseConfigured && options.spreadsheetId) {
      try {
        await supabase
          .from('google_sheet_connections')
          .update({
            last_export_at: new Date().toISOString(),
            last_sync_status: 'success',
          } as never)
          .eq('spreadsheet_id', options.spreadsheetId)
          .eq('organization_id', organizationId);
      } catch (e) {
        console.warn('Could not update last_export_at:', e);
      }
    }

    // Audit Log
    try {
      const { data: authData } = await supabase.auth.getUser();
      await auditLogService.logAction({
        organization_id: organizationId,
        user_id: authData?.user?.id || null,
        action: 'google_sheet.export',
        entity_type: 'google_sheet_export',
        entity_id: options.spreadsheetId || organizationId,
        metadata: {
          module,
          rowCount: records.length,
          termId: termId || null,
          spreadsheetId: options.spreadsheetId || null,
          fileName,
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleSheets] Audit log error on export:', auditErr);
    }

    return {
      spreadsheetId,
      spreadsheetName: options.spreadsheetName || `Bảng tính Chi Hội - ${tabInfo.tabName}`,
      spreadsheetUrl,
      sheetName: tabInfo.tabName,
      rowCount: records.length,
      exportedAt: new Date().toISOString(),
      downloadData: {
        csvContent,
        fileName,
      },
    };
  },

  // ==============================================================================
  // IMPORT PIPELINE: Google Sheets -> Validate -> Preview -> Confirm -> Supabase
  // ==============================================================================

  /**
   * Parses raw tabular Sheet data, checks auto-mapping, validates rows, and detects duplicates & conflicts against Supabase
   */
  async parseAndPreviewSheet(
    organizationId: string,
    termId: string | null | undefined,
    module: GoogleSheetModule,
    rawHeaders: string[],
    rawRows: Array<Record<string, unknown>>,
    customMapping?: ColumnMappingConfig
  ): Promise<ImportPreviewResult> {
    const fields = getModuleFields(module);

    // 1. Column Auto-mapping
    const mapping = customMapping || autoMapSheetHeaders(rawHeaders, module);

    const mappedFieldKeys = new Set(Object.values(mapping));
    const unmappedHeaders = rawHeaders.filter((h) => !mapping[h]);
    const missingRequiredFields = fields
      .filter((f) => f.isRequired && !mappedFieldKeys.has(f.key))
      .map((f) => f.label);

    // 2. Fetch existing records for duplicate & conflict lookup
    const existingLookup: ExistingRecordLookup = {};

    if (module === 'members') {
      let existingMembers: Array<{ id: string; student_id: string; full_name: string; email: string | null; phone: string | null; class_name: string | null; position: string | null }> = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('members')
          .select('id, student_id, full_name, email, phone, class_name, position')
          .eq('organization_id', organizationId);
        existingMembers = (data || []) as typeof existingMembers;
      } else {
        const stored = localStorage.getItem('chihoi_mock_members');
        existingMembers = stored ? JSON.parse(stored) : [];
      }

      const map = new Map<string, Record<string, unknown>>();
      for (const m of existingMembers) {
        if (m.student_id) {
          map.set(m.student_id.trim().toUpperCase(), m);
        }
      }
      existingLookup.membersByStudentId = map;
    } else if (module === 'activities') {
      let existingActivities: Array<{ id: string; code: string | null; title: string; location: string | null }> = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('activities')
          .select('id, code, title, location')
          .eq('organization_id', organizationId);
        existingActivities = (data || []) as typeof existingActivities;
      }
      const map = new Map<string, Record<string, unknown>>();
      for (const a of existingActivities) {
        if (a.title) map.set(a.title.trim().toLowerCase(), a);
        if (a.code) map.set(a.code.trim().toLowerCase(), a);
      }
      existingLookup.activitiesByTitleOrCode = map;
    } else if (module === 'tasks') {
      let existingTasks: Array<{ id: string; title: string }> = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('tasks')
          .select('id, title')
          .eq('organization_id', organizationId);
        existingTasks = (data || []) as typeof existingTasks;
      }
      const map = new Map<string, Record<string, unknown>>();
      for (const t of existingTasks) {
        if (t.title) map.set(t.title.trim().toLowerCase(), t);
      }
      existingLookup.tasksByTitle = map;
    } else if (module === 'finance') {
      let existingFinance: Array<{ id: string; transaction_date: string; amount: number; description: string }> = [];
      if (isSupabaseConfigured) {
        const { data } = await supabase
          .from('finance_transactions')
          .select('id, transaction_date, amount, description')
          .eq('organization_id', organizationId);
        existingFinance = (data || []) as typeof existingFinance;
      }
      const idMap = new Map<string, Record<string, unknown>>();
      const sigMap = new Map<string, Record<string, unknown>>();
      for (const f of existingFinance) {
        idMap.set(f.id, f);
        const sig = `${f.transaction_date}_${f.amount}_${(f.description || '').slice(0, 20)}`.toLowerCase();
        sigMap.set(sig, f);
      }
      existingLookup.financeById = idMap;
      existingLookup.financeBySignature = sigMap;
    } else if (module === 'participants') {
      let existingParticipants: Array<{ id: string; member?: { student_id?: string | null } | null }> = [];
      if (isSupabaseConfigured) {
        const { data: orgActs } = await supabase
          .from('activities')
          .select('id')
          .eq('organization_id', organizationId);
        const actIds = ((orgActs as Array<{ id: string }> | null) || []).map((a) => a.id);
        if (actIds.length > 0) {
          const { data } = await supabase
            .from('activity_participants')
            .select('id, member:members(student_id)')
            .in('activity_id', actIds);
          existingParticipants = (data || []) as typeof existingParticipants;
        }
      }
      const map = new Map<string, Record<string, unknown>>();
      for (const p of existingParticipants) {
        const mssv = p.member?.student_id?.trim().toUpperCase();
        if (mssv) map.set(mssv, p);
      }
      existingLookup.participantsByStudentId = map;
    }

    // 3. Parse & Validate Every Row
    const previewRows: ImportPreviewRow[] = [];
    const summary: ImportPreviewSummary = {
      totalRows: rawRows.length,
      validRows: 0,
      warningRows: 0,
      duplicateRows: 0,
      conflictRows: 0,
      invalidRows: 0,
    };

    rawRows.forEach((rowValues, index) => {
      const rowIndex = index + 2; // Row 1 is header
      const previewRow = parseAndValidateRow(rowValues, rowIndex, module, mapping, existingLookup);

      if (previewRow.status === 'invalid') summary.invalidRows++;
      else if (previewRow.status === 'conflict') summary.conflictRows++;
      else if (previewRow.status === 'duplicate') summary.duplicateRows++;
      else if (previewRow.status === 'warning') summary.warningRows++;
      else summary.validRows++;

      previewRows.push(previewRow);
    });

    return {
      module,
      headers: rawHeaders,
      mapping,
      rows: previewRows,
      summary,
      unmappedHeaders,
      missingRequiredFields,
    };
  },

  /**
   * Execute Import to Supabase Database based on Preview results and user policy
   */
  async executeImport(options: ImportExecutionOptions): Promise<ImportExecutionResult> {
    const { organizationId, termId, module, previewRows, duplicatePolicy, conflictPolicy } = options;

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: Array<{ rowIndex: number; identifier: string; message: string }> = [];

    // Filter out invalid rows from batch
    const processableRows = previewRows.filter((r) => r.status !== 'invalid');
    const invalidRows = previewRows.filter((r) => r.status === 'invalid');

    for (const inv of invalidRows) {
      failedCount++;
      errors.push({
        rowIndex: inv.rowIndex,
        identifier: inv.identityKeyValue || `Dòng ${inv.rowIndex}`,
        message: inv.errors.join('; '),
      });
    }

    for (const row of processableRows) {
      try {
        if (row.isDuplicate) {
          if (duplicatePolicy === 'skip') {
            skippedCount++;
            continue;
          }
        }

        // Apply conflict policy / custom resolution
        const finalData = { ...row.parsedData };
        if (row.conflicts.length > 0) {
          for (const conflict of row.conflicts) {
            const resolution =
              conflictPolicy === 'keep_supabase'
                ? 'keep_supabase'
                : conflictPolicy === 'use_sheet'
                ? 'use_sheet'
                : conflict.selectedResolution;

            if (resolution === 'keep_supabase') {
              finalData[conflict.fieldKey] = conflict.existingValue;
            } else {
              finalData[conflict.fieldKey] = conflict.incomingValue;
            }
          }
        }

        if (module === 'members') {
          const studentId = String(finalData.studentId || '').trim().toUpperCase();
          const fullName = String(finalData.fullName || '').trim();

          if (isSupabaseConfigured) {
            let memberId = row.existingRecordId;

            if (row.isDuplicate && row.existingRecordId && duplicatePolicy === 'update') {
              // Update member
              const { error } = await supabase
                .from('members')
                .update({
                  full_name: fullName,
                  email: (finalData.email as string) || null,
                  phone: (finalData.phone as string) || null,
                  class_name: (finalData.className as string) || null,
                  major: (finalData.major as string) || null,
                  cohort: (finalData.cohort as string) || null,
                  position: (finalData.position as string) || null,
                  status: (finalData.status as DbMemberRow['status']) || 'active',
                  joined_date: (finalData.joinedDate as string) || null,
                  notes: (finalData.notes as string) || null,
                } as never)
                .eq('id', row.existingRecordId)
                .eq('organization_id', organizationId);

              if (error) throw error;
              updatedCount++;
            } else {
              // Insert member
              const { data: newMem, error } = await supabase
                .from('members')
                .insert({
                  organization_id: organizationId,
                  student_id: studentId,
                  full_name: fullName,
                  email: (finalData.email as string) || null,
                  phone: (finalData.phone as string) || null,
                  class_name: (finalData.className as string) || null,
                  major: (finalData.major as string) || null,
                  cohort: (finalData.cohort as string) || null,
                  position: (finalData.position as string) || 'Hội viên',
                  status: (finalData.status as DbMemberRow['status']) || 'active',
                  joined_date: (finalData.joinedDate as string) || null,
                  notes: (finalData.notes as string) || null,
                } as never)
                .select('id')
                .single();

              if (error) throw error;
              const insertedMem = newMem as { id: string } | null;
              memberId = insertedMem?.id || null;
              createdCount++;
            }

            // Associate with term if termId is provided
            if (termId && memberId) {
              const { data: existingTm } = await supabase
                .from('term_members')
                .select('id')
                .eq('term_id', termId)
                .eq('member_id', memberId)
                .maybeSingle();

              if (!existingTm) {
                await supabase.from('term_members').insert({
                  term_id: termId,
                  member_id: memberId,
                  position: (finalData.position as string) || 'Hội viên',
                  status: 'active',
                } as never);
              }
            }
          } else {
            if (row.isDuplicate && duplicatePolicy === 'update') updatedCount++;
            else createdCount++;
          }
        } else if (module === 'activities') {
          if (isSupabaseConfigured) {
            if (row.isDuplicate && row.existingRecordId && duplicatePolicy === 'update') {
              const { error } = await supabase
                .from('activities')
                .update({
                  title: String(finalData.title),
                  code: (finalData.code as string) || null,
                  category: (finalData.category as DbActivityRow['category']) || 'general',
                  status: (finalData.status as DbActivityRow['status']) || 'planning',
                  location: (finalData.location as string) || null,
                  start_date: String(finalData.startDate),
                  end_date: String(finalData.endDate),
                  target_members: typeof finalData.targetMembers === 'number' ? finalData.targetMembers : null,
                  description: (finalData.description as string) || null,
                } as never)
                .eq('id', row.existingRecordId)
                .eq('organization_id', organizationId);

              if (error) throw error;
              updatedCount++;
            } else {
              const { error } = await supabase.from('activities').insert({
                organization_id: organizationId,
                term_id: termId || null,
                title: String(finalData.title),
                code: (finalData.code as string) || null,
                category: (finalData.category as DbActivityRow['category']) || 'general',
                status: (finalData.status as DbActivityRow['status']) || 'planning',
                location: (finalData.location as string) || null,
                start_date: String(finalData.startDate),
                end_date: String(finalData.endDate),
                target_members: typeof finalData.targetMembers === 'number' ? finalData.targetMembers : null,
                description: (finalData.description as string) || null,
              } as never);

              if (error) throw error;
              createdCount++;
            }
          } else {
            if (row.isDuplicate && duplicatePolicy === 'update') updatedCount++;
            else createdCount++;
          }
        } else if (module === 'tasks') {
          if (isSupabaseConfigured) {
            if (row.isDuplicate && row.existingRecordId && duplicatePolicy === 'update') {
              const { error } = await supabase
                .from('tasks')
                .update({
                  title: String(finalData.title),
                  description: (finalData.description as string) || null,
                  priority: (finalData.priority as DbTaskRow['priority']) || 'medium',
                  status: (finalData.status as DbTaskRow['status']) || 'todo',
                  progress: typeof finalData.progress === 'number' ? finalData.progress : 0,
                  due_date: (finalData.dueDate as string) || null,
                } as never)
                .eq('id', row.existingRecordId)
                .eq('organization_id', organizationId);

              if (error) throw error;
              updatedCount++;
            } else {
              const { error } = await supabase.from('tasks').insert({
                organization_id: organizationId,
                term_id: termId || null,
                title: String(finalData.title),
                description: (finalData.description as string) || null,
                priority: (finalData.priority as DbTaskRow['priority']) || 'medium',
                status: (finalData.status as DbTaskRow['status']) || 'todo',
                progress: typeof finalData.progress === 'number' ? finalData.progress : 0,
                due_date: (finalData.dueDate as string) || null,
              } as never);

              if (error) throw error;
              createdCount++;
            }
          } else {
            if (row.isDuplicate && duplicatePolicy === 'update') updatedCount++;
            else createdCount++;
          }
        } else if (module === 'participants') {
          if (isSupabaseConfigured) {
            const mssv = String(finalData.studentId || '').trim().toUpperCase();
            const fullName = String(finalData.fullName || '').trim();

            let memberId: string | null = null;
            if (mssv) {
              const { data: mem } = await supabase
                .from('members')
                .select('id')
                .eq('organization_id', organizationId)
                .ilike('student_id', mssv)
                .maybeSingle();
              memberId = (mem as { id: string } | null)?.id || null;
            }

            if (!memberId && mssv && fullName) {
              const { data: newMem, error: memErr } = await supabase
                .from('members')
                .insert({
                  organization_id: organizationId,
                  student_id: mssv,
                  full_name: fullName,
                  status: 'active',
                } as never)
                .select('id')
                .single();
              if (!memErr && newMem) {
                memberId = (newMem as { id: string }).id;
              }
            }

            if (!memberId) {
              throw new Error(`Không tìm thấy hội viên với MSSV "${mssv}"`);
            }

            // Target activity
            const { data: defaultAct } = await supabase
              .from('activities')
              .select('id')
              .eq('organization_id', organizationId)
              .order('start_date', { ascending: false })
              .limit(1)
              .maybeSingle();

            const targetActivityId = (defaultAct as { id: string } | null)?.id;
            if (!targetActivityId) {
              throw new Error('Chưa có hoạt động nào trong Chi hội để liên kết người tham gia.');
            }

            const regStatus = (finalData.registrationStatus as string) || 'confirmed';
            const attStatus = (finalData.attendanceStatus as string) || 'present';

            if (row.isDuplicate && row.existingRecordId && duplicatePolicy === 'update') {
              const { error: partErr } = await supabase
                .from('activity_participants')
                .update({
                  registration_status: regStatus,
                  attendance_status: attStatus,
                  notes: (finalData.notes as string) || null,
                } as never)
                .eq('id', row.existingRecordId);
              if (partErr) throw partErr;
              updatedCount++;
            } else {
              const { error: partErr } = await supabase
                .from('activity_participants')
                .insert({
                  activity_id: targetActivityId,
                  member_id: memberId,
                  registration_status: regStatus,
                  attendance_status: attStatus,
                  source: 'sheet_import',
                  notes: (finalData.notes as string) || null,
                } as never);
              if (partErr) throw partErr;
              createdCount++;
            }
          } else {
            if (row.isDuplicate && duplicatePolicy === 'update') updatedCount++;
            else createdCount++;
          }
        } else if (module === 'finance') {
          // Finance Insert: Find or create category if needed, ensure amount > 0
          if (isSupabaseConfigured) {
            const catName = String(finalData.categoryName || 'Chi tiêu chung').trim();
            const txType = finalData.transactionType === 'income' ? 'income' : 'expense';

            const { data: catData } = await supabase
              .from('finance_categories')
              .select('id')
              .eq('organization_id', organizationId)
              .ilike('name', catName)
              .maybeSingle();

            const existingCat = catData as { id: string } | null;
            let categoryId: string | undefined = existingCat?.id;

            if (!categoryId) {
              const { data: newCat } = await supabase
                .from('finance_categories')
                .insert({
                  organization_id: organizationId,
                  name: catName,
                  type: txType,
                  is_system: false,
                } as never)
                .select('id')
                .single();
              const insertedCat = newCat as { id: string } | null;
              if (insertedCat) categoryId = insertedCat.id;
            }

            if (!categoryId) {
              throw new Error(`Không thể tìm hoặc tạo danh mục "${catName}"`);
            }

            // Insert transaction
            const { error: txError } = await supabase.from('finance_transactions').insert({
              organization_id: organizationId,
              term_id: termId || null,
              category_id: categoryId,
              transaction_type: txType,
              amount: Number(finalData.amount) || 0,
              description: String(finalData.description || 'Giao dịch nhập từ Google Sheets'),
              transaction_date: String(finalData.transactionDate || new Date().toISOString().split('T')[0]),
            } as never);

            if (txError) throw txError;
            createdCount++;
          } else {
            createdCount++;
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        failedCount++;
        errors.push({
          rowIndex: row.rowIndex,
          identifier: row.identityKeyValue || `Dòng ${row.rowIndex}`,
          message: error.message || 'Lỗi không xác định khi lưu vào cơ sở dữ liệu',
        });
      }
    }

    // Audit Log
    try {
      const { data: authData } = await supabase.auth.getUser();
      await auditLogService.logAction({
        organization_id: organizationId,
        user_id: authData?.user?.id || null,
        action: 'google_sheet.import',
        entity_type: 'google_sheet_import',
        entity_id: organizationId,
        metadata: {
          module,
          totalProcessed: previewRows.length,
          createdCount,
          updatedCount,
          skippedCount,
          failedCount,
          termId: termId || null,
        } as Json,
      });
    } catch (auditErr) {
      console.warn('[GoogleSheets] Audit log error on import:', auditErr);
    }

    return {
      module,
      totalProcessed: previewRows.length,
      createdCount,
      updatedCount,
      skippedCount,
      failedCount,
      errors,
      importedAt: new Date().toISOString(),
      message: `Đã xử lý ${previewRows.length} dòng: Tạo mới ${createdCount}, Cập nhật ${updatedCount}, Bỏ qua ${skippedCount}, Thất bại ${failedCount}.`,
    };
  },
};
