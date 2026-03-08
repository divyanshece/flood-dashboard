'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Simple admin credentials - in production, use environment variables
const ADMIN_EMAIL = 'divyanshece242@gmail.com';
const ADMIN_PASSWORD = 'floodlens2024';

interface DataRequest {
  id: string;
  user_id: string;
  requester_name: string;
  requester_email: string;
  institution: string;
  purpose: string;
  intended_use: string;
  data_description?: string;
  export_format: 'csv' | 'excel' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  admin_comments?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_valid_until?: string;
  download_count: number;
  max_downloads: number;
  created_at: string;
  updated_at: string;
}

interface AdminStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [maxDownloads, setMaxDownloads] = useState(5);
  const [validityDays, setValidityDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const adminAuth = localStorage.getItem('floodlens_admin_auth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('floodlens_admin_auth', 'true');
      loadData();
    } else {
      setLoginError('Invalid admin credentials');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('floodlens_admin_auth');
    setRequests([]);
    setStats(null);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use admin API route that bypasses RLS
      const response = await fetch('/api/admin/requests');
      const data = await response.json();

      if (data.error) {
        console.error('Error loading requests:', data.error);
        setError(data.error);
        setRequests([]);
        setStats({
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          rejectedRequests: 0,
        });
        return;
      }

      const allRequests: DataRequest[] = data.requests || [];
      setRequests(allRequests);

      // Calculate stats
      setStats({
        totalRequests: allRequests.length,
        pendingRequests: allRequests.filter(r => r.status === 'pending').length,
        approvedRequests: allRequests.filter(r => r.status === 'approved').length,
        rejectedRequests: allRequests.filter(r => r.status === 'rejected').length,
      });
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + validityDays);

      const response = await fetch('/api/admin/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: 'approved',
          admin_comments: actionComment || null,
          reviewed_at: new Date().toISOString(),
          approval_valid_until: validUntil.toISOString(),
          max_downloads: maxDownloads,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess('Request approved successfully');
      setSelectedRequest(null);
      setActionComment('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !actionComment) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRequest.id,
          status: 'rejected',
          admin_comments: actionComment,
          reviewed_at: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess('Request rejected');
      setSelectedRequest(null);
      setActionComment('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--accent-gradient)' }}
              >
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Admin Access
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter admin credentials to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="card p-6 space-y-4">
            {loginError && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Admin Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                Admin Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold transition-all"
              style={{ background: 'var(--accent-gradient)' }}
            >
              Sign In as Admin
            </button>

            <Link
              href="/"
              className="block text-center text-sm mt-4"
              style={{ color: 'var(--text-muted)' }}
            >
              ← Back to Home
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="py-6 px-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-gradient)' }}
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                FloodLens
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full" style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}>
                Admin
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              View Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--danger-muted)', color: 'var(--danger)' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage data access requests and user permissions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--danger-muted)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
            {error}
            <button onClick={() => setError(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e' }}>
            {success}
            <button onClick={() => setSuccess(null)} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Total Requests</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalRequests}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>Pending</p>
              <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.pendingRequests}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm font-medium" style={{ color: '#22c55e' }}>Approved</p>
              <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.approvedRequests}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Rejected</p>
              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{stats.rejectedRequests}</p>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: filter === status
                  ? status === 'pending' ? '#f59e0b'
                    : status === 'approved' ? '#22c55e'
                    : status === 'rejected' ? '#ef4444'
                    : 'var(--accent-primary)'
                  : 'var(--bg-secondary)',
                color: filter === status ? 'white' : 'var(--text-secondary)',
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="card">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin w-8 h-8 border-2 rounded-full" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
              {requests.length === 0 ? 'No data requests yet' : 'No requests match the selected filter'}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {filteredRequests.map(request => (
                <div key={request.id} className="p-4" style={{ background: selectedRequest?.id === request.id ? 'var(--bg-tertiary)' : 'transparent' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {request.requester_name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            background: request.status === 'approved' ? 'rgba(34, 197, 94, 0.15)'
                              : request.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(245, 158, 11, 0.15)',
                            color: request.status === 'approved' ? '#22c55e'
                              : request.status === 'rejected' ? '#ef4444'
                              : '#f59e0b',
                          }}
                        >
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
                        {request.requester_email} | {request.institution}
                      </p>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Purpose:</strong> {request.purpose.substring(0, 150)}...
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Submitted: {new Date(request.created_at).toLocaleDateString()}
                        {request.reviewed_at && ` | Reviewed: ${new Date(request.reviewed_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                    >
                      {selectedRequest?.id === request.id ? 'Close' : 'Review'}
                    </button>
                  </div>

                  {/* Expanded Review Panel */}
                  {selectedRequest?.id === request.id && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Purpose</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{request.purpose}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Intended Use</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{request.intended_use}</p>
                        </div>
                      </div>

                      {request.data_description && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Additional Info</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{request.data_description}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Export Format Requested</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{request.export_format.toUpperCase()}</p>
                      </div>

                      {request.admin_comments && (
                        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Previous Admin Comment</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{request.admin_comments}</p>
                        </div>
                      )}

                      {/* Action controls for ALL statuses */}
                      <div className="space-y-4">
                        {/* Status info for approved/rejected */}
                        {request.status === 'approved' && (
                          <div className="p-3 rounded-lg mb-3" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                            <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                              ✓ Currently Approved
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                              Downloads: {request.download_count} / {request.max_downloads}
                              {request.approval_valid_until && ` | Valid until: ${new Date(request.approval_valid_until).toLocaleDateString()}`}
                            </p>
                          </div>
                        )}
                        {request.status === 'rejected' && (
                          <div className="p-3 rounded-lg mb-3" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                            <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
                              ✗ Currently Rejected
                            </p>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Admin Comments {request.status !== 'pending' && '(Update)'}
                          </label>
                          <textarea
                            value={actionComment}
                            onChange={e => setActionComment(e.target.value)}
                            rows={3}
                            placeholder={request.status === 'pending' ? 'Add comments (required for rejection)' : 'Add new comments for status change...'}
                            className="w-full px-4 py-3 rounded-xl text-sm"
                            style={{
                              background: 'var(--bg-tertiary)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </div>

                        {(request.status === 'pending' || request.status === 'rejected') && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Max Downloads
                              </label>
                              <input
                                type="number"
                                value={maxDownloads}
                                onChange={e => setMaxDownloads(parseInt(e.target.value) || 5)}
                                min={1}
                                max={100}
                                className="w-full px-4 py-3 rounded-xl text-sm"
                                style={{
                                  background: 'var(--bg-tertiary)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-primary)',
                                }}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                                Valid for (days)
                              </label>
                              <input
                                type="number"
                                value={validityDays}
                                onChange={e => setValidityDays(parseInt(e.target.value) || 30)}
                                min={1}
                                max={365}
                                className="w-full px-4 py-3 rounded-xl text-sm"
                                style={{
                                  background: 'var(--bg-tertiary)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-primary)',
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 flex-wrap">
                          {/* Approve button - show for pending or rejected */}
                          {(request.status === 'pending' || request.status === 'rejected') && (
                            <button
                              onClick={handleApprove}
                              disabled={isSubmitting}
                              className="px-6 py-2.5 rounded-lg text-white font-semibold transition-all hover:opacity-90"
                              style={{ background: '#22c55e' }}
                            >
                              {isSubmitting ? 'Processing...' : request.status === 'rejected' ? 'Change to Approved' : 'Approve'}
                            </button>
                          )}
                          {/* Reject button - show for pending or approved */}
                          {(request.status === 'pending' || request.status === 'approved') && (
                            <button
                              onClick={handleReject}
                              disabled={isSubmitting || !actionComment}
                              className="px-6 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50 transition-all hover:opacity-90"
                              style={{ background: '#ef4444' }}
                              title={!actionComment ? 'Please add a comment for rejection' : ''}
                            >
                              {request.status === 'approved' ? 'Revoke Access' : 'Reject'}
                            </button>
                          )}
                          {/* Reset to pending */}
                          {request.status !== 'pending' && (
                            <button
                              onClick={async () => {
                                setIsSubmitting(true);
                                try {
                                  const response = await fetch('/api/admin/requests', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: request.id,
                                      status: 'pending',
                                      admin_comments: actionComment || 'Status reset to pending',
                                    }),
                                  });
                                  const data = await response.json();
                                  if (data.error) throw new Error(data.error);
                                  setSuccess('Status reset to pending');
                                  setSelectedRequest(null);
                                  setActionComment('');
                                  loadData();
                                } catch (err: any) {
                                  setError(err.message || 'Failed to update');
                                } finally {
                                  setIsSubmitting(false);
                                }
                              }}
                              disabled={isSubmitting}
                              className="px-6 py-2.5 rounded-lg font-semibold transition-all"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                              Reset to Pending
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
