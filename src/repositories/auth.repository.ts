import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Session, User, AuthResponse } from '@supabase/supabase-js';
import type { Profile, OrganizationRole, MembershipStatus, Organization, OrganizationType } from '@/types';
import type { Database } from '@/types/database.types';

export type DbProfile = Database['public']['Tables']['profiles']['Row'];
export type DbMembership = Database['public']['Tables']['organization_memberships']['Row'];

export interface DbUserMembershipWithOrg {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  organization: {
    id: string;
    name: string;
    code: string;
    type?: OrganizationType;
    parent_id?: string | null;
    description: string | null;
    logo_url: string | null;
    created_at: string;
    updated_at: string;
  } | {
    id: string;
    name: string;
    code: string;
    type?: OrganizationType;
    parent_id?: string | null;
    description: string | null;
    logo_url: string | null;
    created_at: string;
    updated_at: string;
  }[] | null;
}

export interface UserMembershipRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  organization: Organization;
}

export const authRepository = {
  async getSession(): Promise<{ session: Session | null; user: User | null }> {
    if (!isSupabaseConfigured) {
      return { session: null, user: null };
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session: data.session, user: data.session?.user ?? null };
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured) {
      return { unsubscribe: () => {} };
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },

  async signInWithPassword(email: string, password: string): Promise<AuthResponse['data']> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra biến môi trường.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  },

  async signUp(email: string, password: string, fullName: string): Promise<AuthResponse['data']> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra biến môi trường.');
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });
    if (error) throw error;
    return data;
  },

  async signInWithOAuth(provider: 'google', redirectTo: string): Promise<void> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra biến môi trường.');
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) throw error;
  },

  async exchangeCodeForSession(code: string): Promise<{ session: Session | null; user: User | null }> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình.');
    }
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return { session: data.session, user: data.session?.user ?? null };
  },

  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const row = data as DbProfile;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      avatarUrl: row.avatar_url,
      phone: row.phone,
      studentId: row.student_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async upsertProfile(profileData: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  }): Promise<Profile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình.');
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profileData.id,
        full_name: profileData.fullName,
        email: profileData.email,
        avatar_url: profileData.avatarUrl ?? null,
      } as never)
      .select()
      .single();

    if (error) throw error;
    const row = data as DbProfile;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      avatarUrl: row.avatar_url,
      phone: row.phone,
      studentId: row.student_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updateProfile(
    userId: string,
    profileData: {
      fullName?: string;
      studentId?: string | null;
      phone?: string | null;
      avatarUrl?: string | null;
    }
  ): Promise<Profile> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase chưa được cấu hình.');
    }

    const payload: Record<string, unknown> = {};
    if (profileData.fullName !== undefined) payload.full_name = profileData.fullName.trim();
    if (profileData.studentId !== undefined) {
      payload.student_id = profileData.studentId ? profileData.studentId.trim().toUpperCase() : null;
    }
    if (profileData.phone !== undefined) {
      payload.phone = profileData.phone ? profileData.phone.trim() : null;
    }
    if (profileData.avatarUrl !== undefined) {
      payload.avatar_url = profileData.avatarUrl ?? null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload as never)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      // Check for custom exception or unique constraint violation on student_id
      if (
        error.code === '23505' ||
        error.message?.includes('uq_org_student_id') ||
        error.message?.includes('Mã số sinh viên')
      ) {
        throw new Error(
          `Mã số sinh viên "${profileData.studentId}" đã được sử dụng bởi một hội viên khác trong Đơn vị. Vui lòng kiểm tra lại MSSV.`
        );
      }
      throw error;
    }

    const row = data as DbProfile;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      avatarUrl: row.avatar_url,
      phone: row.phone,
      studentId: row.student_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async getUserMemberships(userId: string): Promise<UserMembershipRecord[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('organization_memberships')
      .select(`
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
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    if (!data) return [];

    const rawList = data as unknown as DbUserMembershipWithOrg[];
    return rawList
      .filter((item) => item.organization !== null)
      .map((item) => {
        const org = Array.isArray(item.organization) ? item.organization[0] : item.organization!;
        return {
          id: item.id,
          organizationId: item.organization_id,
          userId: item.user_id,
          role: item.role as OrganizationRole,
          status: item.status as MembershipStatus,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          organization: {
            id: org.id,
            name: org.name,
            code: org.code,
            type: org.type || 'chi_hoi',
            parentId: org.parent_id || null,
            description: org.description,
            logoUrl: org.logo_url,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
          },
        };
      });
  },
};
