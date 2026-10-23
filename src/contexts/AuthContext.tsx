// HAMOODI SyntheTech Intelligence — Authentication Context
// Phase 03: Secure Authentication & Session Management

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/config';

export type AuthState = 'initializing' | 'guest' | 'authenticated' | 'signing_in' | 'signing_out' | 'error';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  state: AuthState;
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  error: string | null;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: AuthError | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: { display_name?: string }) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>('initializing');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const result = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (result.error || !result.data) return null;
    return result.data as Profile;
  }, []);

  const ensureProfile = useCallback(async (userId: string, email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Try to get existing profile
    const existingResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingResult.data) {
      setProfile(existingResult.data as Profile);
      return;
    }

    // Create profile on first login
    const displayName = email.split('@')[0];
    const upsertResult = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (!upsertResult.error && upsertResult.data) {
      setProfile(upsertResult.data as Profile);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!configured) {
      setState('guest');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setState('guest');
      return;
    }

    // Get initial session
    supabase.auth.getSession().then((result) => {
      const initialSession = result.data.session;
      setSession(initialSession);
      if (initialSession?.user) {
        setUser(initialSession.user);
        setState('authenticated');
        ensureProfile(initialSession.user.id, initialSession.user.email || '');
      } else {
        setState('guest');
      }
    });

    // Listen for auth changes
    const listener = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        
        if (event === 'SIGNED_IN' && newSession?.user) {
          setUser(newSession.user);
          setState('authenticated');
          await ensureProfile(newSession.user.id, newSession.user.email || '');
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setSession(null);
          setState('guest');
        } else if (event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            setUser(newSession.user);
          }
        } else if (event === 'USER_UPDATED') {
          if (newSession?.user) {
            setUser(newSession.user);
          }
        }
        // INITIAL_SESSION and others are handled by getSession above
      }
    );

    return () => {
      listener.data.subscription.unsubscribe();
    };
  }, [configured, ensureProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const configError = { message: 'Authentication service not configured', name: 'ConfigError' } as AuthError;
      return { error: configError };
    }

    setState('signing_in');
    setError(null);

    const result = await supabase.auth.signInWithPassword({ email, password });
    
    if (result.error) {
      setState('guest');
      setError(result.error.message);
      return { error: result.error };
    }

    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const configError = { message: 'Authentication service not configured', name: 'ConfigError' } as AuthError;
      return { error: configError, needsEmailConfirmation: false };
    }

    setState('signing_in');
    setError(null);

    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (result.error) {
      setState('guest');
      setError(result.error.message);
      return { error: result.error, needsEmailConfirmation: false };
    }

    // Check if email confirmation is required
    const sessionResult = await supabase.auth.getSession();
    if (!sessionResult.data.session) {
      setState('guest');
      return { error: null, needsEmailConfirmation: true };
    }

    return { error: null, needsEmailConfirmation: false };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setState('signing_out');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setState('guest');
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const configError = { message: 'Authentication service not configured', name: 'ConfigError' } as AuthError;
      return { error: configError };
    }

    const result = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    return { error: result.error };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const configError = { message: 'Authentication service not configured', name: 'ConfigError' } as AuthError;
      return { error: configError };
    }

    const result = await supabase.auth.updateUser({ password });
    return { error: result.error };
  }, []);

  const updateProfile = useCallback(async (updates: { display_name?: string }) => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return { error: 'Not authenticated' };

    const result = await supabase
      .from('profiles')
      .update({ display_name: updates.display_name, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (!result.error) {
      setProfile(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
    }

    return { error: result.error?.message || null };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider value={{
      state,
      user,
      profile,
      session,
      error,
      isConfigured: configured,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
