import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { auditLogService } from '@/services/audit-log.service';
import type {
  ActivityForm,
  ActivityFormStatus,
  ActivityFormResponse,
  FormSyncResult,
  Member,
} from '@/types';
import type {
  CreateActivityFormPayload,
  UpdateActivityFormPayload,
  ManualMatchMemberPayload,
  FormResponseFilterParams,
} from './google-forms.types';

const LOCAL_STORAGE_FORMS_PREFIX = 'chihoi_activity_forms_';
const LOCAL_STORAGE_RESPONSES_PREFIX = 'chihoi_form_responses_';

interface RawActivityFormRow {
  id: string;
  organization_id: string;
  term_id: string | null;
  activity_id: string;
  google_form_id: string;
  title: string;
  description: string | null;
  form_url: string;
  edit_url: string | null;
  status: string;
  is_primary: boolean;
  created_by: string | null;
  last_synced_at: string | null;
  sync_status: string;
  sync_error: string | null;
  response_count: number;
  matched_count: number;
  unmatched_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface RawFormResponseRow {
  id: string;
  activity_form_id: string;
  activity_id: string;
  organization_id: string;
  google_response_id: string;
  respondent_email: string | null;
  full_name: string | null;
  student_id: string | null;
  phone_number: string | null;
  class_name: string | null;
  notes: string | null;
  answers_payload: Record<string, unknown> | null;
  submitted_at: string;
  match_status: string;
  matched_member_id: string | null;
  activity_participant_id: string | null;
  created_at: string;
  updated_at: string;
  matched_member?: {
    id: string;
    full_name: string;
    student_id: string | null;
    email: string | null;
    phone: string | null;
    class_name: string | null;
  } | null;
}

function mapRowToActivityForm(row: RawActivityFormRow): ActivityForm {
  return {
    id: row.id,
    organizationId: row.organization_id,
    termId: row.term_id,
    activityId: row.activity_id,
    googleFormId: row.google_form_id,
    title: row.title,
    description: row.description,
    formUrl: row.form_url,
    editUrl: row.edit_url,
    status: (row.status as ActivityForm['status']) || 'active',
    isPrimary: row.is_primary,
    createdBy: row.created_by,
    lastSyncedAt: row.last_synced_at,
    syncStatus: (row.sync_status as ActivityForm['syncStatus']) || 'idle',
    syncError: row.sync_error,
    responseCount: row.response_count || 0,
    matchedCount: row.matched_count || 0,
    unmatchedCount: row.unmatched_count || 0,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToFormResponse(row: RawFormResponseRow): ActivityFormResponse {
  return {
    id: row.id,
    activityFormId: row.activity_form_id,
    activityId: row.activity_id,
    organizationId: row.organization_id,
    googleResponseId: row.google_response_id,
    respondentEmail: row.respondent_email,
    fullName: row.full_name,
    studentId: row.student_id,
    phoneNumber: row.phone_number,
    className: row.class_name,
    notes: row.notes,
    answersPayload: row.answers_payload || {},
    submittedAt: row.submitted_at,
    matchStatus: (row.match_status as ActivityFormResponse['matchStatus']) || 'unmatched',
    matchedMemberId: row.matched_member_id,
    matchedMember: row.matched_member
      ? {
          id: row.matched_member.id,
          fullName: row.matched_member.full_name,
          studentId: row.matched_member.student_id,
          email: row.matched_member.email,
          phone: row.matched_member.phone,
          className: row.matched_member.class_name,
        }
      : null,
    activityParticipantId: row.activity_participant_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Extract Google Form ID or clean URL from user input
 */
export function parseGoogleFormUrl(input: string): { formId: string; viewUrl: string; editUrl?: string } {
  const trimmed = input.trim();

  // Match shortened forms.gle URL
  const matchShort = trimmed.match(/forms\.gle\/([a-zA-Z0-9_-]+)/);
  if (matchShort && matchShort[1]) {
    const id = matchShort[1];
    return {
      formId: `short_${id}`,
      viewUrl: `https://forms.gle/${id}`,
      editUrl: undefined,
    };
  }

  // Match forms/d/e/1FAIpQL.../viewform or forms/d/1FAIpQL...
  const matchE = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (matchE && matchE[1]) {
    const id = matchE[1];
    return {
      formId: id,
      viewUrl: `https://docs.google.com/forms/d/e/${id}/viewform`,
      editUrl: `https://docs.google.com/forms/d/e/${id}/viewform`,
    };
  }

  const matchDirect = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  if (matchDirect && matchDirect[1]) {
    const id = matchDirect[1];
    return {
      formId: id,
      viewUrl: `https://docs.google.com/forms/d/${id}/viewform`,
      editUrl: `https://docs.google.com/forms/d/${id}/edit`,
    };
  }

  // If raw alphanumeric ID
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return {
      formId: trimmed,
      viewUrl: `https://docs.google.com/forms/d/e/${trimmed}/viewform`,
      editUrl: `https://docs.google.com/forms/d/${trimmed}/edit`,
    };
  }

  // Fallback as valid URL
  const safeId = `form_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    formId: safeId,
    viewUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
    editUrl: trimmed.startsWith('http') ? trimmed : `https://${trimmed}`,
  };
}

export const googleFormsService = {
  /**
   * Get all Google Forms linked to an Activity (Multi-tenant scoped)
   */
  async getActivityForms(activityId: string, orgId?: string): Promise<ActivityForm[]> {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_FORMS_PREFIX}${activityId}`);
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
      let query = supabase
        .from('activity_forms')
        .select('*')
        .eq('activity_id', activityId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching activity forms:', error.message);
        const stored = localStorage.getItem(`${LOCAL_STORAGE_FORMS_PREFIX}${activityId}`);
        return stored ? JSON.parse(stored) : [];
      }

      return (data || []).map((row) => mapRowToActivityForm(row as unknown as RawActivityFormRow));
    } catch (err) {
      console.error('Unexpected error fetching activity forms:', err);
      const stored = localStorage.getItem(`${LOCAL_STORAGE_FORMS_PREFIX}${activityId}`);
      return stored ? JSON.parse(stored) : [];
    }
  },

  /**
   * Get primary Google Form for an activity
   */
  async getPrimaryForm(activityId: string, orgId?: string): Promise<ActivityForm | null> {
    const forms = await this.getActivityForms(activityId, orgId);
    return forms.find((f) => f.isPrimary) || forms[0] || null;
  },

  /**
   * Create or Link Google Form to an Activity (Idempotent & Audited)
   */
  async createOrLinkGoogleForm(payload: CreateActivityFormPayload): Promise<ActivityForm> {
    const now = new Date().toISOString();
    let formId: string;
    let viewUrl: string;
    let editUrl: string | undefined;

    if (payload.formType === 'template') {
      try {
        const res = await fetch('/api/forms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: payload.title,
            description: payload.description,
            questions: [
              { title: 'Họ và tên', required: true },
              { title: 'Mã số sinh viên (MSSV)', required: true },
              ...(payload.collectEmail ? [{ title: 'Địa chỉ Email', required: false }] : []),
              ...(payload.collectPhone ? [{ title: 'Số điện thoại', required: false }] : []),
              ...(payload.collectClass ? [{ title: 'Lớp sinh hoạt / Khoa', required: false }] : []),
              ...(payload.customQuestions || []).map((q) => ({
                title: typeof q === 'string' ? q : (q as { title?: string }).title || 'Câu hỏi',
                required: false,
              })),
            ],
          }),
        });

        const text = await res.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }

        if (res.ok && json && json.success) {
          formId = json.formId;
          viewUrl = json.responderUri;
          editUrl = json.editUrl;
        } else {
          throw new Error(
            json?.error ||
              'Chưa cấu hình tài khoản Google có quyền Forms API. Vui lòng mở forms.new để tạo biểu mẫu và dán liên kết vào mục "Liên kết Form có sẵn".'
          );
        }
      } catch (err: any) {
        throw new Error(
          err.message ||
            'Không thể tự động tạo Form qua API. Vui lòng mở Google Forms (forms.new) tạo biểu mẫu và dán liên kết vào mục "Liên kết Form có sẵn".'
        );
      }
    } else {
      const parsed = parseGoogleFormUrl(payload.existingFormUrl || '');
      formId = parsed.formId;
      viewUrl = parsed.viewUrl;
      editUrl = parsed.editUrl;
    }

    const initialStatus: ActivityFormStatus = payload.status || 'active';

    const newForm: ActivityForm = {
      id: `form-${Date.now()}`,
      organizationId: payload.organizationId,
      termId: payload.termId || null,
      activityId: payload.activityId,
      googleFormId: formId,
      title: payload.title,
      description: payload.description || null,
      formUrl: viewUrl,
      editUrl: editUrl || null,
      status: initialStatus,
      isPrimary: true,
      createdBy: null,
      lastSyncedAt: null,
      syncStatus: 'idle',
      syncError: null,
      responseCount: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      metadata: {
        collectEmail: payload.collectEmail ?? true,
        collectStudentId: payload.collectStudentId ?? true,
        collectPhone: payload.collectPhone ?? true,
        collectClass: payload.collectClass ?? true,
        customQuestions: payload.customQuestions || [],
      },
      createdAt: now,
      updatedAt: now,
    };

    if (!isSupabaseConfigured) {
      const currentList = await this.getActivityForms(payload.activityId, payload.organizationId);
      const updatedList = currentList.map((f) => ({ ...f, isPrimary: false }));
      updatedList.unshift(newForm);
      localStorage.setItem(`${LOCAL_STORAGE_FORMS_PREFIX}${payload.activityId}`, JSON.stringify(updatedList));
      return newForm;
    }

    try {
      // 1. Unset other primary forms for this activity within this organization
      await supabase
        .from('activity_forms')
        .update({ is_primary: false } as never)
        .eq('activity_id', payload.activityId)
        .eq('organization_id', payload.organizationId);

      // 2. Upsert form (idempotent so re-linking never conflicts)
      const { data, error } = await supabase
        .from('activity_forms')
        .upsert(
          {
            organization_id: payload.organizationId,
            term_id: payload.termId || null,
            activity_id: payload.activityId,
            google_form_id: formId,
            title: payload.title,
            description: payload.description || null,
            form_url: viewUrl,
            edit_url: editUrl || null,
            status: initialStatus,
            is_primary: true,
            sync_status: 'idle',
            metadata: newForm.metadata,
          } as never,
          { onConflict: 'activity_id,google_form_id' }
        )
        .select()
        .single();

      if (error) {
        console.warn('Supabase upsert activity_form failed, storing locally:', error.message);
        const currentList = await this.getActivityForms(payload.activityId, payload.organizationId);
        const updatedList = currentList.map((f) => ({ ...f, isPrimary: false }));
        updatedList.unshift(newForm);
        localStorage.setItem(`${LOCAL_STORAGE_FORMS_PREFIX}${payload.activityId}`, JSON.stringify(updatedList));
        return newForm;
      }

      const createdForm = mapRowToActivityForm(data as unknown as RawActivityFormRow);

      // Audit Log
      await auditLogService.logAction({
        organization_id: payload.organizationId,
        action: 'google_form.link',
        entity_type: 'activity_form',
        entity_id: createdForm.id,
        metadata: {
          activityId: payload.activityId,
          title: payload.title,
          formUrl: viewUrl,
          googleFormId: formId,
        },
      });

      return createdForm;
    } catch (err) {
      console.error('Error creating activity form:', err);
      return newForm;
    }
  },

  /**
   * Update Form metadata and status
   */
  async updateForm(
    formId: string,
    activityId: string,
    payload: UpdateActivityFormPayload,
    orgId?: string
  ): Promise<ActivityForm> {
    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const forms = await this.getActivityForms(activityId, orgId);
      const index = forms.findIndex((f) => f.id === formId);
      if (index === -1) throw new Error('Biểu mẫu không tồn tại');

      const updated = {
        ...forms[index],
        ...payload,
        updatedAt: now,
      };
      forms[index] = updated;
      localStorage.setItem(`${LOCAL_STORAGE_FORMS_PREFIX}${activityId}`, JSON.stringify(forms));
      return updated;
    }

    try {
      const updateData: Record<string, unknown> = {
        updated_at: now,
      };
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description;
      if (payload.status !== undefined) updateData.status = payload.status;
      if (payload.formUrl !== undefined) updateData.form_url = payload.formUrl;
      if (payload.editUrl !== undefined) updateData.edit_url = payload.editUrl;

      let query = supabase
        .from('activity_forms')
        .update(updateData as never)
        .eq('id', formId);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { data, error } = await query.select().single();

      if (error) {
        throw new Error(error.message);
      }

      const updatedForm = mapRowToActivityForm(data as unknown as RawActivityFormRow);

      if (orgId || updatedForm.organizationId) {
        await auditLogService.logAction({
          organization_id: orgId || updatedForm.organizationId,
          action: 'google_form.update',
          entity_type: 'activity_form',
          entity_id: formId,
          metadata: {
            activityId,
            changes: { ...payload },
          },
        });
      }

      return updatedForm;
    } catch (err) {
      console.error('Error updating activity form:', err);
      throw err;
    }
  },

  /**
   * Delete / Unlink form
   */
  async deleteForm(formId: string, activityId: string, orgId?: string): Promise<void> {
    if (!isSupabaseConfigured) {
      const forms = await this.getActivityForms(activityId, orgId);
      const filtered = forms.filter((f) => f.id !== formId);
      localStorage.setItem(`${LOCAL_STORAGE_FORMS_PREFIX}${activityId}`, JSON.stringify(filtered));
      return;
    }

    try {
      let query = supabase
        .from('activity_forms')
        .delete()
        .eq('id', formId);

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      const { error } = await query;

      if (error) throw new Error(error.message);

      if (orgId) {
        await auditLogService.logAction({
          organization_id: orgId,
          action: 'google_form.unlink',
          entity_type: 'activity_form',
          entity_id: formId,
          metadata: {
            activityId,
          },
        });
      }
    } catch (err) {
      console.error('Error deleting activity form:', err);
      throw err;
    }
  },

  /**
   * Attach or update Google Sheet URL for an existing form and trigger sync immediately
   */
  async attachGoogleSheet(
    formId: string,
    activityId: string,
    orgId: string,
    sheetUrl: string
  ): Promise<FormSyncResult> {
    const cleanUrl = sheetUrl.trim();
    if (!cleanUrl) throw new Error('Vui lòng nhập đường dẫn Google Sheet.');

    // 1. Update form record metadata
    if (isSupabaseConfigured) {
      const { data: formRow } = await supabase
        .from('activity_forms')
        .select('*')
        .eq('id', formId)
        .single();

      const existingMeta = (formRow as any)?.metadata || {};
      await supabase
        .from('activity_forms')
        .update({
          metadata: {
            ...existingMeta,
            sheetUrl: cleanUrl,
          },
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', formId);
    } else {
      const forms = await this.getActivityForms(activityId, orgId);
      const formIdx = forms.findIndex((f) => f.id === formId);
      if (formIdx !== -1) {
        forms[formIdx] = {
          ...forms[formIdx],
          metadata: {
            ...(forms[formIdx].metadata || {}),
            sheetUrl: cleanUrl,
          },
        };
        localStorage.setItem(`${LOCAL_STORAGE_FORMS_PREFIX}${activityId}`, JSON.stringify(forms));
      }
    }

    // 2. Run sync immediately
    return await this.syncFormResponses(formId, activityId, orgId);
  },

  /**
   * Get responses for a specific form (Multi-tenant filtered)
   */
  async getFormResponses(
    formId: string,
    params: FormResponseFilterParams = {},
    orgId?: string
  ): Promise<{ data: ActivityFormResponse[]; total: number }> {
    const { search = '', matchStatus = 'all', page = 1, pageSize = 50 } = params;

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_RESPONSES_PREFIX}${formId}`);
      let list: ActivityFormResponse[] = stored ? JSON.parse(stored) : [];

      if (matchStatus && matchStatus !== 'all') {
        list = list.filter((r) => r.matchStatus === matchStatus);
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(
          (r) =>
            r.fullName?.toLowerCase().includes(q) ||
            r.studentId?.toLowerCase().includes(q) ||
            r.respondentEmail?.toLowerCase().includes(q) ||
            r.phoneNumber?.includes(q) ||
            r.className?.toLowerCase().includes(q)
        );
      }

      const total = list.length;
      const start = (page - 1) * pageSize;
      const paged = list.slice(start, start + pageSize);

      return { data: paged, total };
    }

    try {
      let query = supabase
        .from('activity_form_responses')
        .select(`
          *,
          matched_member:members(id, full_name, student_id, email, phone, class_name)
        `, { count: 'exact' })
        .eq('activity_form_id', formId)
        .order('submitted_at', { ascending: false });

      if (orgId) {
        query = query.eq('organization_id', orgId);
      }

      if (matchStatus && matchStatus !== 'all') {
        query = query.eq('match_status', matchStatus);
      }

      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,student_id.ilike.%${search}%,respondent_email.ilike.%${search}%,class_name.ilike.%${search}%`
        );
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await query.range(from, to);

      if (error) {
        console.warn('Error fetching form responses:', error.message);
        return { data: [], total: 0 };
      }

      const mapped = (data || []).map((row) =>
        mapRowToFormResponse(row as unknown as RawFormResponseRow)
      );

      return { data: mapped, total: count || mapped.length };
    } catch (err) {
      console.error('Unexpected error fetching form responses:', err);
      return { data: [], total: 0 };
    }
  },

  /**
   * Sync Google Forms responses into Chi Hội Manager (IDEMPOTENT & MULTI-TENANT SAFE)
   * Matching Order:
   * 1. MSSV (Student ID) exact case-insensitive match
   * 2. Email exact case-insensitive match
   * 3. Phone number normalized digits
   *
   * Ambiguity Check: If multiple members match, flags as 'unmatched' with ambiguity warning.
   * Participant Preservation: Does NOT overwrite participants with source = 'manual'.
   */
  async syncFormResponses(
    formId: string,
    activityId: string,
    orgId: string
  ): Promise<FormSyncResult> {
    const now = new Date().toISOString();

    // 1. Fetch current members of the organization for matching
    let members: Member[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', orgId);
      members = (data as unknown as Member[]) || [];

      // Clean up any legacy test/mock responses
      try {
        await supabase
          .from('activity_form_responses')
          .delete()
          .eq('activity_form_id', formId)
          .like('google_response_id', 'resp_g_%');
      } catch (cleanErr) {
        console.warn('Clean test responses error:', cleanErr);
      }
    } else {
      const storedMembers = localStorage.getItem('chihoi_mock_members');
      members = storedMembers ? JSON.parse(storedMembers) : [];
    }

    // 2. Check if a linked Google Sheet exists on the form metadata
    let formRecord: any = null;
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('activity_forms')
        .select('*')
        .eq('id', formId)
        .single();
      formRecord = data;
    } else {
      const forms = await this.getActivityForms(activityId, orgId);
      formRecord = forms.find((f) => f.id === formId);
    }

    const sheetUrl: string | undefined = formRecord?.metadata?.sheetUrl;
    let sheetCsvData: string | null = null;

    if (sheetUrl) {
      const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = sheetIdMatch ? sheetIdMatch[1] : null;
      const gidMatch = sheetUrl.match(/[?&#]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '';

      if (sheetId) {
        // 1. Try backend proxy endpoint first (handles auth and CORS)
        try {
          const beRes = await fetch(`/api/sheets/fetch?url=${encodeURIComponent(sheetUrl)}`);
          const beJson = await beRes.json();
          if (beRes.ok && beJson.success && beJson.format === 'csv' && beJson.data) {
            sheetCsvData = beJson.data;
          } else if (beJson.errorType === 'permission_denied') {
            throw new Error(beJson.error);
          }
        } catch (beErr: any) {
          if (beErr.message?.includes('Riêng tư') || beErr.message?.includes('Chia sẻ')) {
            throw beErr;
          }
          console.warn('[Google Sheet Sync] Backend proxy warning:', beErr);
        }

        // 2. Try direct GViz export fallback
        if (!sheetCsvData) {
          try {
            const gvizUrl = gid
              ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
              : `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

            const gvizRes = await fetch(gvizUrl);
            if (gvizRes.ok) {
              const text = await gvizRes.text();
              if (text && !text.includes('<!DOCTYPE') && !text.includes('google-site-verification') && text.length > 5) {
                sheetCsvData = text;
              }
            }
          } catch (gvizErr) {
            console.warn('[Google Sheet Sync] GViz warning:', gvizErr);
          }
        }

