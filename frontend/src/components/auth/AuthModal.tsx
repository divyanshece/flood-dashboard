'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from './AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function AuthModalContent({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [institution, setInstitution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Close modal when user logs in
  useEffect(() => {
    if (user && isOpen) {
      onSuccess?.();
      onClose();
    }
  }, [user, isOpen, onSuccess, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setEmail('');
        setPassword('');
        setFullName('');
        setInstitution('');
        setError(null);
        setIsSubmitting(false);
        setIsGoogleLoading(false);
        setShowSuccess(false);
        setMode('login');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  }, [signInWithGoogle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn({ email, password });
        if (error) {
          setError(error.message);
        }
      } else {
        const { error } = await signUp({ email, password, fullName, institution });
        if (error) {
          setError(error.message);
        } else {
          setShowSuccess(true);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setEmail('');
    setPassword('');
    setFullName('');
    setInstitution('');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          margin: '16px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div style={{ padding: '32px' }}>
          {showSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--success-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg width="32" height="32" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Check your email
              </h3>
              <p style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--text-secondary)' }}>
                We sent a confirmation link to<br />
                <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>
              </p>
              <button onClick={onClose} className="btn btn-primary" style={{ padding: '12px 32px' }}>
                Got it
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="28" height="28" style={{ color: 'white' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {mode === 'login' ? 'Sign in to access FloodLens' : 'Join FloodLens research platform'}
                </p>
              </div>

              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isSubmitting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  border: '2px solid var(--border-subtle)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: isGoogleLoading || isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isGoogleLoading || isSubmitting ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isGoogleLoading ? (
                  <>
                    <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-subtle)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {error && (
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      background: 'var(--danger-muted)',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                    }}
                  >
                    <svg width="16" height="16" style={{ flexShrink: 0, marginTop: '2px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {mode === 'signup' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="John Doe"
                        disabled={isSubmitting || isGoogleLoading}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '2px solid var(--border-subtle)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        Institution
                      </label>
                      <input
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        required
                        placeholder="University or Organization"
                        disabled={isSubmitting || isGoogleLoading}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '2px solid var(--border-subtle)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    disabled={isSubmitting || isGoogleLoading}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '2px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-primary)' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter password'}
                    disabled={isSubmitting || isGoogleLoading}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '2px solid var(--border-subtle)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGoogleLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--accent-gradient)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: isSubmitting || isGoogleLoading ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting || isGoogleLoading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign in' : 'Create account'
                  )}
                </button>
              </form>

              {/* Toggle link */}
              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={switchMode}
                  disabled={isSubmitting || isGoogleLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function AuthModal(props: AuthModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Use portal to render modal at document.body level
  return createPortal(<AuthModalContent {...props} />, document.body);
}
