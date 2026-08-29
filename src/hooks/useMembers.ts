import { useMembersList, useMemberDetail, useMemberTermHistory, useOrgTerms } from '@/features/members/queries/member.queries';
import {
  useCreateMember,
  useUpdateMember,
  useSetMemberStatus,
  useDeleteMember,
  useAssignTermMember,
  useUpdateTermMember,
  useRemoveTermMember,
} from '@/features/members/mutations/member.mutations';
import type { MemberFilterParams, MemberListItem, MemberTermHistoryItem } from '@/features/members/types/member.types';
import type { Member, Term, MemberStatus } from '@/types';
import type { MemberFormData, TermMemberFormData } from '@/features/members/schemas/member.schema';

/**
 * Hook to retrieve filtered/paginated member roster for an organization
 */
export function useMembers(organizationId?: string, params: MemberFilterParams = {}) {
  const query = useMembersList(organizationId, params);

  return {
    data: query.data?.data || [],
    totalCount: query.data?.totalCount || 0,
    page: query.data?.page || 1,
    pageSize: query.data?.pageSize || 15,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve a single member by ID
 */
export function useMember(memberId?: string, organizationId?: string) {
  const query = useMemberDetail(memberId, organizationId);

  return {
    member: query.data || null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve institutional term assignments for a member
 */
export function useTermMembers(memberId?: string) {
  const historyQuery = useMemberTermHistory(memberId);

  return {
    termHistory: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    refetch: historyQuery.refetch,
  };
}

/**
 * Hook providing all mutation operations for member management
 */
export function useMemberMutations(organizationId?: string) {
  const createMutation = useCreateMember(organizationId);
  const deleteMutation = useDeleteMember(organizationId);

  return {
    // Actions
    createMember: (formData: MemberFormData) => createMutation.mutateAsync(formData),
    deleteMember: (memberId: string) => deleteMutation.mutateAsync(memberId),
    
    // Status states
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    deleteError: deleteMutation.error,
  };
}
