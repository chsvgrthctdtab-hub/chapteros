import { useQuery } from '@tanstack/react-query';
import { activityService } from '@/services/activity.service';
import { memberRepository } from '@/repositories/member.repository';
import type {
  ActivityDetail,
  ActivityFilterParams,
  ParticipantFilterParams,
} from '../types/activity.types';
import type { ActivitiesListResponse, ActivityParticipantsResponse } from '@/repositories/activity.repository';
import type { Term, Member } from '@/types';

export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (orgId: string, params: ActivityFilterParams) =>
    [...activityKeys.lists(), orgId, params] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string, orgId?: string) =>
    orgId ? ([...activityKeys.details(), id, orgId] as const) : ([...activityKeys.details(), id] as const),
  participants: (activityId: string, params?: ParticipantFilterParams) =>
    [...activityKeys.details(), activityId, 'participants', params] as const,
  availableMembers: (orgId: string, activityId: string, search?: string) =>
    [...activityKeys.all, 'available-members', orgId, activityId, search] as const,
  terms: (orgId: string) => ['terms', 'org', orgId] as const,
  leadCandidates: (orgId: string) => ['activities', 'lead-candidates', orgId] as const,
};

/**
 * Fetch paginated & filtered list of activities for an organization
 */
export function useActivitiesList(organizationId?: string, params: ActivityFilterParams = {}) {
  return useQuery<ActivitiesListResponse>({
    queryKey: activityKeys.list(organizationId || '', params),
    queryFn: async () => {
      if (!organizationId) {
        return { data: [], totalCount: 0, page: 1, pageSize: params.pageSize || 12, totalPages: 0 };
      }
      return activityService.listActivities(organizationId, params);
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 20, // 20 seconds
  });
}

/**
 * Fetch detailed single activity by ID
 */
export function useActivityDetail(activityId?: string, organizationId?: string) {
  return useQuery<ActivityDetail | null>({
    queryKey: activityKeys.detail(activityId || '', organizationId),
    queryFn: async () => {
      if (!activityId) return null;
      return activityService.getActivityDetail(activityId, organizationId);
    },
    enabled: Boolean(activityId),
  });
}

/**
 * Fetch participants list for an activity with filtering & search
 */
export function useActivityParticipants(
  activityId?: string,
  params: ParticipantFilterParams = {}
) {
  return useQuery<ActivityParticipantsResponse>({
    queryKey: activityKeys.participants(activityId || '', params),
    queryFn: async () => {
      if (!activityId) {
        return {
          data: [],
          totalCount: 0,
          stats: {
            total: 0,
            registered: 0,
            confirmed: 0,
            waitlist: 0,
            cancelled: 0,
            present: 0,
            absent: 0,
            excused: 0,
            unmarked: 0,
            participationRate: 0,
          },
        };
      }
      return activityService.getParticipants(activityId, params);
    },
    enabled: Boolean(activityId),
  });
}

/**
 * Fetch available chapter members who are NOT yet participants of this activity
 */
export function useAvailableMembersForActivity(
  organizationId?: string,
  activityId?: string,
  search?: string
) {
  return useQuery<Member[]>({
    queryKey: activityKeys.availableMembers(organizationId || '', activityId || '', search),
    queryFn: async () => {
      if (!organizationId || !activityId) return [];
      return activityService.getAvailableMembers(organizationId, activityId, search);
    },
    enabled: Boolean(organizationId && activityId),
  });
}

/**
 * Fetch available terms in the organization for dropdowns
 */
export function useActivityTerms(organizationId?: string) {
  return useQuery<Term[]>({
    queryKey: activityKeys.terms(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return [];
      return activityService.getOrgTerms(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

/**
 * Fetch candidate members for the activity lead person (BCH + Members roster)
 */
export function useActivityLeadCandidates(organizationId?: string) {
  return useQuery<Member[]>({
    queryKey: activityKeys.leadCandidates(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return [];
      return activityService.getLeadCandidates(organizationId);
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