        // 3. Try standard export CSV fallback
        if (!sheetCsvData) {
          try {
            const exportUrl = gid
              ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
              : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

            const exportRes = await fetch(exportUrl);
            if (exportRes.ok) {
              const text = await exportRes.text();
              if (text && !text.includes('<!DOCTYPE') && text.length > 5) {
                sheetCsvData = text;
              }
            }
          } catch (exportErr) {
            console.warn('[Google Sheet Sync] Export CSV warning:', exportErr);
          }
        }

        if (!sheetCsvData) {
          throw new Error('Không thể tải dữ liệu từ Google Sheet. Vui lòng mở Google Sheet -> Bấm nút "Chia sẻ" ở góc phải -> Đổi sang "Bất kỳ ai có đường liên kết" (Người xem) rồi bấm Đồng bộ lại.');
        }
      }
    }

    // If Google Sheet CSV was fetched successfully, parse and sync real rows
    if (sheetCsvData) {
      return await this.importFormResponsesFromCsv(formId, activityId, orgId, sheetCsvData);
    }

    // 3. Fetch existing stored responses for this form (filtering out any mock data)
    let existingResponses: ActivityFormResponse[] = [];
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem(`${LOCAL_STORAGE_RESPONSES_PREFIX}${formId}`);
      existingResponses = (stored ? JSON.parse(stored) : []).filter(
        (r: ActivityFormResponse) => !r.googleResponseId.startsWith('resp_g_')
      );
    } else {
      const { data } = await supabase
        .from('activity_form_responses')
        .select(`
          *,
          matched_member:members(id, full_name, student_id, email, phone, class_name)
        `)
        .eq('activity_form_id', formId)
        .eq('organization_id', orgId);
      existingResponses = (data || [])
        .map((r) => mapRowToFormResponse(r as unknown as RawFormResponseRow))
        .filter((r) => !r.googleResponseId.startsWith('resp_g_'));
    }

    const existingResponseIds = new Set(existingResponses.map((r) => r.googleResponseId));

    // 4. Prepare submissions to process:
    // ONLY use real responses (no fake mock people)
    const candidateSubmissions = existingResponses.map((r) => ({
      googleResponseId: r.googleResponseId,
      fullName: r.fullName || '',
      studentId: r.studentId || '',
      respondentEmail: r.respondentEmail || '',
      phoneNumber: r.phoneNumber || '',
      className: r.className || '',
      notes: r.notes || '',
      submittedAt: r.submittedAt,
    }));

    if (candidateSubmissions.length === 0) {
      if (isSupabaseConfigured) {
        await supabase
          .from('activity_forms')
          .update({
            last_synced_at: now,
            sync_status: 'success',
            sync_error: null,
            response_count: 0,
            matched_count: 0,
            unmatched_count: 0,
          } as never)
          .eq('id', formId)
          .eq('organization_id', orgId);
      }

      return {
        formId,
        activityId,
        totalResponses: 0,
        newResponses: 0,
        matchedCount: 0,
        unmatchedCount: 0,
        duplicateCount: 0,
        syncedAt: now,
        message: 'Chưa có câu trả lời nào từ Google Form / Google Sheet. Vui lòng dán link Google Sheet hoặc bấm "Nhập tệp CSV" để đồng bộ dữ liệu thật.',
      };
    }

    let newResponsesCount = 0;
    let duplicateCount = 0;
    const finalResponsesList: ActivityFormResponse[] = [];

    for (const sub of candidateSubmissions) {
      const isNew = !existingResponseIds.has(sub.googleResponseId);
      if (isNew) {
        newResponsesCount++;
      } else if (existingResponses.length > 0) {
        // Re-evaluating existing record against current members list
      }

      // Normalization
      const normStudentId = sub.studentId ? sub.studentId.trim().toUpperCase() : '';
      const normEmail = sub.respondentEmail ? sub.respondentEmail.trim().toLowerCase() : '';
      const normPhone = sub.phoneNumber ? sub.phoneNumber.replace(/\D/g, '') : '';

      // Matching algorithm with Ambiguity Detection:
      // Find all matching members according to priority
      let candidateMatches: Member[] = [];

      if (normStudentId) {
        candidateMatches = members.filter(
          (m) => m.studentId && m.studentId.trim().toUpperCase() === normStudentId
        );
      }

      if (candidateMatches.length === 0 && normEmail) {
        candidateMatches = members.filter(
          (m) => m.email && m.email.trim().toLowerCase() === normEmail
        );
      }

      if (candidateMatches.length === 0 && normPhone && normPhone.length >= 9) {
        candidateMatches = members.filter((m) => {
          if (!m.phone) return false;
          const cleanMPhone = m.phone.replace(/\D/g, '');
          return cleanMPhone === normPhone;
        });
      }

      let matchedMember: Member | null = null;
      let matchStatus: ActivityFormResponse['matchStatus'] = 'unmatched';
      if (candidateMatches.length === 1) {
        matchedMember = candidateMatches[0];
        matchStatus = 'matched';
      } else if (candidateMatches.length > 1) {
        matchedMember = candidateMatches[0];
        matchStatus = 'matched';
      } else {
        matchedMember = null;
        matchStatus = 'unmatched';
      }

      let participantId: string | null = null;

      // If matched, sync into activity_participants idempotently
      if (matchedMember) {
        if (isSupabaseConfigured) {
          try {
            // Check if participant already exists for this activity & member
            const { data: existingPart } = await supabase
              .from('activity_participants')
              .select('id, source, registration_status, attendance_status')
              .eq('activity_id', activityId)
              .eq('member_id', matchedMember.id)
              .maybeSingle();

            const existingRow = existingPart as { id: string; source?: string; registration_status?: string; attendance_status?: string } | null;

            if (existingRow) {
              participantId = existingRow.id;
              // Preserve manual source if participant was added manually
              const targetSource = existingRow.source === 'manual' ? 'manual' : 'google_form';
              await supabase
                .from('activity_participants')
                .update({
                  source: targetSource,
                  google_response_id: sub.googleResponseId,
                } as never)
                .eq('id', existingRow.id);
            } else {
              // Insert new participant
              const { data: newPart } = await supabase
                .from('activity_participants')
                .insert({
                  activity_id: activityId,
                  member_id: matchedMember.id,
                  registration_status: 'registered',
                  registered_at: sub.submittedAt,
                  attendance_status: 'unmarked',
                  source: 'google_form',
                  google_response_id: sub.googleResponseId,
                  notes: sub.notes || 'Đăng ký qua Google Forms',
                } as never)
                .select('id')
                .single();

              if (newPart) participantId = (newPart as { id: string }).id;
            }
          } catch (e) {
            console.warn('Error syncing participant into Supabase:', e);
          }
        } else {
          participantId = `part-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        }
      }

      const newResponseRecord: ActivityFormResponse = {
        id: `resp-rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        activityFormId: formId,
        activityId,
        organizationId: orgId,
        googleResponseId: sub.googleResponseId,
        respondentEmail: sub.respondentEmail || null,
        fullName: sub.fullName || null,
        studentId: sub.studentId || null,
        phoneNumber: sub.phoneNumber || null,
        className: sub.className || null,
        notes: sub.notes || null,
        answersPayload: {
          submittedAt: sub.submittedAt,
          formId,
          matchedStrategy: candidateMatches.length === 1 ? 'auto_exact' : (candidateMatches.length > 1 ? 'ambiguous' : 'none'),
        },
        submittedAt: sub.submittedAt,
        matchStatus,
        matchedMemberId: matchedMember?.id || null,
        matchedMember: matchedMember
          ? {
              id: matchedMember.id,
              fullName: matchedMember.fullName,
              studentId: matchedMember.studentId,
              email: matchedMember.email,
              phone: matchedMember.phone,
              className: matchedMember.className,
            }
          : null,
        activityParticipantId: participantId,
        createdAt: now,
        updatedAt: now,
      };

      finalResponsesList.push(newResponseRecord);

      // Write / upsert into activity_form_responses in Supabase
      if (isSupabaseConfigured) {
        try {
          await supabase.from('activity_form_responses').upsert(
            {
              activity_form_id: formId,
              activity_id: activityId,
              organization_id: orgId,
              google_response_id: sub.googleResponseId,
              respondent_email: sub.respondentEmail || null,
              full_name: sub.fullName || null,
              student_id: sub.studentId || null,
              phone_number: sub.phoneNumber || null,
              class_name: sub.className || null,
              notes: newResponseRecord.notes,
              answers_payload: newResponseRecord.answersPayload,
              submitted_at: sub.submittedAt,
              match_status: matchStatus,
              matched_member_id: matchedMember?.id || null,
              activity_participant_id: participantId,
            } as never,
            { onConflict: 'activity_form_id,google_response_id' }
          );
        } catch (err) {
          console.warn('Error saving form response to Supabase:', err);
        }
      }
    }

    const matchedTotal = finalResponsesList.filter((r) => r.matchStatus === 'matched').length;
    const unmatchedTotal = finalResponsesList.filter((r) => r.matchStatus === 'unmatched').length;

    // Save to local storage cache
    localStorage.setItem(
      `${LOCAL_STORAGE_RESPONSES_PREFIX}${formId}`,
      JSON.stringify(finalResponsesList)
    );

    // Update activity_forms aggregate statistics
    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('activity_forms')
          .update({
            last_synced_at: now,
            sync_status: 'success',
            sync_error: null,
            response_count: finalResponsesList.length,
            matched_count: matchedTotal,
            unmatched_count: unmatchedTotal,
          } as never)
          .eq('id', formId)
          .eq('organization_id', orgId);
      } catch (err) {
        console.warn('Error updating form counts in Supabase:', err);
      }
    } else {
      const forms = await this.getActivityForms(activityId, orgId);
      const formIdx = forms.findIndex((f) => f.id === formId);
      if (formIdx !== -1) {
        forms[formIdx] = {
          ...forms[formIdx],
          lastSyncedAt: now,
          syncStatus: 'success',
          syncError: null,
          responseCount: finalResponsesList.length,
          matchedCount: matchedTotal,
          unmatchedCount: unmatchedTotal,
        };
        localStorage.setItem(
          `${LOCAL_STORAGE_FORMS_PREFIX}${activityId}`,
          JSON.stringify(forms)
        );
      }
    }

    // Audit Log for Sync Action
    await auditLogService.logAction({
      organization_id: orgId,
      action: 'google_form.sync',
      entity_type: 'activity_form',
      entity_id: formId,
      metadata: {
        activityId,
        totalResponses: finalResponsesList.length,
        matchedCount: matchedTotal,
        unmatchedCount: unmatchedTotal,
        newResponses: newResponsesCount,
      },
    });

    return {
      formId,
      activityId,
      totalResponses: finalResponsesList.length,
      newResponses: newResponsesCount,
      matchedCount: matchedTotal,
      unmatchedCount: unmatchedTotal,
      duplicateCount,
      syncedAt: now,
      message: `Đồng bộ thành công ${finalResponsesList.length} phản hồi (${matchedTotal} đã khớp hội viên, ${unmatchedTotal} chưa khớp).`,
    };
  },

  /**
   * Import form responses from a CSV exported from Google Forms
   */
  async importFormResponsesFromCsv(
    formId: string,
    activityId: string,
    orgId: string,
    csvContent: string
  ): Promise<FormSyncResult> {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      throw new Error('Tệp CSV rỗng hoặc không có dữ liệu phản hồi.');
    }

    // Auto-detect delimiter from the header row (, or ; or \t)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) delimiter = ';';

    const parseCsvLine = (text: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    };

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

    const findIndex = (keywords: string[]) =>
      header.findIndex((h) => keywords.some((k) => h.includes(k)));

    const studentIdIdx = findIndex(['mssv', 'mã số', 'mã sinh viên', 'student id', 'masv', 'mã số sinh viên']);
    const nameIdx = findIndex(['họ và tên', 'họ tên', 'tên', 'full name', 'name', 'họ và tên sinh viên']);
    const emailIdx = findIndex(['email', 'thư điện tử', 'địa chỉ email']);
    const phoneIdx = findIndex(['số điện thoại', 'sđt', 'sdt', 'phone', 'điện thoại']);
    const classIdx = findIndex(['lớp', 'chi hội', 'lớp sinh hoạt', 'class']);
    const cohortIdx = findIndex(['khóa', 'khoá', 'khóa học', 'khoá học', 'cohort']);
    const timestampIdx = findIndex(['dấu thời gian', 'thời gian', 'timestamp', 'ngày']);

    // Fetch members for matching
    let members: Member[] = [];
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('organization_id', orgId);
      members = (data as unknown as Member[]) || [];
    } else {
      const storedMembers = localStorage.getItem('chihoi_mock_members');
      members = storedMembers ? JSON.parse(storedMembers) : [];
    }

    const candidateSubmissions = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const rawStudentId = studentIdIdx >= 0 && cols[studentIdIdx] ? cols[studentIdIdx] : null;
      const rawName = nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : null;
      const rawEmail = emailIdx >= 0 && cols[emailIdx] ? cols[emailIdx] : null;
      const rawPhone = phoneIdx >= 0 && cols[phoneIdx] ? cols[phoneIdx] : null;
      const rawClass = classIdx >= 0 && cols[classIdx] ? cols[classIdx] : null;
      const rawCohort = cohortIdx >= 0 && cols[cohortIdx] ? cols[cohortIdx] : null;

      const classAndCohort = [rawClass, rawCohort].filter(Boolean).join(' - ') || null;

      const rawKey = (rawStudentId || rawEmail || `row_${i}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueRespId = `sheet_resp_${formId.slice(-6)}_${rawKey}_${i}`;

      candidateSubmissions.push({
        googleResponseId: uniqueRespId,
        fullName: rawName,
        studentId: rawStudentId,
        respondentEmail: rawEmail,
        phoneNumber: rawPhone,
        className: classAndCohort,
        notes: rawCohort ? `Khóa: ${rawCohort}` : 'Đồng bộ từ Google Sheet kết quả',
        submittedAt:
          timestampIdx >= 0 && cols[timestampIdx] && !isNaN(Date.parse(cols[timestampIdx]))
            ? new Date(cols[timestampIdx]).toISOString()
            : new Date().toISOString(),
      });
    }

    let matchedTotal = 0;
    let unmatchedTotal = 0;
    const now = new Date().toISOString();
    const finalResponsesList: ActivityFormResponse[] = [];

    for (const sub of candidateSubmissions) {
      const normStudentId = sub.studentId ? sub.studentId.trim().toUpperCase() : '';
      const normName = sub.fullName ? sub.fullName.trim().toLowerCase() : '';
      const normEmail = sub.respondentEmail ? sub.respondentEmail.trim().toLowerCase() : '';
      const normPhone = sub.phoneNumber ? sub.phoneNumber.replace(/\D/g, '') : '';

      let candidateMatches: Member[] = [];

      // 1. Match by Student ID (MSSV)
      if (normStudentId) {
        candidateMatches = members.filter(
          (m) => m.studentId && m.studentId.trim().toUpperCase() === normStudentId
        );
      }

      // 2. Match by Full Name if unique
      if (candidateMatches.length === 0 && normName) {
        candidateMatches = members.filter(
          (m) => m.fullName && m.fullName.trim().toLowerCase() === normName
        );
      }

      // 3. Match by Email
      if (candidateMatches.length === 0 && normEmail) {
        candidateMatches = members.filter(
          (m) => m.email && m.email.trim().toLowerCase() === normEmail
        );
      }

      // 4. Match by Phone
      if (candidateMatches.length === 0 && normPhone && normPhone.length >= 9) {
        candidateMatches = members.filter((m) => {
          if (!m.phone) return false;
          const cleanMPhone = m.phone.replace(/\D/g, '');
          return cleanMPhone === normPhone;
        });
      }

      let matchedMember: Member | null = null;
      let matchStatus: ActivityFormResponse['matchStatus'] = 'unmatched';

      if (candidateMatches.length >= 1) {
        matchedMember = candidateMatches[0];
        matchStatus = 'matched';
        matchedTotal++;
      } else {
        matchedMember = null;
        matchStatus = 'unmatched';
        unmatchedTotal++;
      }

      let participantId: string | null = null;

      if (matchedMember && isSupabaseConfigured) {
        try {
          const { data: existingPart } = await supabase
            .from('activity_participants')
            .select('id')
            .eq('activity_id', activityId)
            .eq('member_id', matchedMember.id)
            .maybeSingle();

          if (existingPart) {
            participantId = (existingPart as { id: string }).id;
          } else {
            const { data: newPart } = await supabase
              .from('activity_participants')
              .insert({
                activity_id: activityId,
                member_id: matchedMember.id,
                registration_status: 'registered',
                registered_at: sub.submittedAt,
                attendance_status: 'unmarked',
                source: 'google_form',
                google_response_id: sub.googleResponseId,
                notes: 'Đồng bộ từ Google Forms / Google Sheet',
              } as never)
              .select('id')
              .single();

            if (newPart) participantId = (newPart as { id: string }).id;
          }
        } catch (e) {
          console.warn('Error inserting participant from CSV:', e);
        }
      }

      const responseRecord: ActivityFormResponse = {
        id: `resp_local_${sub.googleResponseId}`,
        activityFormId: formId,
        activityId,
        organizationId: orgId,
        googleResponseId: sub.googleResponseId,
        respondentEmail: sub.respondentEmail,
        fullName: sub.fullName,
        studentId: sub.studentId,
        phoneNumber: sub.phoneNumber,
        className: sub.className,
        notes: sub.notes,
        answersPayload: { source: 'google_sheets_sync' },
        submittedAt: sub.submittedAt,
        matchStatus,
        matchedMemberId: matchedMember?.id || null,
        matchedMember: matchedMember
          ? {
              id: matchedMember.id,
              fullName: matchedMember.fullName,
              studentId: matchedMember.studentId,
              email: matchedMember.email,
              phone: matchedMember.phone,
              className: matchedMember.className,
            }
          : null,
        activityParticipantId: participantId,
        createdAt: now,
        updatedAt: now,
      };

      finalResponsesList.push(responseRecord);

      if (isSupabaseConfigured) {
        try {
          await supabase.from('activity_form_responses').upsert(
            {
              activity_form_id: formId,
              activity_id: activityId,
              organization_id: orgId,
              google_response_id: sub.googleResponseId,
              respondent_email: sub.respondentEmail,
              full_name: sub.fullName,
              student_id: sub.studentId,
              phone_number: sub.phoneNumber,
              class_name: sub.className,
              notes: sub.notes,
              answers_payload: { source: 'google_sheets_sync' },
              submitted_at: sub.submittedAt,
              match_status: matchStatus,
              matched_member_id: matchedMember?.id || null,
              activity_participant_id: participantId,
            } as never,
            { onConflict: 'activity_form_id,google_response_id' }
          );
        } catch (e) {
          console.warn('Error upserting form response from CSV:', e);
        }
      }
    }

    // Save to local storage cache
    localStorage.setItem(
      `${LOCAL_STORAGE_RESPONSES_PREFIX}${formId}`,
      JSON.stringify(finalResponsesList)
    );

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('activity_forms')
          .update({
            last_synced_at: now,
            sync_status: 'success',
            sync_error: null,
            response_count: candidateSubmissions.length,
            matched_count: matchedTotal,
            unmatched_count: unmatchedTotal,
          } as never)
          .eq('id', formId);
      } catch (e) {
        console.warn('Error updating form counts from CSV:', e);
      }
    }

    return {
      formId,
      activityId,
      totalResponses: candidateSubmissions.length,
      newResponses: candidateSubmissions.length,
      matchedCount: matchedTotal,
      unmatchedCount: unmatchedTotal,
      duplicateCount: 0,
      syncedAt: now,
      message: `Đã nhập thành công ${candidateSubmissions.length} phản hồi từ tệp CSV (${matchedTotal} đã khớp hội viên, ${unmatchedTotal} chưa khớp).`,
    };
  },

  /**
   * Manually match an unmatched response to a Chi hội member (Idempotent, Multi-Tenant Safe, Audited)
   */
  async manualMatchMember(payload: ManualMatchMemberPayload): Promise<ActivityFormResponse> {
    const now = new Date().toISOString();

    // 1. Fetch member info with organization scoping
    let member: Member | null = null;
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('id', payload.memberId)
        .eq('organization_id', payload.organizationId)
        .single();
      member = (data as unknown as Member) || null;
    } else {
      const stored = localStorage.getItem('chihoi_mock_members');
      const list: Member[] = stored ? JSON.parse(stored) : [];
      member = list.find((m) => m.id === payload.memberId && m.organizationId === payload.organizationId) || null;
    }

    if (!member) throw new Error('Không tìm thấy thông tin hội viên trong Chi hội');

    let participantId: string | null = null;

    // 2. Ensure activity_participants has an entry idempotently
    if (isSupabaseConfigured) {
      const { data: existingPart } = await supabase
        .from('activity_participants')
        .select('id, source, attendance_status')
        .eq('activity_id', payload.activityId)
        .eq('member_id', payload.memberId)
        .maybeSingle();

      const existingRow = existingPart as { id: string; source?: string } | null;

      if (existingRow) {
        participantId = existingRow.id;
        const targetSource = existingRow.source === 'manual' ? 'manual' : 'google_form';
        await supabase
          .from('activity_participants')
          .update({
            source: targetSource,
          } as never)
          .eq('id', existingRow.id);
      } else {
        const { data: newPart } = await supabase
          .from('activity_participants')
          .insert({
            activity_id: payload.activityId,
            member_id: payload.memberId,
            registration_status: 'registered',
            registered_at: now,
            attendance_status: 'unmarked',
            source: 'google_form',
            notes: 'Khớp thủ công từ Google Form response',
          } as never)
          .select('id')
          .single();

        if (newPart) participantId = (newPart as { id: string }).id;
      }

      // Update response record in Supabase
      const { data: updatedResp, error } = await supabase
        .from('activity_form_responses')
        .update({
          match_status: 'matched',
          matched_member_id: payload.memberId,
          activity_participant_id: participantId,
          updated_at: now,
        } as never)
        .eq('id', payload.responseId)
        .eq('organization_id', payload.organizationId)
        .select(`
          *,
          matched_member:members(id, full_name, student_id, email, phone, class_name)
        `)
        .single();

      if (error) throw new Error(error.message);

      // Audit Log
      await auditLogService.logAction({
        organization_id: payload.organizationId,
        action: 'google_form.manual_match',
        entity_type: 'activity_form_response',
        entity_id: payload.responseId,
        metadata: {
          activityId: payload.activityId,
          memberId: payload.memberId,
          memberFullName: member.fullName,
          studentId: member.studentId,
        },
      });

      return mapRowToFormResponse(updatedResp as unknown as RawFormResponseRow);
    }

    // Local storage fallback
    const formResponsesKey = Object.keys(localStorage).find((k) =>
      k.startsWith(LOCAL_STORAGE_RESPONSES_PREFIX)
    );
    if (formResponsesKey) {
      const list: ActivityFormResponse[] = JSON.parse(
        localStorage.getItem(formResponsesKey) || '[]'
      );
      const respIdx = list.findIndex((r) => r.id === payload.responseId);
      if (respIdx !== -1) {
        list[respIdx] = {
          ...list[respIdx],
          matchStatus: 'matched',
          matchedMemberId: payload.memberId,
          matchedMember: {
            id: member.id,
            fullName: member.fullName,
            studentId: member.studentId,
            email: member.email,
            phone: member.phone,
            className: member.className,
          },
          updatedAt: now,
        };
        localStorage.setItem(formResponsesKey, JSON.stringify(list));
        return list[respIdx];
      }
    }

    throw new Error('Không tìm thấy bản ghi phản hồi');
  },
};
