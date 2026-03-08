'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import GoogleSignInButton from './GoogleSignInButton';

export default function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(urlError);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push(redirectTo);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access the FloodLens dashboard
          </p>
        </div>

        <GoogleSignInButton />

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-4 rounded-xl text-sm font-medium"
              style={{
                background: 'var(--danger-muted)',
                color: 'var(--danger)',
                border: '1px solid var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--accent-primary)' }}
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-4 h-4 rounded-full animate-spin"
                  style={{
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                  }}
                />
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="font-semibold transition-colors"
            style={{ color: 'var(--accent-primary)' }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
