import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberService } from '@/services/member.service';
import { useAuth } from '@/contexts/AuthContext';
import { memberKeys } from '../queries/member.queries';
import type { MemberFormData, TermMemberFormData } from '../schemas/member.schema';
import type { MemberStatus } from '@/types';

function formatDbError(err: unknown, defaultMsg: string): string {
  const errorObj = err as { code?: string; message?: string; details?: string };
  const message = errorObj?.message || '';
  
  if (message.includes('uq_org_student_id') || errorObj.code === '23505' || message.includes('đã tồn tại')) {
    return message || 'Mã số sinh viên (MSSV) này đã tồn tại trong Chi hội. Vui lòng kiểm tra lại.';
  }
  if (message.includes('uq_term_member')) {
    return 'Hội viên này đã được phân công trong nhiệm kỳ đã chọn. Bạn có thể chỉnh sửa phân công thay vì thêm mới.';
  }
  if (message.includes('row-level security') || message.includes('violates row-level security policy')) {
    return 'Bạn không có đủ quyền hạn (Yêu cầu Ban Chấp Hành hoặc Quản trị viên) để thực hiện thao tác này.';
  }
  return message || defaultMsg;
}

/**
 * Mutation: Create a new Member and optionally assign to initial Term via memberService
 */
export function useCreateMember(organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: MemberFormData) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        return await memberService.createMember(
          organizationId,
          {
            student_id: formData.studentId,
            full_name: formData.fullName,
            email: formData.email || null,
            phone: formData.phone || null,
            class_name: formData.className || null,
            major: formData.major || null,
            cohort: formData.cohort || null,
            position: formData.position || 'Hội viên',
            status: formData.status,
            joined_date: formData.joinedDate || new Date().toISOString().split('T')[0],
            notes: formData.notes || null,
          },
          {
            assignToTermId: formData.assignToTermId,
            termPosition: formData.termPosition,
            termDepartment: formData.termDepartment,
            actorUserId: user?.id,
          }
        );
      } catch (err: unknown) {
        throw new Error(formatDbError(err, 'Không thể thêm hồ sơ hội viên'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Mutation: Update Member Information via memberService
 */
export function useUpdateMember(memberId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: Partial<MemberFormData>) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        const payload: Record<string, unknown> = {};
        if (formData.fullName !== undefined) payload.full_name = formData.fullName;
        if (formData.studentId !== undefined) payload.student_id = formData.studentId;
        if (formData.email !== undefined) payload.email = formData.email ? formData.email.trim() : null;
        if (formData.phone !== undefined) payload.phone = formData.phone ? formData.phone.trim() : null;
        if (formData.className !== undefined) payload.class_name = formData.className ? formData.className.trim() : null;
        if (formData.major !== undefined) payload.major = formData.major ? formData.major.trim() : null;
        if (formData.cohort !== undefined) payload.cohort = formData.cohort ? formData.cohort.trim() : null;
        if (formData.position !== undefined) payload.position = formData.position ? formData.position.trim() : null;
        if (formData.status !== undefined) payload.status = formData.status;
        if (formData.joinedDate !== undefined) payload.joined_date = formData.joinedDate || null;
        if (formData.notes !== undefined) payload.notes = formData.notes ? formData.notes.trim() : null;

        return await memberService.updateMember(memberId, organizationId, payload, user?.id);
      } catch (err: unknown) {
        throw new Error(formatDbError(err, 'Không thể cập nhật hồ sơ hội viên'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(memberId) });
    },
  });
}

/**
 * Mutation: Update Member Status (Active/Alumni/Inactive/Transferred) via memberService
 */
export function useSetMemberStatus(memberId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (status: MemberStatus) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }
      try {
        return await memberService.setMemberStatus(memberId, organizationId, status, user?.id);
      } catch (err: unknown) {
        throw new Error(formatDbError(err, 'Không thể cập nhật trạng thái hội viên'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(memberId) });
    },
  });
}

/**
 * Mutation: Delete Member via memberService
 */
