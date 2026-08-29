export interface AuditLogActor {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  studentId?: string | null;
}

export interface AuditLogItemWithActor {
  id: string;
  organizationId: string;
  userId: string | null;
  actor: AuditLogActor | null;
  action: string;
  actionLabel: string;
  module: string;
  moduleLabel: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilterParams {
  module?: string;
  action?: string;
  userId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogListResult {
  data: AuditLogItemWithActor[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
