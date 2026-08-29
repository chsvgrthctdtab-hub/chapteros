import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { Organization, OrganizationMembership, Profile, OrganizationRole, OrganizationType, MembershipStatus } from '@/types';

type DbOrganization = Database['public']['Tables']['organizations']['Row'];
type DbOrganizationInsert = Database['public']['Tables']['organizations']['Insert'];
type DbOrganizationUpdate = Database['public']['Tables']['organizations']['Update'];
type DbMembership = Database['public']['Tables']['organization_memberships']['Row'];
type DbMembershipInsert = Database['public']['Tables']['organization_memberships']['Insert'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];

function mapOrganizationFromDb(row: DbOrganization & { parent?: DbOrganization | null }): Organization {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    type: (row.type as OrganizationType) || 'chi_hoi',
    parentId: row.parent_id ?? null,
    parent: row.parent
      ? {
          id: row.parent.id,
          name: row.parent.name,
          code: row.parent.code,
          type: (row.parent.type as OrganizationType) || 'lien_chi_hoi',
        }
      : null,
    description: row.description,
    logoUrl: row.logo_url,
    financeApprovalThreshold: row.finance_approval_threshold,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMembershipFromDb(
  row: DbMembership & { profile?: DbProfile | null }
): OrganizationMembership {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    profile: row.profile
      ? {
          id: row.profile.id,
          fullName: row.profile.full_name,
          email: row.profile.email,
          avatarUrl: row.profile.avatar_url,
          phone: row.profile.phone,
          studentId: row.profile.student_id,
          createdAt: row.profile.created_at,
          updatedAt: row.profile.updated_at,
        }
      : undefined,
  };
}

