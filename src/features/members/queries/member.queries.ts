import { useQuery } from '@tanstack/react-query';
import { memberService } from '@/services/member.service';
import type { 
  MemberListItem, 
  MemberTermHistoryItem, 
  MemberFilterParams 
} from '../types/member.types';
import type { Member, Term } from '@/types';

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  list: (orgId: string, params: MemberFilterParams) => [...memberKeys.lists(), orgId, params] as const,
  stats: (orgId: string, activeTermId?: string) => [...memberKeys.all, 'stats', orgId, activeTermId || 'none'] as const,
  details: () => [...memberKeys.all, 'detail'] as const,
  detail: (id: string) => [...memberKeys.details(), id] as const,
  histories: () => [...memberKeys.all, 'history'] as const,
  history: (memberId: string) => [...memberKeys.histories(), memberId] as const,
  terms: (orgId: string) => ['terms', 'org', orgId] as const,
};

export interface MemberKPIStatsResponse {
  total: number;
  active: number;
  alumni: number;
  assignedToTerm: number;
  boardCount: number;
}

export interface MembersListResponse {
  data: MemberListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Fetch member list with server-side filtering, searching, and pagination via memberService
 */
export function useMembersList(organizationId?: string, params: MemberFilterParams = {}) {
  return useQuery<MembersListResponse>({
    queryKey: memberKeys.list(organizationId || '', params),
    queryFn: async () => {
      if (!organizationId) {
        return { data: [], totalCount: 0, page: 1, pageSize: params.pageSize || 15, totalPages: 0 };
      }
      return memberService.listMembers(organizationId, params);
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 30, // 30s cache
  });
}

/**
 * Fetch total organizational KPI stats for member strip (active, alumni, assigned to term, board count)
 */
export function useMemberKPIStats(organizationId?: string, activeTermId?: string) {
  return useQuery<MemberKPIStatsResponse>({
    queryKey: memberKeys.stats(organizationId || '', activeTermId),
    queryFn: async () => {
      if (!organizationId) {
        return { total: 0, active: 0, alumni: 0, assignedToTerm: 0, boardCount: 0 };
      }
      return memberService.getMemberStats(organizationId, activeTermId);
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 30, // 30s cache
  });
}

/**
 * Fetch detailed info for a single member via memberService
 */
export function useMemberDetail(memberId?: string, organizationId?: string) {
  return useQuery<Member | null>({
    queryKey: memberKeys.detail(memberId || ''),
    queryFn: async () => {
      if (!memberId) return null;
      return memberService.getMemberById(memberId, organizationId);
    },
    enabled: Boolean(memberId),
  });
}

/**
 * Fetch full institutional term history for a member via memberService
 */
export function useMemberTermHistory(memberId?: string) {
  return useQuery<MemberTermHistoryItem[]>({
    queryKey: memberKeys.history(memberId || ''),
    queryFn: async () => {
      if (!memberId) return [];
      return memberService.getMemberTermHistory(memberId);
    },
    enabled: Boolean(memberId),
  });
}

/**
 * Fetch all available terms in the organization for dropdowns via memberService
 */
export function useOrgTerms(organizationId?: string) {
  return useQuery<Term[]>({
    queryKey: memberKeys.terms(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return [];
      return memberService.getOrgTerms(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}
