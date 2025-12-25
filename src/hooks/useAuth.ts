import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { User, UserRole, UserStatus } from '../types';
import { supabase } from '@/integrations/supabase/client';

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

function mapSupabaseUserToAppUser(sbUser: SupabaseUser): User {
  const metadata = sbUser.user_metadata || {};

  return {
    id: sbUser.id,
    email: sbUser.email ?? '',
    name:
      (typeof metadata.name === 'string' && metadata.name) ||
      sbUser.email?.split('@')[0] ||
      'User',
    role:
      (typeof metadata.role === 'string' && (metadata.role as UserRole)) ||
      UserRole.PARTICIPANT,
    status: UserStatus.ACTIVE,
    emailVerified: !!sbUser.email_confirmed_at,
    profileCompleted:
      typeof metadata.profileCompleted === 'boolean'
        ? metadata.profileCompleted
        : undefined,
  };
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
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(mapSupabaseUserToAppUser(newSession.user));
      } else {
        setUser(null);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        const currentSession = data.session ?? null;
        setSession(currentSession);
        if (currentSession?.user) {
          setUser(mapSupabaseUserToAppUser(currentSession.user));
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
            role: data.role,
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
      setUser(mapSupabaseUserToAppUser(data.user));
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
