import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole, UserStatus } from '../types';
import { supabase } from '@/integrations/supabase/looseClient';
import { logging } from '@/lib/logging';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isRolesLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (data: RegisterData) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  refreshUserRoles: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  eventCode?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUserToAppUserBase(sbUser: SupabaseUser): User {
  const metadata = sbUser.user_metadata || {};

  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    name:
      (typeof metadata.name === 'string' && metadata.name) ||
      sbUser.email?.split('@')[0] ||
      'User',
    // Default to PARTICIPANT; actual roles are resolved from the user_roles table
    role: UserRole.PARTICIPANT,
    status: UserStatus.ACTIVE,
    emailVerified: !!sbUser.email_confirmed_at,
    profileCompleted:
      typeof metadata.profileCompleted === 'boolean'
        ? metadata.profileCompleted
        : undefined,
  };
}

async function mapSupabaseUserToAppUserWithRoles(sbUser: SupabaseUser): Promise<User> {
  const baseUser = mapSupabaseUserToAppUserBase(sbUser);

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', sbUser.id);

    if (error || !data || data.length === 0) {
      // No roles found yet; fall back to base user without mutating user_roles
      // from the client. Role assignment is handled exclusively in the database
      // via triggers and admin tools.
      return baseUser;
    }

    const dbRoles = data.map((row: { role: string }) => row.role.toLowerCase());

    // Map app_role values used by the database/RLS to the frontend UserRole enum.
    // Current enum values (see migrations) include:
    //   'admin' | 'organizer' | 'participant' | 'judge' | 'volunteer' | 'speaker'
    if (dbRoles.includes('admin')) {
      baseUser.role = UserRole.SUPER_ADMIN;
    } else if (dbRoles.includes('organizer')) {
      baseUser.role = UserRole.ORGANIZER;
    } else {
      // All remaining roles are treated as participant-level access in the UI
      baseUser.role = UserRole.PARTICIPANT;
    }

    return baseUser;
  } catch {
    // On any failure, fall back to metadata-agnostic base user
    return baseUser;
  }
}

// AuthProvider wired to Lovable Cloud (Supabase) auth
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRolesLoading, setIsRolesLoading] = useState(true);

  // Initialize auth state and listen for changes
  useEffect(() => {
    // Set up auth state listener FIRST, but avoid calling Supabase inside the callback
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, newSession: any) => {
      setSession(newSession);

      const sbUser = newSession?.user ?? null;
      if (!sbUser) {
        setUser(null);
        setIsRolesLoading(false);
        return;
      }

      // Set a fast base user immediately for snappy UI
      const baseUser = mapSupabaseUserToAppUserBase(sbUser);
      setUser(baseUser);
      setIsRolesLoading(true);

      // Defer any Supabase queries (roles lookup) to avoid deadlocks inside the callback
      setTimeout(() => {
        mapSupabaseUserToAppUserWithRoles(sbUser)
          .then((u) => {
            setUser(u);
            setIsRolesLoading(false);
          })
          .catch(() => {
            // On failure, keep the base user; do not throw from callback
            setUser(baseUser);
            setIsRolesLoading(false);
          });
      }, 0);
    });

    // THEN check for existing session on mount
    supabase.auth
      .getSession()
      .then(({ data }: any) => {
        const currentSession = data.session ?? null;
        setSession(currentSession);

        if (currentSession?.user) {
          logging.setUserContext(
            {
              id: currentSession.user.id,
              email: currentSession.user.email ?? undefined,
              role: undefined,
            },
            {
              sessionExpiresAt: currentSession.expires_at
                ? new Date(currentSession.expires_at * 1000).toISOString()
                : undefined,
              provider: currentSession.user.app_metadata?.provider as string | undefined,
            },
          );

          mapSupabaseUserToAppUserWithRoles(currentSession.user)
            .then((u) => {
              setUser(u);
              setIsRolesLoading(false);
              logging.setUserContext(
                {
                  id: u.id,
                  email: u.email,
                  role: u.role,
                },
                {
                  sessionExpiresAt: currentSession.expires_at
                    ? new Date(currentSession.expires_at * 1000).toISOString()
                    : undefined,
                  provider: currentSession.user.app_metadata?.provider as string | undefined,
                },
              );
            })
            .catch(() => {
              setUser(mapSupabaseUserToAppUserBase(currentSession.user));
              setIsRolesLoading(false);
            });
        } else {
          setIsRolesLoading(false);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Unable to sign in.') };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ error: Error | null }> => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            eventCode: data.eventCode,
            desiredRole: data.role,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Unable to register.') };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    logging.setUserContext(null, null);
  };

  // With Lovable Cloud email verification links, verification happens via the link itself.
  // Keep this for compatibility with existing components; it simply re-checks the session.
  const verifyEmail = async (_token: string): Promise<void> => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const userWithRoles = await mapSupabaseUserToAppUserWithRoles(data.user);
      setUser(userWithRoles);
      logging.setUserContext(
        {
          id: userWithRoles.id,
          email: userWithRoles.email,
          role: userWithRoles.role,
        },
        {
          sessionExpiresAt: undefined,
          provider: data.user.app_metadata?.provider as string | undefined,
        },
      );
    }
  };

  const refreshUserRoles = async (): Promise<void> => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return;
    const userWithRoles = await mapSupabaseUserToAppUserWithRoles(data.user);
    setUser(userWithRoles);
    logging.setUserContext(
      {
        id: userWithRoles.id,
        email: userWithRoles.email,
        role: userWithRoles.role,
      },
      {
        sessionExpiresAt: undefined,
        provider: data.user.app_metadata?.provider as string | undefined,
      },
    );
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isRolesLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    verifyEmail,
    refreshUserRoles,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
