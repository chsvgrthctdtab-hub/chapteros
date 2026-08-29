import { authRepository, type UserMembershipRecord } from '@/repositories/auth.repository';
import { auditLogRepository } from '@/repositories/audit-log.repository';
import { translateAuthError } from '@/lib/auth-errors';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

export const authService = {
  async getInitialSession(): Promise<{ session: Session | null; user: User | null }> {
    return authRepository.getSession();
  },

  subscribeToAuthChanges(callback: (event: string, session: Session | null) => void) {
    return authRepository.onAuthStateChange(callback);
  },

  async signInWithEmail(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: string | null }> {
    if (!email || !email.trim()) {
      return { user: null, session: null, error: 'Vui lòng nhập địa chỉ email.' };
    }
    if (!password) {
      return { user: null, session: null, error: 'Vui lòng nhập mật khẩu.' };
    }

    try {
      const data = await authRepository.signInWithPassword(email, password);
      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      return { user: null, session: null, error: translateAuthError(err) };
    }
  },

  async signUpWithEmail(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ user: User | null; session: Session | null; requiresEmailVerification: boolean; error: string | null }> {
    if (!fullName || !fullName.trim()) {
      return { user: null, session: null, requiresEmailVerification: false, error: 'Vui lòng nhập họ và tên.' };
    }
    if (!email || !email.trim()) {
      return { user: null, session: null, requiresEmailVerification: false, error: 'Vui lòng nhập địa chỉ email.' };
    }
    if (!password || password.length < 6) {
      return { user: null, session: null, requiresEmailVerification: false, error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' };
    }

    try {
      const data = await authRepository.signUp(email, password, fullName);
      const requiresVerification = Boolean(data.user && !data.session);
      return {
        user: data.user,
        session: data.session,
        requiresEmailVerification: requiresVerification,
        error: null,
      };
    } catch (err) {
      return { user: null, session: null, requiresEmailVerification: false, error: translateAuthError(err) };
    }
  },

  async signInWithGoogle(): Promise<{ error: string | null }> {
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      await authRepository.signInWithOAuth('google', redirectTo);
      return { error: null };
    } catch (err) {
      return { error: translateAuthError(err) };
    }
  },

  async exchangeCodeForSession(code: string): Promise<{ session: Session | null; user: User | null; error: string | null }> {
    try {
      const result = await authRepository.exchangeCodeForSession(code);
      return { session: result.session, user: result.user, error: null };
    } catch (err) {
      return { session: null, user: null, error: translateAuthError(err) };
    }
  },

  async signOut(userId?: string, activeOrgId?: string): Promise<void> {
    if (userId && activeOrgId) {
      try {
        await auditLogRepository.log({
          organization_id: activeOrgId,
          user_id: userId,
          action: 'auth.sign_out',
          entity_type: 'user',
          entity_id: userId,
          metadata: { timestamp: new Date().toISOString() },
        });
      } catch (e) {
        console.warn('Could not record sign out audit log:', e);
      }
    }
    await authRepository.signOut();
  },

  async getProfile(user: User): Promise<Profile> {
    const existing = await authRepository.getProfile(user.id);
    if (existing) return existing;

    // Fallback: Safe profile creation if trigger is delayed
    const defaultName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Thành viên mới';
    return authRepository.upsertProfile({
      id: user.id,
      fullName: defaultName,
      email: user.email || '',
      avatarUrl: user.user_metadata?.avatar_url || null,
    });
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
    return authRepository.updateProfile(userId, profileData);
  },

  async getUserMemberships(userId: string): Promise<UserMembershipRecord[]> {
    return authRepository.getUserMemberships(userId);
  },
};
