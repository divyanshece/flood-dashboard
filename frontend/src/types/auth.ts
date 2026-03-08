import { User } from '@supabase/supabase-js';
import { Profile, UserRole } from './database';

export interface AuthUser extends User {
  profile?: Profile;
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  institution: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthContextType extends AuthState {
  signUp: (data: SignUpData) => Promise<{ error: Error | null }>;
  signIn: (data: SignInData) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export type { UserRole };
