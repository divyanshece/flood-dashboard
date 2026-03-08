'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import GoogleSignInButton from './GoogleSignInButton';

export default function SignupForm() {
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institution: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      institution: formData.institution,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="card p-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--success-muted)' }}
          >
            <svg
              className="w-8 h-8"
              style={{ color: 'var(--success)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Check your email
          </h2>
          <p className="text-sm font-medium mb-6" style={{ color: 'var(--text-secondary)' }}>
            We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>.
            Please check your inbox and click the link to verify your account.
          </p>
          <Link href="/" className="btn btn-primary">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card p-8">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Create your account
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Join FloodLens to access flood analytics and data
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
              htmlFor="fullName"
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              required
              placeholder="John Doe"
              className="w-full"
            />
          </div>

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
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="institution"
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Institution / Organization
            </label>
            <input
              id="institution"
              name="institution"
              type="text"
              value={formData.institution}
              onChange={handleChange}
              required
              placeholder="University / Company name"
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
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
                <span>Creating account...</span>
              </div>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link
            href="/"
            className="font-semibold transition-colors"
            style={{ color: 'var(--accent-primary)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
