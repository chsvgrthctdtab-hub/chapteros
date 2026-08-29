import { auditLogRepository, type AuditLogItem } from '@/repositories/audit-log.repository';
import type { Database } from '@/types/database.types';
import type {
  AuditLogFilterParams,
  AuditLogListResult,
} from '@/features/audit-logs/types/audit-log.types';

type DbAuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

export const auditLogService = {
  /**
   * List paginated audit logs for authorized roles (admin, leader, deputy)
   */
  async listLogs(
    organizationId: string,
    params: AuditLogFilterParams = {},
    userRole?: string | null
  ): Promise<AuditLogListResult> {
    if (!organizationId) {
      return { data: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0 };
    }

    // Role check at service layer (RBAC enforcement)
    if (userRole && !['admin', 'leader', 'deputy'].includes(userRole)) {
      throw new Error('Bạn không có quyền truy cập nhật ký hoạt động của Chi hội.');
    }

    return auditLogRepository.list(organizationId, params);
  },

  async getAuditLogs(organizationId: string, limit = 50): Promise<AuditLogItem[]> {
    return auditLogRepository.getByOrganization(organizationId, limit);
  },

  async logAction(payload: DbAuditLogInsert): Promise<void> {
    return auditLogRepository.log(payload);
  },
};
