import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { termService } from '@/services/term.service';
import type { Term, TermMember, Member } from '@/types';
import type { Database } from '@/types/database.types';
import type {
  TermClosingChecklistResult,
  CloseTermParams,
  TermClosingSnapshot,
} from '@/features/terms/types/term.types';

type DbTermInsert = Database['public']['Tables']['terms']['Insert'];
type DbTermUpdate = Database['public']['Tables']['terms']['Update'];
type DbTermMemberInsert = Database['public']['Tables']['term_members']['Insert'];
type DbTermMemberUpdate = Database['public']['Tables']['term_members']['Update'];

export const termMemberKeys = {
  all: ['term_members'] as const,
  byTerm: (termId: string) => [...termMemberKeys.all, 'by_term', termId] as const,
  availableMembers: (termId: string) => [...termMemberKeys.all, 'available', termId] as const,
};

export const termKeys = {
  all: ['terms'] as const,
  lists: () => [...termKeys.all, 'list'] as const,
  list: (orgId: string) => [...termKeys.lists(), orgId] as const,
  current: (orgId: string) => [...termKeys.all, 'current', orgId] as const,
  details: () => [...termKeys.all, 'detail'] as const,
  detail: (termId: string) => [...termKeys.details(), termId] as const,
  checklist: (termId: string) => [...termKeys.detail(termId), 'checklist'] as const,
  members: (termId: string) => termMemberKeys.byTerm(termId),
};

/**
 * Fetch all terms for an organization
 */
export function useTermsList(organizationId?: string) {
  return useQuery<Term[]>({
    queryKey: termKeys.list(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return [];
      return termService.getTermsByOrganization(organizationId);
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 30, // 30s cache
  });
}

/**
 * Fetch current active term for an organization
 */
export function useCurrentTerm(organizationId?: string) {
  return useQuery<Term | null>({
    queryKey: termKeys.current(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return null;
      return termService.getCurrentTerm(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

/**
 * Fetch detailed term by ID
 */
export function useTermDetail(termId?: string) {
  return useQuery<Term | null>({
    queryKey: termKeys.detail(termId || ''),
    queryFn: async () => {
      if (!termId) return null;
      return termService.getTermById(termId);
    },
    enabled: Boolean(termId),
  });
}

/**
 * Fetch all members assigned to a term
 */
export function useTermMembers(termId?: string) {
  return useQuery<TermMember[]>({
    queryKey: termMemberKeys.byTerm(termId || ''),
    queryFn: async () => {
      if (!termId) return [];
      return termService.getTermMembers(termId);
    },
    enabled: Boolean(termId),
  });
}

/**
 * Fetch available organization members who can be assigned to this term
 */
export function useAvailableMembersForTerm(termId?: string, organizationId?: string) {
  return useQuery<Member[]>({
    queryKey: termMemberKeys.availableMembers(termId || ''),
    queryFn: async () => {
      if (!termId || !organizationId) return [];
      return termService.getAvailableMembersForTerm(termId, organizationId);
    },
    enabled: Boolean(termId && organizationId),
  });
}

/**
 * Mutation to create a new term
 */
export function useCreateTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
      actorUserId,
    }: {
      payload: DbTermInsert;
      actorUserId?: string;
    }) => {
      return termService.createTerm(payload, actorUserId);
    },
    onSuccess: (newTerm) => {
      queryClient.invalidateQueries({ queryKey: termKeys.list(newTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.all });
    },
  });
}

/**
 * Mutation to update an existing term
 */
export function useUpdateTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      actorUserId,
    }: {
      id: string;
      payload: DbTermUpdate;
      actorUserId?: string;
    }) => {
      return termService.updateTerm(id, payload, actorUserId);
    },
    onSuccess: (updatedTerm) => {
      queryClient.invalidateQueries({ queryKey: termKeys.list(updatedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(updatedTerm.id) });
      queryClient.invalidateQueries({ queryKey: termKeys.current(updatedTerm.organizationId) });
    },
  });
}

/**
 * Mutation to activate a term
 */
export function useActivateTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      termId,
      organizationId,
      actorUserId,
    }: {
      termId: string;
      organizationId: string;
      actorUserId?: string;
    }) => {
      return termService.activateTerm(termId, organizationId, actorUserId);
    },
    onSuccess: (activatedTerm) => {
      queryClient.invalidateQueries({ queryKey: termKeys.list(activatedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.current(activatedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(activatedTerm.id) });
      queryClient.invalidateQueries({ queryKey: termKeys.all });
    },
  });
}

/**
 * Fetch closing checklist evaluation for a term
 */
