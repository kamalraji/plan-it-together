import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole, UserStatus } from '../types';
import { supabase } from '@/integrations/supabase/looseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (data: RegisterData) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
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
      // If no roles are found yet, bootstrap a default coarse role in user_roles.
      // This ensures every authenticated user gets an app_role row the first time
      // they sign in, which RLS policies and admin tooling can rely on.
      try {
        const { error: insertError } = await supabase.from('user_roles').insert({
          user_id: sbUser.id,
          role: 'participant',
        });

        if (insertError) {
          // Swallow insert errors and just fall back to base user; RLS or
          // connectivity issues should not block the app from working.
          console.warn('Failed to bootstrap user_roles row for user', sbUser.id, insertError);
        }
      } catch (e) {
        console.warn('Unexpected error bootstrapping user_roles row for user', sbUser.id, e);
      }

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

  // Initialize auth state and listen for changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, newSession: any) => {
      setSession(newSession);
      if (newSession?.user) {
        mapSupabaseUserToAppUserWithRoles(newSession.user)
          .then(setUser)
          .catch(() => setUser(mapSupabaseUserToAppUserBase(newSession.user)));
      } else {
        setUser(null);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data }: any) => {
        const currentSession = data.session ?? null;
        setSession(currentSession);
        if (currentSession?.user) {
          mapSupabaseUserToAppUserWithRoles(currentSession.user)
            .then(setUser)
            .catch(() => setUser(mapSupabaseUserToAppUserBase(currentSession.user)));
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
  };

  // With Lovable Cloud email verification links, verification happens via the link itself.
  // Keep this for compatibility with existing components; it simply re-checks the session.
  const verifyEmail = async (_token: string): Promise<void> => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const userWithRoles = await mapSupabaseUserToAppUserWithRoles(data.user);
      setUser(userWithRoles);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    verifyEmail,
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
