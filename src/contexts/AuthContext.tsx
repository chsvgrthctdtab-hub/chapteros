import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import { organizationService } from '@/services/organization.service';
import type { Profile, Organization, OrganizationRole, OrganizationType, MembershipStatus } from '@/types';

export interface UserMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  organization: Organization;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  memberships: UserMembership[];
  activeMembership: UserMembership | null;
  activeOrganization: Organization | null;
  activeRole: OrganizationRole | null;
  isLoading: boolean;
  isSyncingMemberships: boolean;
  isSupabaseConfigured: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: string | null; requiresEmailVerification: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  setActiveOrganizationId: (orgId: string) => void;
  refreshAuth: () => Promise<void>;
  createOrganization: (name: string, code: string, description?: string, type?: string) => Promise<{ data?: Organization; error: string | null }>;
}

const STORAGE_ACTIVE_ORG_KEY = 'chapteros_active_org_id';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_ACTIVE_ORG_KEY);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingMemberships, setIsSyncingMemberships] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightUserIdRef = useRef<string | null>(null);
  const inFlightPromiseRef = useRef<Promise<void> | null>(null);
  const lastLoadedUserIdRef = useRef<string | null>(null);

  /**
   * Fetch or initialize user profile and organization memberships
   */
  const loadUserData = useCallback(async (currentUser: User, force = false): Promise<void> => {
    if (!currentUser) return;

    if (!isSupabaseConfigured) {
      // In offline / preview fallback mode without Supabase credentials
      const demoProfile: Profile = {
        id: currentUser.id,
        fullName: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Ban Chấp Hành',
        email: currentUser.email || 'bch@chihoi.edu.vn',
        avatarUrl: currentUser.user_metadata?.avatar_url || null,
        phone: null,
        studentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(demoProfile);
      return;
    }

    // Prevent duplicate in-flight requests or redundant requests for the same user
    if (inFlightPromiseRef.current && inFlightUserIdRef.current === currentUser.id) {
      await inFlightPromiseRef.current;
      return;
    }
    if (!force && lastLoadedUserIdRef.current === currentUser.id) {
      return;
    }

    inFlightUserIdRef.current = currentUser.id;
    setIsSyncingMemberships(true);

    const fetchPromise = (async () => {
      try {
        // 1. Fetch or create Profile via authService
        const userProfile = await authService.getProfile(currentUser);
        setProfile(userProfile);

        // 2. Claim any pending pre-assigned roles before querying memberships
        try {
          await supabase.rpc('claim_pending_roles');
        } catch (e) {
          // Safe non-blocking fallback
        }

        // 3. Fetch Memberships with Organization data via authService
        const userMemberships = await authService.getUserMemberships(currentUser.id);
        setMemberships(userMemberships);

        lastLoadedUserIdRef.current = currentUser.id;

        // 3. Workspace Resolution:
        // - Nếu = 0: activeOrgId = null, xóa localStorage
        // - Nếu = 1: Tự động chọn tổ chức duy nhất, lưu localStorage
        // - Nếu > 1: Kiểm tra localStorage, nếu có và hợp lệ thì dùng, nếu không có thì gán activeOrgId = null để ép user tự chọn
        if (userMemberships.length === 0) {
          setActiveOrgId(null);
          localStorage.removeItem(STORAGE_ACTIVE_ORG_KEY);
        } else if (userMemberships.length === 1) {
          const singleOrgId = userMemberships[0].organizationId;
          setActiveOrgId(singleOrgId);
          localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, singleOrgId);
        } else {
          const storedOrgId = localStorage.getItem(STORAGE_ACTIVE_ORG_KEY);
          const hasValidStored = storedOrgId ? userMemberships.some((m) => m.organizationId === storedOrgId) : false;
          if (hasValidStored && storedOrgId) {
            setActiveOrgId(storedOrgId);
          } else {
            setActiveOrgId(null);
            localStorage.removeItem(STORAGE_ACTIVE_ORG_KEY);
          }
        }
      } catch (err) {
        console.error('Unexpected error loading auth user data:', err);
      } finally {
        inFlightUserIdRef.current = null;
        inFlightPromiseRef.current = null;
        setIsSyncingMemberships(false);
      }
    })();

    inFlightPromiseRef.current = fetchPromise;
    await fetchPromise;
  }, []);

  /**
   * Listen to Supabase Auth State changes
   */
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      setIsLoading(true);
      setError(null);

      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const { session: initialSession, user: initialUser } = await authService.getInitialSession();
        
        if (isMounted) {
          setSession(initialSession);
          setUser(initialUser);
          if (initialUser) {
            await loadUserData(initialUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const subscription = authService.subscribeToAuthChanges(async (event, newSession) => {
      if (!isMounted) return;
      
      // Keep or set loading to true while resolving auth changes with user data
      if (newSession?.user) {
        setIsLoading(true);
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);

      try {
        if (newSession?.user) {
          await loadUserData(newSession.user);
        } else {
          setProfile(null);
          setMemberships([]);
          setActiveOrgId(null);
          localStorage.removeItem(STORAGE_ACTIVE_ORG_KEY);
        }
      } catch (err) {
        console.error('Auth change handling error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  /**
   * Active membership & active organization derivation
   */
  const activeMembership = useMemo(() => {
    if (!memberships || memberships.length === 0) return null;
    if (activeOrgId) {
      const found = memberships.find((m) => m.organizationId === activeOrgId);
      if (found) return found;
    }
    if (memberships.length === 1) {
      return memberships[0];
    }
    return null;
  }, [memberships, activeOrgId]);

  const activeOrganization = useMemo(() => {
    return activeMembership?.organization || null;
  }, [activeMembership]);

  const activeRole = useMemo(() => {
    return activeMembership?.role || null;
  }, [activeMembership]);

  /**
   * Set and persist the active organization
   */
  const handleSetActiveOrganizationId = useCallback((orgId: string) => {
    const valid = memberships.some((m) => m.organizationId === orgId);
    if (valid) {
      setActiveOrgId(orgId);
      localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, orgId);
    } else {
      console.warn('User does not have membership in organization:', orgId);
    }
  }, [memberships]);

  /**
   * Refresh all auth data (profile and memberships)
   */
  const refreshAuth = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      await loadUserData(user, true);
      setIsLoading(false);
    }
  }, [user, loadUserData]);

  /**
   * Sign In with Email and Password
   */
  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    setError(null);
    if (!isSupabaseConfigured) {
      return { error: 'Chưa cấu hình Supabase URL & Anon Key trong file .env. Vui lòng cấu hình biến môi trường trước khi đăng nhập.' };
    }

    const res = await authService.signInWithEmail(email, password);
    if (res.error) {
      setError(res.error);
      return { error: res.error };
    }

    if (res.user) {
      setUser(res.user);
      setSession(res.session);
      await loadUserData(res.user, true);
    }

    return { error: null };
  };

  /**
   * Sign Up with Email and Password
   */
  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error: string | null; requiresEmailVerification: boolean }> => {
    setError(null);
    if (!isSupabaseConfigured) {
      return {
        error: 'Chưa cấu hình Supabase URL & Anon Key trong file .env.',
        requiresEmailVerification: false,
      };
    }

    const res = await authService.signUpWithEmail(email, password, fullName);
    if (res.error) {
      setError(res.error);
      return { error: res.error, requiresEmailVerification: false };
    }

    if (res.user && res.session) {
      setUser(res.user);
      setSession(res.session);
      await loadUserData(res.user);
    }

    return { error: null, requiresEmailVerification: res.requiresEmailVerification };
  };

  /**
   * Sign In with Google OAuth
   */
  const signInWithGoogle = async (): Promise<{ error: string | null }> => {
    setError(null);
    if (!isSupabaseConfigured) {
      return { error: 'Chưa cấu hình Supabase URL & Anon Key trong file .env.' };
    }

    const res = await authService.signInWithGoogle();
    if (res.error) {
      setError(res.error);
      return { error: res.error };
    }

    return { error: null };
  };

  /**
   * Sign Out
   */
  const signOut = async (): Promise<void> => {
    try {
      if (isSupabaseConfigured) {
        await authService.signOut(user?.id, activeOrgId || undefined);
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setMemberships([]);
      setActiveOrgId(null);
      localStorage.removeItem(STORAGE_ACTIVE_ORG_KEY);
    }
  };

  /**
   * Create a new organization and assign current user as admin
   */
  const createOrganization = useCallback(
    async (
      name: string,
      code: string,
      description?: string,
      type?: string
    ): Promise<{ data?: Organization; error: string | null }> => {
      if (!user) {
        return { error: 'Bạn phải đăng nhập để tạo đơn vị.' };
      }

      try {
        const createdOrg = await organizationService.createOrganization(
          {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            type: (type as OrganizationType) || 'chi_hoi',
            description: description?.trim() || null,
            finance_approval_threshold: 0,
          },
          user.id
        );

        // Refresh user memberships & set active
        localStorage.setItem(STORAGE_ACTIVE_ORG_KEY, createdOrg.id);
        setActiveOrgId(createdOrg.id);
        await loadUserData(user);

        return { data: createdOrg, error: null };
      } catch (err) {
        return { error: (err as Error).message || 'Đã có lỗi xảy ra khi tạo đơn vị.' };
      }
    },
    [user, loadUserData]
  );

  const contextValue: AuthContextType = useMemo(
    () => ({
      session,
      user,
      profile,
      memberships,
      activeMembership,
      activeOrganization,
      activeRole,
      isLoading,
      isSyncingMemberships,
      isSupabaseConfigured,
      error,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOut,
      setActiveOrganizationId: handleSetActiveOrganizationId,
      refreshAuth,
      createOrganization,
    }),
    [
      session,
      user,
      profile,
      memberships,
      activeMembership,
      activeOrganization,
      activeRole,
      isLoading,
      isSyncingMemberships,
      isSupabaseConfigured,
      error,
      handleSetActiveOrganizationId,
      refreshAuth,
      createOrganization,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
