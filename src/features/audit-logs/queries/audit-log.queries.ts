import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '@/services/audit-log.service';
import type { AuditLogFilterParams } from '../types/audit-log.types';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (orgId?: string, params?: AuditLogFilterParams) =>
    ['audit-logs', 'list', orgId, params] as const,
};

export function useAuditLogs(
  organizationId?: string,
  params: AuditLogFilterParams = {},
  userRole?: string | null,
  options?: { enabled?: boolean }
) {
  const isAuthorized = !userRole || ['admin', 'leader', 'deputy'].includes(userRole);

  return useQuery({
    queryKey: auditLogKeys.list(organizationId, params),
    queryFn: () => auditLogService.listLogs(organizationId!, params, userRole),
    enabled: Boolean(organizationId && isAuthorized && (options?.enabled ?? true)),
    staleTime: 30 * 1000,
  });
}
