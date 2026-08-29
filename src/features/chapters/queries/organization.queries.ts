import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/organization.service';
import type { Organization, OrganizationMembership, OrganizationRole, MembershipStatus } from '@/types';
import type { Database } from '@/types/database.types';

type DbOrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  search: (query: string) => [...organizationKeys.all, 'search', query] as const,
  userOrgs: (userId: string) => [...organizationKeys.all, 'user', userId] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (orgId: string) => [...organizationKeys.details(), orgId] as const,
  memberships: (orgId: string) => [...organizationKeys.all, 'memberships', orgId] as const,
};

/**
 * Hook to search organizations across system
 */
export function useSearchOrganizations(query: string, enabled = true) {
  return useQuery<Organization[]>({
    queryKey: organizationKeys.search(query),
    queryFn: async () => {
      return organizationService.searchOrganizations(query);
    },
    enabled,
    staleTime: 1000 * 30, // 30s
  });
}

/**
 * Fetch detailed organization by ID
 */
export function useOrganizationDetail(organizationId?: string) {
  return useQuery<Organization | null>({
    queryKey: organizationKeys.detail(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return null;
      return organizationService.getOrganizationById(organizationId);
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 60, // 1 min
  });
}

/**
 * Fetch all memberships belonging to an organization
 */
export function useOrganizationMemberships(organizationId?: string) {
  return useQuery<OrganizationMembership[]>({
    queryKey: organizationKeys.memberships(organizationId || ''),
    queryFn: async () => {
      if (!organizationId) return [];
      return organizationService.getMemberships(organizationId);
    },
    enabled: Boolean(organizationId),
    staleTime: 1000 * 30, // 30s
  });
}

/**
 * Fetch all organizations the user belongs to
 */
export function useUserOrganizations(userId?: string) {
  return useQuery<{ organization: Organization; membership: OrganizationMembership }[]>({
    queryKey: organizationKeys.userOrgs(userId || ''),
    queryFn: async () => {
      if (!userId) return [];
      return organizationService.getUserOrganizations(userId);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60,
  });
}

/**
 * Mutation to update organization details (Name, Code, Description, Logo)
 */
export function useUpdateOrganizationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      updaterUserId,
    }: {
      id: string;
      payload: DbOrganizationUpdate;
      updaterUserId?: string;
    }) => {
      return organizationService.updateOrganization(id, payload, updaterUserId);
    },
    onSuccess: (updatedOrg) => {
      // Invalidate specific organization details and lists
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(updatedOrg.id) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/**
 * Mutation to update an organization membership (Role / Status)
 */
export function useUpdateMembershipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      organizationId,
      payload,
      updaterUserId,
    }: {
      membershipId: string;
      organizationId: string;
      payload: { role?: OrganizationRole; status?: MembershipStatus };
      updaterUserId?: string;
    }) => {
      return organizationService.updateMembership(membershipId, organizationId, payload, updaterUserId);
    },
    onSuccess: (_, variables) => {
      // Invalidate memberships for this organization
      queryClient.invalidateQueries({
        queryKey: organizationKeys.memberships(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.lists(),
      });
    },
  });
}

/**
 * Mutation to remove a user membership from an organization
 */
export function useRemoveMembershipMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      membershipId,
      organizationId,
      removerUserId,
    }: {
      membershipId: string;
      organizationId: string;
      removerUserId?: string;
    }) => {
      return organizationService.removeMembership(membershipId, organizationId, removerUserId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.memberships(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.lists(),
      });
    },
  });
}

/**
 * Mutation to upload and update organization logo in Supabase Storage & database
 */
export function useUploadOrganizationLogoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      file,
      uploaderUserId,
      currentLogoUrl,
    }: {
      organizationId: string;
      file: File;
      uploaderUserId?: string;
      currentLogoUrl?: string | null;
    }) => {
      return organizationService.uploadLogo(organizationId, file, uploaderUserId, currentLogoUrl);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific organization details, lists, and user organizations
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.details() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

/**
 * Mutation to delete organization logo from Supabase Storage & database
 */
export function useDeleteOrganizationLogoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      currentLogoUrl,
      removerUserId,
    }: {
      organizationId: string;
      currentLogoUrl?: string | null;
      removerUserId?: string;
    }) => {
      return organizationService.deleteLogo(organizationId, currentLogoUrl, removerUserId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.organizationId) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.details() });
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}

