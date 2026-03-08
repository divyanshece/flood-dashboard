'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';
import { AuthContextType, SignUpData, SignInData } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      console.log('Fetching profile for user:', userId, userEmail);

      const { data, error } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Log full error details
        console.error('Error fetching profile:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });

        // If profile doesn't exist (PGRST116 = no rows returned), try to create it
        if ((error.code === 'PGRST116' || error.message?.includes('no rows')) && userEmail) {
          console.log('Profile not found, attempting to create for:', userEmail);

          const { data: newProfile, error: createError } = await (supabase
            .from('profiles') as any)
            .insert({
              id: userId,
              email: userEmail,
              full_name: userEmail.split('@')[0],
              role: userEmail === 'divyanshece242@gmail.com' ? 'admin' : 'researcher',
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', {
              message: createError.message,
              code: createError.code,
              details: createError.details,
              hint: createError.hint,
            });
            console.error('IMPORTANT: You need to run the SQL in fix-supabase-policies.sql in your Supabase SQL Editor');
            return null;
          }

          console.log('Profile created successfully:', newProfile);
          return newProfile as Profile;
        }

        // For any other error, return null but don't block the app
        console.warn('Could not fetch profile, continuing without it');
        return null;
      }

      console.log('Profile fetched successfully:', { email: data?.email, role: data?.role });
      return data as Profile;
    } catch (err) {
      console.error('Exception in fetchProfile:', err);
      return null;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, user.email);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };
        const { data: { session } } = result;

        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id, session.user.email);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          const profileData = await fetchProfile(session.user.id, session.user.email);
          setProfile(profileData);
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signUp = async (data: SignUpData) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            institution: data.institution,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Clear state immediately for instant UI update
    setUser(null);
    setProfile(null);
    setIsLoading(false);

    // Then sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value: AuthContextType = {
    user: user ? { ...user, profile: profile || undefined } : null,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
