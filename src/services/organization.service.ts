import { organizationRepository } from '@/repositories/organization.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { isOrgAdmin, isOrgBoard, canManageOrganization } from '@/types/roles';
import type { Organization, OrganizationMembership, OrganizationRole, MembershipStatus } from '@/types';
import type { Database } from '@/types/database.types';

type DbOrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type DbOrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

export const organizationService = {
  async getOrganizations(): Promise<Organization[]> {
    return organizationRepository.getAll();
  },

  async getOrganizationById(id: string): Promise<Organization | null> {
    if (!id?.trim()) return null;
    return organizationRepository.getById(id.trim());
  },

  async getOrganizationByCode(code: string): Promise<Organization | null> {
    if (!code?.trim()) return null;
    return organizationRepository.getByCode(code.trim().toUpperCase());
  },

  async searchOrganizations(query: string, limit = 20): Promise<Organization[]> {
    return organizationRepository.search(query, limit);
  },

  async createOrganization(payload: DbOrganizationInsert, creatorUserId?: string): Promise<Organization> {
    if (!payload.name?.trim()) {
      throw new Error('Tên Chi hội không được để trống.');
    }
    if (!payload.code?.trim()) {
      throw new Error('Mã Chi hội không được để trống.');
    }

    const cleanPayload: DbOrganizationInsert = {
      ...payload,
      name: payload.name.trim(),
      code: payload.code.trim().toUpperCase(),
      description: payload.description?.trim() || null,
      logo_url: payload.logo_url?.trim() || null,
    };

    const org = await organizationRepository.create(cleanPayload, creatorUserId);

    if (creatorUserId) {
      try {
        await auditLogRepository.log({
          organization_id: org.id,
          user_id: creatorUserId,
          action: 'organization.create',
          entity_type: 'organization',
          entity_id: org.id,
          metadata: { name: org.name, code: org.code },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during organization create:', logErr);
      }
    }

    return org;
  },

  async updateOrganization(id: string, payload: DbOrganizationUpdate, updaterUserId?: string): Promise<Organization> {
    if (!id?.trim()) {
      throw new Error('ID Chi hội không hợp lệ.');
    }

    if (payload.name !== undefined && !payload.name?.trim()) {
      throw new Error('Tên Chi hội không được để trống.');
    }
    if (payload.code !== undefined && !payload.code?.trim()) {
      throw new Error('Mã Chi hội không được để trống.');
    }

    const cleanPayload: DbOrganizationUpdate = {};
    if (payload.name !== undefined) cleanPayload.name = payload.name.trim();
    if (payload.code !== undefined) cleanPayload.code = payload.code.trim().toUpperCase();
    if (payload.description !== undefined) cleanPayload.description = payload.description?.trim() || null;
    if (payload.logo_url !== undefined) cleanPayload.logo_url = payload.logo_url?.trim() || null;
    if (payload.type !== undefined) cleanPayload.type = payload.type;
    if (payload.parent_id !== undefined) cleanPayload.parent_id = payload.parent_id;
    if (payload.finance_approval_threshold !== undefined) {
      cleanPayload.finance_approval_threshold = payload.finance_approval_threshold;
    }

    const org = await organizationRepository.update(id, cleanPayload);

    if (updaterUserId) {
      try {
        await auditLogRepository.log({
          organization_id: org.id,
          user_id: updaterUserId,
          action: 'organization.update',
          entity_type: 'organization',
          entity_id: org.id,
          metadata: { updatedFields: Object.keys(cleanPayload) },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during organization update:', logErr);
      }
    }

    return org;
  },

  async getMemberships(organizationId: string): Promise<OrganizationMembership[]> {
    if (!organizationId?.trim()) return [];
    return organizationRepository.getMemberships(organizationId.trim());
  },

  async updateMembership(
    membershipId: string,
    organizationId: string,
    payload: { role?: OrganizationRole; status?: MembershipStatus },
    updaterUserId?: string
  ): Promise<OrganizationMembership> {
    if (!membershipId || !organizationId) {
      throw new Error('Thông tin thành viên hoặc Chi hội không hợp lệ.');
    }

    // Safety check: If demoting or deactivating an admin, verify that at least one other active admin remains
    if (payload.role !== 'admin' || payload.status !== 'active') {
      const allMemberships = await organizationRepository.getMemberships(organizationId);
      const targetMembership = allMemberships.find((m) => m.id === membershipId);

      if (targetMembership?.role === 'admin' && targetMembership?.status === 'active') {
        const activeAdminCount = allMemberships.filter(
          (m) => m.role === 'admin' && m.status === 'active' && m.id !== membershipId
        ).length;

        if (activeAdminCount === 0) {
          throw new Error('Không thể hạ quyền hoặc vô hiệu hóa Quản trị viên duy nhất của Đơn vị.');
        }
      }
    }

    const updated = await organizationRepository.updateMembership(membershipId, organizationId, payload);

    if (updaterUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: updaterUserId,
          action: 'membership.update',
          entity_type: 'organization_membership',
          entity_id: membershipId,
          metadata: {
            updatedFields: payload,
            targetUserId: updated.userId,
          },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during membership update:', logErr);
      }
    }

    return updated;
  },

  async removeMembership(
    membershipId: string,
    organizationId: string,
    removerUserId?: string
  ): Promise<void> {
    if (!membershipId || !organizationId) {
      throw new Error('Thông tin thành viên hoặc Chi hội không hợp lệ.');
    }

    // Safety check: Cannot remove the last active admin
    const allMemberships = await organizationRepository.getMemberships(organizationId);
    const targetMembership = allMemberships.find((m) => m.id === membershipId);

    if (targetMembership?.role === 'admin' && targetMembership?.status === 'active') {
      const activeAdminCount = allMemberships.filter(
        (m) => m.role === 'admin' && m.status === 'active' && m.id !== membershipId
      ).length;

      if (activeAdminCount === 0) {
        throw new Error('Không thể xóa Quản trị viên duy nhất của Đơn vị.');
      }
    }

    await organizationRepository.removeMembership(membershipId, organizationId);

    if (removerUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: removerUserId,
          action: 'membership.remove',
          entity_type: 'organization_membership',
          entity_id: membershipId,
          metadata: {
            removedUserId: targetMembership?.userId,
            role: targetMembership?.role,
          },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during membership remove:', logErr);
      }
    }
  },

  async getUserOrganizations(userId: string): Promise<{ organization: Organization; membership: OrganizationMembership }[]> {
    if (!userId?.trim()) return [];
    return organizationRepository.getUserOrganizations(userId.trim());
  },

  /**
   * Upload an organization logo to Supabase Storage and update the database
   */
  async uploadLogo(
    organizationId: string,
    file: File,
    uploaderUserId?: string,
    currentLogoUrl?: string | null
  ): Promise<{ logoUrl: string }> {
    if (!organizationId?.trim()) {
      throw new Error('ID Chi hội không hợp lệ.');
    }

    // 0. Verify Supabase Auth Session
    let currentUserId = uploaderUserId;
    if (isSupabaseConfigured) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Phiên đăng nhập không hợp lệ.');
      }
      currentUserId = session.user.id;
    }

    // 1. Authorization Check based on direct DB query for exact membership
    let currentMembership: OrganizationMembership | null = null;
    if (currentUserId) {
      currentMembership = await organizationRepository.getMyMembership(organizationId, currentUserId);
    }

    const authorized = Boolean(
      currentMembership &&
      currentMembership.organizationId === organizationId &&
      currentMembership.userId === currentUserId &&
      currentMembership.status === 'active' &&
      (currentMembership.role === 'admin' ||
       currentMembership.role === 'leader' ||
       isOrgAdmin(currentMembership.role) ||
       isOrgBoard(currentMembership.role) ||
       canManageOrganization(organizationId, currentMembership))
    );

    if (!authorized) {
      throw new Error('Bạn không có quyền Quản trị viên để tải lên biểu trưng cho Đơn vị này.');
    }

    // 2. Client & Service Validation
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Kích thước logo vượt quá giới hạn 2 MB.');
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      throw new Error('Định dạng logo không được hỗ trợ. Vui lòng chọn PNG, JPG hoặc WebP.');
    }

    // 3. Storage Upload
    let uploadedFilePath: string | null = null;
    let newLogoUrl: string;

    try {
      const uploadResult = await organizationRepository.uploadLogo(organizationId, file);
      uploadedFilePath = uploadResult.filePath;
      newLogoUrl = uploadResult.logoUrl;
    } catch (err) {
      console.error('Logo storage upload failed:', err);
      throw err;
    }

    // 4. Database Update
    try {
      await organizationRepository.update(organizationId, { logo_url: newLogoUrl });
    } catch (dbErr) {
      console.error('Logo database update failed:', dbErr);
      if (uploadedFilePath) {
        try {
          await organizationRepository.deleteLogoFromStorage(organizationId, uploadedFilePath);
        } catch (rollbackErr) {
          console.warn('Rollback storage delete warning:', rollbackErr);
        }
      }
      throw new Error('Không thể cập nhật biểu trưng trong cơ sở dữ liệu. Vui lòng thử lại.');
    }

    // 5. Clean up old logo only AFTER database update succeeds
    if (currentLogoUrl && currentLogoUrl !== newLogoUrl) {
      try {
        const oldStoragePath = organizationRepository.extractStoragePath(currentLogoUrl, organizationId);
        if (oldStoragePath && oldStoragePath !== uploadedFilePath) {
          await organizationRepository.deleteLogoFromStorage(organizationId, oldStoragePath);
        }
      } catch (cleanupErr) {
        console.warn('Old logo cleanup warning:', cleanupErr);
      }
    }

    // 6. Audit Logging
    if (currentUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: currentUserId,
          action: 'organization.logo_upload',
          entity_type: 'organization',
          entity_id: organizationId,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            logoUrl: newLogoUrl,
          },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during logo upload:', logErr);
      }
    }

    return { logoUrl: newLogoUrl };
  },

  /**
   * Delete an organization logo from database and storage
   */
  async deleteLogo(
    organizationId: string,
    currentLogoUrl?: string | null,
    removerUserId?: string
  ): Promise<void> {
    if (!organizationId?.trim()) {
      throw new Error('ID Chi hội không hợp lệ.');
    }

    let currentUserId = removerUserId;
    if (isSupabaseConfigured) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Phiên đăng nhập không hợp lệ.');
      }
      currentUserId = session.user.id;
    }

    let currentMembership: OrganizationMembership | null = null;
    if (currentUserId) {
      currentMembership = await organizationRepository.getMyMembership(organizationId, currentUserId);
    }

    const authorized = Boolean(
      currentMembership &&
      currentMembership.organizationId === organizationId &&
      currentMembership.userId === currentUserId &&
      currentMembership.status === 'active' &&
      (currentMembership.role === 'admin' ||
       currentMembership.role === 'leader' ||
       isOrgAdmin(currentMembership.role) ||
       isOrgBoard(currentMembership.role) ||
       canManageOrganization(organizationId, currentMembership))
    );

    if (!authorized) {
      throw new Error('Bạn không có quyền Quản trị viên để xóa biểu trưng của Đơn vị này.');
    }

    // 1. Read current logo URL if not provided
    let logoUrlToDelete = currentLogoUrl;
    if (!logoUrlToDelete) {
      const existingOrg = await organizationRepository.getById(organizationId);
      logoUrlToDelete = existingOrg?.logoUrl || null;
    }

    // 2. Update database FIRST to set logo_url = null
    await organizationRepository.update(organizationId, { logo_url: null });

    // 3. Delete old Storage object AFTER database update succeeds (non-fatal if cleanup fails)
    if (logoUrlToDelete) {
      try {
        const storagePath = organizationRepository.extractStoragePath(logoUrlToDelete, organizationId);
        if (storagePath) {
          await organizationRepository.deleteLogoFromStorage(organizationId, storagePath);
        }
      } catch (storageErr) {
        console.warn('Storage cleanup warning after logo delete:', storageErr);
      }
    }

    // 4. Audit Logging
    if (currentUserId) {
      try {
        await auditLogRepository.log({
          organization_id: organizationId,
          user_id: currentUserId,
          action: 'organization.logo_delete',
          entity_type: 'organization',
          entity_id: organizationId,
          metadata: {
            previousLogoUrl: logoUrlToDelete,
          },
        });
      } catch (logErr) {
        console.warn('Audit log ignored during logo delete:', logErr);
      }
    }
  },
};