export function useDeleteMember(organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        await memberService.deleteMember(memberId, organizationId, user?.id);
        return { success: true };
      } catch (err: unknown) {
        throw new Error(formatDbError(err, 'Không thể xóa hồ sơ hội viên'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Mutation: Assign Member to a Term via memberService
 */
export function useAssignTermMember(memberId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: TermMemberFormData) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        return await memberService.assignMemberToTerm(
          organizationId,
          {
            term_id: formData.termId,
            member_id: memberId,
            position: formData.position.trim() || 'Hội viên',
            department: formData.department?.trim() || null,
            status: formData.status,
            joined_date: formData.joinedDate || new Date().toISOString().split('T')[0],
            notes: formData.notes?.trim() || null,
          },
          user?.id
        );
      } catch (err: unknown) {
        throw new Error(formatDbError(err, 'Không thể gán nhiệm kỳ cho hội viên'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.history(memberId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Mutation: Update Term Membership Assignment via memberService
 */
export function useUpdateTermMember(memberId: string, termMemberId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: Partial<TermMemberFormData>) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        const payload: Record<string, unknown> = {};
        if (formData.position !== undefined) payload.position = formData.position.trim();
        if (formData.department !== undefined) payload.department = formData.department ? formData.department.trim() : null;
        if (formData.status !== undefined) payload.status = formData.status;
        if (formData.joinedDate !== undefined) payload.joined_date = formData.joinedDate || null;
        if (formData.notes !== undefined) payload.notes = formData.notes ? formData.notes.trim() : null;

        return await memberService.updateTermMember(organizationId, termMemberId, payload, user?.id);
      } catch (err: unknown) {
        throw new Error(formatDbError(err, 'Không thể cập nhật phân công nhiệm kỳ'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.history(memberId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Mutation: Remove Member from a Term via memberService
 */
export function useRemoveTermMember(memberId: string, organizationId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (termMemberId: string) => {
      if (!organizationId) {
        throw new Error('Chưa chọn Chi hội làm việc');
      }

      try {
        await memberService.removeTermMember(organizationId, termMemberId, memberId, user?.id);
        return { success: true };
      } catch (err: unknown) {
        throw new Error(formatDbError(err, 'Không thể xóa phân công nhiệm kỳ'));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.history(memberId) });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

/**
 * Mutation: Bulk import members from Excel/CSV (upsert by student_id)
 */
export interface BulkImportMemberPayload {
  student_id: string;
  full_name: string;
  class_name: string;
  cohort: string;
  email?: string | null;
  phone?: string | null;
  major?: string | null;
  joined_date?: string | null;
  notes?: string | null;
  position: string;
  status: 'active';
}

export interface BulkImportResult {
  inserted: number;
  updated: number;
  failed: { studentId: string; reason: string }[];
}

export function useBulkImportMembers(organizationId?: string) {
  const queryClient = useQueryClient();
  const { supabase } = useAuth();

  return useMutation({
    mutationFn: async (rows: BulkImportMemberPayload[]): Promise<BulkImportResult> => {
      if (!organizationId) throw new Error('Chưa chọn Đơn vị làm việc');
      if (!rows.length) throw new Error('Không có dữ liệu để import');

      const result: BulkImportResult = { inserted: 0, updated: 0, failed: [] };

      // Lấy danh sách MSSV đã tồn tại
      const { data: existing } = await supabase
        .from('members')
        .select('id, student_id')
        .eq('organization_id', organizationId);

      const existingMap = new Map((existing || []).map((m: { id: string; student_id: string }) => [m.student_id, m.id]));

      for (const row of rows) {
        try {
          const existingId = existingMap.get(row.student_id);
          if (existingId) {
            // Ghi đè
            const { error } = await supabase
              .from('members')
              .update({
                full_name: row.full_name,
                class_name: row.class_name,
                cohort: row.cohort,
                email: row.email || null,
                phone: row.phone || null,
                major: row.major || null,
                joined_date: row.joined_date || null,
                notes: row.notes || null,
              })
              .eq('id', existingId)
              .eq('organization_id', organizationId);
            if (error) throw error;
            result.updated++;
          } else {
            // Thêm mới
            const { error } = await supabase
              .from('members')
              .insert({
                organization_id: organizationId,
                student_id: row.student_id,
                full_name: row.full_name,
                class_name: row.class_name,
                cohort: row.cohort,
                email: row.email || null,
                phone: row.phone || null,
                major: row.major || null,
                position: row.position,
                status: row.status,
                joined_date: row.joined_date || new Date().toISOString().split('T')[0],
                notes: row.notes || null,
              });
            if (error) throw error;
            result.inserted++;
          }
        } catch (err: unknown) {
          const msg = (err as { message?: string })?.message || 'Lỗi không xác định';
          result.failed.push({ studentId: row.student_id, reason: msg });
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