export function useTermClosingChecklist(termId?: string, organizationId?: string) {
  return useQuery<TermClosingChecklistResult>({
    queryKey: termKeys.checklist(termId || ''),
    queryFn: async () => {
      if (!termId || !organizationId) {
        throw new Error('Thiếu thông tin nhiệm kỳ hoặc chi hội');
      }
      return termService.getTermClosingChecklist(termId, organizationId);
    },
    enabled: Boolean(termId && organizationId),
    staleTime: 1000 * 10, // 10s fresh cache for checklist evaluation
  });
}

/**
 * Mutation to complete / close a term with checklist, snapshot, and override support
 */
export function useCloseTermWithSnapshotMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      params,
      actorUserName,
    }: {
      params: CloseTermParams;
      actorUserName?: string;
    }) => {
      return termService.closeTerm(params, actorUserName);
    },
    onSuccess: (result) => {
      const closedTerm = result.term;
      queryClient.invalidateQueries({ queryKey: termKeys.list(closedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.current(closedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(closedTerm.id) });
      queryClient.invalidateQueries({ queryKey: termKeys.checklist(closedTerm.id) });
      queryClient.invalidateQueries({ queryKey: termKeys.all });
    },
  });
}

/**
 * Mutation to archive a term
 */
export function useArchiveTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      termId,
      organizationId,
      actorUserId,
    }: {
      termId: string;
      organizationId: string;
      actorUserId?: string;
    }) => {
      return termService.archiveTerm(termId, organizationId, actorUserId);
    },
    onSuccess: (archivedTerm) => {
      queryClient.invalidateQueries({ queryKey: termKeys.list(archivedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.current(archivedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(archivedTerm.id) });
      queryClient.invalidateQueries({ queryKey: termKeys.all });
    },
  });
}

/**
 * Mutation to complete / close a term (standard)
 */
export function useCompleteTermMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      termId,
      organizationId,
      actorUserId,
    }: {
      termId: string;
      organizationId: string;
      actorUserId?: string;
    }) => {
      return termService.completeTerm(termId, organizationId, actorUserId);
    },
    onSuccess: (completedTerm) => {
      queryClient.invalidateQueries({ queryKey: termKeys.list(completedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.current(completedTerm.organizationId) });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(completedTerm.id) });
      queryClient.invalidateQueries({ queryKey: termKeys.all });
    },
  });
}

/**
 * Mutation to add a member to a term
 */
export function useAddTermMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payload,
      actorUserId,
      organizationId,
    }: {
      payload: DbTermMemberInsert;
      actorUserId?: string;
      organizationId?: string;
    }) => {
      return termService.addMemberToTerm(payload, actorUserId, organizationId);
    },
    onSuccess: (newTermMember) => {
      queryClient.invalidateQueries({ queryKey: termMemberKeys.byTerm(newTermMember.termId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.availableMembers(newTermMember.termId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.all });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(newTermMember.termId) });
      queryClient.invalidateQueries({ queryKey: termKeys.lists() });
    },
  });
}

/**
 * Mutation to update a term member assignment
 */
export function useUpdateTermMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      actorUserId,
      organizationId,
    }: {
      id: string;
      payload: DbTermMemberUpdate;
      actorUserId?: string;
      organizationId?: string;
    }) => {
      return termService.updateTermMember(id, payload, actorUserId, organizationId);
    },
    onSuccess: (updatedTermMember) => {
      queryClient.invalidateQueries({ queryKey: termMemberKeys.byTerm(updatedTermMember.termId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.availableMembers(updatedTermMember.termId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.all });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(updatedTermMember.termId) });
    },
  });
}

/**
 * Mutation to remove a member from a term
 */
export function useRemoveTermMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      termId,
      actorUserId,
      organizationId,
    }: {
      id: string;
      termId: string;
      actorUserId?: string;
      organizationId?: string;
    }) => {
      return termService.removeMemberFromTerm(id, actorUserId, organizationId, termId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: termMemberKeys.byTerm(variables.termId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.availableMembers(variables.termId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.all });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(variables.termId) });
      queryClient.invalidateQueries({ queryKey: termKeys.lists() });
    },
  });
}

/**
 * Mutation to transfer members between terms
 */
export function useTransferTermMembersMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceTermId,
      targetTermId,
      memberIds,
      actorUserId,
      organizationId,
    }: {
      sourceTermId: string;
      targetTermId: string;
      memberIds: string[];
      actorUserId?: string;
      organizationId?: string;
    }) => {
      return termService.transferMembers(
        { sourceTermId, targetTermId, memberIds },
        actorUserId,
        organizationId
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: termMemberKeys.all });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.byTerm(variables.sourceTermId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.byTerm(variables.targetTermId) });
      queryClient.invalidateQueries({ queryKey: termMemberKeys.availableMembers(variables.targetTermId) });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(variables.sourceTermId) });
      queryClient.invalidateQueries({ queryKey: termKeys.detail(variables.targetTermId) });
      queryClient.invalidateQueries({ queryKey: termKeys.lists() });
    },
  });
}