export const organizationRepository = {
  async getAll(): Promise<Organization[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Failed to load organizations:', error);
      throw error;
    }
    return (data || []).map(mapOrganizationFromDb);
  },

  async getById(id: string): Promise<Organization | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load organization by ID:', error);
      throw error;
    }
    return data ? mapOrganizationFromDb(data) : null;
  },

  async getByCode(code: string): Promise<Organization | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Failed to load organization by code:', error);
      throw error;
    }
    return data ? mapOrganizationFromDb(data) : null;
  },

  async search(query: string, limit = 20): Promise<Organization[]> {
    if (!isSupabaseConfigured) return [];
    const trimmed = query.trim();
    if (!trimmed) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true })
        .limit(limit);
      if (error) {
        console.error('Failed to query organizations:', error);
        throw error;
      }
      return (data || []).map(mapOrganizationFromDb);
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .or(`name.ilike.%${trimmed}%,code.ilike.%${trimmed}%`)
      .order('name', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Failed to search organizations:', error);
      throw error;
    }
    return (data || []).map(mapOrganizationFromDb);
  },

  async ensureMembership(payload: DbMembershipInsert): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    // Idempotency: Check if membership already exists (e.g. created by database trigger)
    const { data: existing } = await supabase
      .from('organization_memberships')
      .select('id')
      .eq('organization_id', payload.organization_id)
      .eq('user_id', payload.user_id)
      .maybeSingle();

    if (existing) {
      return;
    }

    const { error } = await supabase
      .from('organization_memberships')
      .insert(payload as never);

    if (error) {
      throw error;
    }
  },

  async create(payload: DbOrganizationInsert, _creatorUserId?: string): Promise<Organization> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    // 1. Actively verify that the Supabase client holds an active, valid authenticated session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error('Không thể xác minh phiên đăng nhập. Vui lòng đăng nhập lại.');
    }

    if (!session?.user) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi tạo Chi hội.');
    }

    if (_creatorUserId && session.user.id !== _creatorUserId) {
      throw new Error('Phiên đăng nhập không khớp với tài khoản hiện tại.');
    }

    const orgId = payload.id || crypto.randomUUID();

    // 2. Insert organization WITHOUT .select() / RETURNING so RLS SELECT is not checked before DB trigger completes
    const { error: insertOrgError } = await supabase
      .from('organizations')
      .insert({
        id: orgId,
        name: payload.name,
        code: payload.code,
        type: payload.type || 'chi_hoi',
        parent_id: payload.parent_id ?? null,
        description: payload.description ?? null,
        logo_url: payload.logo_url ?? null,
        finance_approval_threshold: payload.finance_approval_threshold ?? 0,
      } as never);

    if (insertOrgError) {
      if (insertOrgError.code === '23505') {
        throw new Error(`Mã đơn vị "${payload.code}" đã được sử dụng. Vui lòng chọn mã khác.`);
      }
      if (insertOrgError.code === '42501') {
        throw new Error('Bạn không có quyền thực hiện thao tác này (RLS 42501).');
      }
      throw insertOrgError;
    }

    // 3. Retrieve created org
    const org = await this.getById(orgId);
    if (!org) {
      return {
        id: orgId,
        name: payload.name,
        code: payload.code,
        type: payload.type || 'chi_hoi',
        parentId: payload.parent_id || null,
        description: payload.description || null,
        logoUrl: payload.logo_url || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return org;
  },

  async update(id: string, payload: DbOrganizationUpdate): Promise<Organization> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');
    const { data, error } = await supabase
      .from('organizations')
      .update(payload as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update organization:', error);
      if (error.code === '23505') {
        throw new Error(`Mã đơn vị đã tồn tại trên hệ thống. Vui lòng chọn mã khác.`);
      }
      if (error.code === '42501') {
        throw new Error('Bạn không có quyền Quản trị viên để cập nhật thông tin đơn vị này.');
      }
      throw error;
    }
    return mapOrganizationFromDb(data as DbOrganization);
  },

  async getMemberships(organizationId: string): Promise<OrganizationMembership[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('organization_memberships')
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        status,
        created_at,
        updated_at,
        profile:profiles (
          id,
          full_name,
          email,
          avatar_url,
          phone,
          student_id,
          created_at,
          updated_at
        )
      `
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load memberships:', error);
      throw error;
    }
    return ((data as unknown as (DbMembership & { profile?: DbProfile | null })[]) || []).map(
      mapMembershipFromDb
    );
  },

  async getMyMembership(organizationId: string, userId: string): Promise<OrganizationMembership | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('organization_memberships')
      .select('id, organization_id, user_id, role, status, created_at, updated_at')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('DB membership query error:', error);
      return null;
    }
    if (!data) {
      return null;
    }

    const row = data as unknown as DbMembership;

    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      role: row.role as OrganizationRole,
      status: row.status as MembershipStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updateMembership(
    membershipId: string,
    organizationId: string,
    payload: { role?: OrganizationRole; status?: MembershipStatus }
  ): Promise<OrganizationMembership> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const updateData: { role?: string; status?: string } = {};
    if (payload.role) updateData.role = payload.role;
    if (payload.status) updateData.status = payload.status;

    const { data, error } = await supabase
      .from('organization_memberships')
      .update(updateData as never)
      .eq('id', membershipId)
      .eq('organization_id', organizationId)
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        status,
        created_at,
        updated_at,
        profile:profiles (
          id,
          full_name,
          email,
          avatar_url,
          phone,
          student_id,
          created_at,
          updated_at
        )
      `
      )
      .single();

    if (error) {
      console.error('Failed to update membership:', error);
      if (error.code === '42501') {
        throw new Error('Bạn không có quyền Quản trị viên để cập nhật phân quyền này.');
      }
      throw error;
    }

    return mapMembershipFromDb(data as unknown as (DbMembership & { profile?: DbProfile | null }));
  },

  async removeMembership(membershipId: string, organizationId: string): Promise<void> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const { error } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('id', membershipId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Failed to remove membership:', error);
      if (error.code === '42501') {
        throw new Error('Bạn không có quyền Quản trị viên để xóa thành viên khỏi Chi hội.');
      }
      throw error;
    }
  },

  async uploadLogo(organizationId: string, file: File): Promise<{ logoUrl: string; filePath: string }> {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

    const mimeToExt: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
    };
    const extension = mimeToExt[file.type.toLowerCase()] || file.name.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    const filePath = `${organizationId}/logo-${timestamp}-${randomSuffix}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      if (
        uploadError.message?.includes('violates row-level security') ||
        (uploadError as unknown as { statusCode?: string }).statusCode === '403'
      ) {
        throw new Error('Bạn không có quyền Quản trị viên để tải lên biểu trưng cho Chi hội này.');
      }
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(filePath);

    return {
      logoUrl: urlData.publicUrl,
      filePath,
    };
  },

  extractStoragePath(filePathOrUrl?: string | null, organizationId?: string): string | null {
    if (!filePathOrUrl || typeof filePathOrUrl !== 'string') return null;
    const trimmed = filePathOrUrl.trim();
    if (!trimmed) return null;

    // 1. If it's a URL or contains bucket name 'organization-logos/'
    const bucketMarker = 'organization-logos/';
    if (trimmed.includes(bucketMarker)) {
      const parts = trimmed.split(bucketMarker);
      if (parts[1]) {
        const cleanPath = decodeURIComponent(parts[1].split('?')[0].split('#')[0]);
        return cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
      }
    }

    // 2. If it's a relative path starting with organizationId
    if (organizationId && trimmed.startsWith(`${organizationId}/`)) {
      return decodeURIComponent(trimmed.split('?')[0].split('#')[0]);
    }

    // 3. If it's just a filename under organizationId
    if (organizationId && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.includes('/')) {
      return `${organizationId}/${decodeURIComponent(trimmed.split('?')[0].split('#')[0])}`;
    }

    // 4. If it's a relative path without HTTP protocol
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return decodeURIComponent(trimmed.split('?')[0].split('#')[0]);
    }

    return null;
  },

  async deleteLogoFromStorage(organizationId: string, filePathOrUrl?: string | null): Promise<void> {
    if (!isSupabaseConfigured) return;

    const targetPath = this.extractStoragePath(filePathOrUrl, organizationId);
    if (!targetPath) {
      // Not a Supabase storage object (e.g. external link or empty)
      return;
    }

    const { error: deleteError } = await supabase.storage
      .from('organization-logos')
      .remove([targetPath]);

    if (deleteError) {
      console.error('Storage file delete error:', deleteError);
      if (
        deleteError.message?.includes('violates row-level security') ||
        (deleteError as unknown as { statusCode?: string }).statusCode === '403'
      ) {
        throw new Error('Bạn không có quyền Quản trị viên để xóa biểu trưng khỏi bộ nhớ lưu trữ.');
      }
      throw deleteError;
    }
  },

  async getUserOrganizations(userId: string): Promise<{ organization: Organization; membership: OrganizationMembership }[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('organization_memberships')
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        status,
        created_at,
        updated_at,
        organization:organizations (
          id,
          name,
          code,
          type,
          parent_id,
          description,
          logo_url,
          created_at,
          updated_at
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Failed to load user organizations:', error);
      throw error;
    }
    return (data || []).map((item: unknown) => {
      const row = item as DbMembership & { organization: DbOrganization };
      return {
        organization: mapOrganizationFromDb(row.organization),
        membership: mapMembershipFromDb(row),
      };
    });
  },
};
