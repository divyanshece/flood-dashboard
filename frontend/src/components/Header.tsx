'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { useAuth } from './auth/AuthProvider';
import AuthModal from './auth/AuthModal';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z', protected: true },
  { href: '/analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', protected: true },
  { href: '/map', label: 'Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', protected: true },
  { href: '/explorer', label: 'Explorer', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z', protected: true },
];

const aboutLinks = [
  { href: '/about', label: 'About Project', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/team', label: 'Research Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/methodology', label: 'Methodology', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { href: '/contact', label: 'Contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isLoading, isAdmin, signOut, refreshProfile } = useAuth();

  // Always show admin for the hardcoded admin email
  const ADMIN_EMAIL = 'divyanshece242@gmail.com';
  const showAdminLink = isAdmin || user?.email === ADMIN_EMAIL;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const exploreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aboutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleExploreEnter = () => {
    if (exploreTimeoutRef.current) clearTimeout(exploreTimeoutRef.current);
    setExploreOpen(true);
  };

  const handleExploreLeave = () => {
    exploreTimeoutRef.current = setTimeout(() => setExploreOpen(false), 150);
  };

  const handleAboutEnter = () => {
    if (aboutTimeoutRef.current) clearTimeout(aboutTimeoutRef.current);
    setAboutOpen(true);
  };

  const handleAboutLeave = () => {
    aboutTimeoutRef.current = setTimeout(() => setAboutOpen(false), 150);
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    router.push('/');
  };

  const handleSyncProfile = async () => {
    setIsSyncing(true);
    try {
      await refreshProfile();
    } catch (error) {
      console.error('Failed to sync profile:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleProtectedNavClick = (e: React.MouseEvent, href: string, isProtected: boolean) => {
    if (isProtected && !user) {
      e.preventDefault();
      setPendingRedirect(href);
      setAuthModalOpen(true);
    }
    setExploreOpen(false);
  };

  const handleAuthSuccess = () => {
    if (pendingRedirect) {
      router.push(pendingRedirect);
      setPendingRedirect(null);
    }
  };

  const isOnSubPage = navLinks.some(link => pathname === link.href);

  return (
    <header
      className="sticky top-0 z-[9999]"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Left Side - Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'var(--accent-gradient)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span
              className="font-display text-xl font-bold hidden sm:block transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              FloodLens
            </span>
          </Link>

          {/* Right Side - Navigation & Actions */}
          <div className="flex items-center gap-3">
            {/* About Link - Desktop */}
            <div
              className="relative hidden md:block"
              onMouseEnter={handleAboutEnter}
              onMouseLeave={handleAboutLeave}
            >
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  color: aboutOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: aboutOpen ? 'var(--accent-muted)' : 'transparent',
                }}
              >
                About
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${aboutOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* About Dropdown */}
              <div
                className={`absolute top-full right-0 mt-2 w-52 rounded-xl overflow-hidden transition-all duration-200 ${
                  aboutOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
                }`}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  zIndex: 99999,
                }}
              >
                <div className="p-2">
                  {aboutLinks.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                      </svg>
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Explore Menu - Desktop */}
            <div
              className="relative hidden md:block"
              onMouseEnter={handleExploreEnter}
              onMouseLeave={handleExploreLeave}
            >
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: exploreOpen || isOnSubPage ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                  color: exploreOpen || isOnSubPage ? 'white' : 'var(--text-secondary)',
                  boxShadow: exploreOpen || isOnSubPage ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm font-semibold">Explore</span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${exploreOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Explore Dropdown */}
              <div
                className={`absolute top-full right-0 mt-2 w-72 rounded-2xl overflow-hidden transition-all duration-200 ${
                  exploreOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
                }`}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  zIndex: 99999,
                }}
              >
                <div className="p-3">
                  <p className="px-3 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Platform
                  </p>
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={(e) => handleProtectedNavClick(e, link.href, !!link.protected)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group"
                        style={{
                          background: isActive ? 'var(--accent-muted)' : 'transparent',
                          color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                          }
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
                          style={{
                            background: isActive ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
                          }}
                        >
                          <svg
                            className="w-4 h-4"
                            style={{ color: isActive ? 'white' : 'var(--text-muted)' }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold text-sm">{link.label}</span>
                        </div>
                        {link.protected && !user && (
                          <svg className="w-4 h-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-6 w-px mx-1" style={{ background: 'var(--border-subtle)' }} />

            {/* Auth Section */}
            {isLoading ? (
              <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
            ) : user ? (
              /* User Avatar with Dropdown */
              <div
                className="relative hidden md:block"
                onMouseEnter={() => setUserDropdownOpen(true)}
                onMouseLeave={() => setUserDropdownOpen(false)}
              >
                <button
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'var(--accent-gradient)',
                    boxShadow: userDropdownOpen ? '0 0 0 3px var(--accent-muted)' : 'none',
                  }}
                >
                  {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </button>

                {/* User Dropdown Menu */}
                <div
                  className={`absolute top-full right-0 mt-2 w-64 rounded-xl overflow-hidden transition-all duration-200 ${
                    userDropdownOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible'
                  }`}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    zIndex: 99999,
                  }}
                >
                  <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ background: 'var(--accent-gradient)' }}
                      >
                        {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {profile?.full_name || 'User'}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                    {showAdminLink && (
                      <span
                        className="inline-block mt-3 px-2.5 py-1 text-xs font-bold rounded-full"
                        style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}
                      >
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="py-2">
                    <Link
                      href="/data-access"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      My Data Requests
                    </Link>
                    <button
                      onClick={handleSyncProfile}
                      disabled={isSyncing}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      {isSyncing ? (
                        <>
                          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Sync Profile
                        </>
                      )}
                    </button>
                    {showAdminLink && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
                        style={{ color: 'var(--danger)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--danger-muted)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Admin Panel
                      </Link>
                    )}
                  </div>
                  <div className="py-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium w-full transition-colors"
                      style={{ color: 'var(--danger)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--danger-muted)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Sign in Button */
              <button
                onClick={() => setAuthModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all duration-200 hover:opacity-90"
                style={{ background: 'var(--accent-gradient)' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign in
              </button>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl transition-all duration-200"
              style={{
                background: mobileMenuOpen ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
                color: mobileMenuOpen ? 'var(--accent-primary)' : 'var(--text-secondary)'
              }}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-[800px] pb-5' : 'max-h-0'
          }`}
        >
          <nav className="flex flex-col gap-2 pt-2">
            {/* Home Link */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200"
              style={{
                color: pathname === '/' ? 'white' : 'var(--text-secondary)',
                background: pathname === '/' ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-semibold">Home</span>
            </Link>

            {/* Platform Section */}
            <div className="mt-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="px-5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Explore
              </p>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      if (link.protected && !user) {
                        e.preventDefault();
                        setPendingRedirect(link.href);
                        setAuthModalOpen(true);
                        setMobileMenuOpen(false);
                      } else {
                        setMobileMenuOpen(false);
                      }
                    }}
                    className="flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200"
                    style={{
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-gradient)' : 'transparent',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                    </svg>
                    <span className="font-semibold flex-1">{link.label}</span>
                    {link.protected && !user && (
                      <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* About Section */}
            <div className="mt-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <p className="px-5 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                About
              </p>
              {aboutLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile User Section */}
            {user ? (
              <div className="mt-2 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div className="px-5 py-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {user.email}
                    </p>
                  </div>
                  {showAdminLink && (
                    <span
                      className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full"
                      style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                <Link
                  href="/data-access"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">My Data Requests</span>
                </Link>
                <button
                  onClick={handleSyncProfile}
                  disabled={isSyncing}
                  className="flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 w-full text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {isSyncing ? (
                    <>
                      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
                      <span className="font-medium">Syncing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="font-medium">Sync Profile</span>
                    </>
                  )}
                </button>
                {showAdminLink && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200"
                    style={{ color: 'var(--danger)' }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-semibold">Admin Panel</span>
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-200 w-full text-left"
                  style={{ color: 'var(--danger)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Sign out</span>
                </button>
              </div>
            ) : (
              <div className="mt-2 pt-3 px-5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign in
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingRedirect(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </header>
  );
}
