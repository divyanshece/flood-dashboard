'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/components/auth/AuthProvider';

interface DataRequest {
  id: string;
  user_id: string;
  requester_name: string;
  requester_email: string;
  institution: string;
  purpose: string;
  intended_use: string;
  data_description: string | null;
  export_format: 'csv' | 'excel' | 'both';
  status: 'pending' | 'approved' | 'rejected';
  admin_comments: string | null;
  reviewed_at: string | null;
  approval_valid_until: string | null;
  download_count: number;
  max_downloads: number;
  created_at: string;
  updated_at: string;
}

export default function DataAccessPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    requester_name: '',
    requester_email: '',
    institution: '',
    purpose: '',
    intended_use: '',
    data_description: '',
    export_format: 'csv' as 'csv' | 'excel' | 'both',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Load data when user is available
  useEffect(() => {
    if (!authLoading && user) {
      if (profile) {
        setFormData(prev => ({
          ...prev,
          requester_name: profile.full_name || '',
          requester_email: profile.email || user.email || '',
          institution: profile.institution || '',
        }));
      } else if (user.email) {
        setFormData(prev => ({
          ...prev,
          requester_email: user.email || '',
        }));
      }
      loadData();
    }
  }, [user, profile, authLoading]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/requests?userId=${user.id}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...formData,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSuccess('Request submitted successfully! You will be notified once reviewed.');
      setShowForm(false);
      setFormData(prev => ({
        ...prev,
        purpose: '',
        intended_use: '',
        data_description: '',
      }));
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (request: DataRequest, format: 'csv' | 'excel') => {
    if (!user) return;

    setDownloadingId(request.id);
    setOpenDropdown(null);
    setError(null);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          userId: user.id,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Download failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floodlens_data_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setSuccess('Download started! Check your downloads folder.');
      loadData(); // Refresh to update download count

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusInfo = (request: DataRequest) => {
    const isExpired = request.approval_valid_until && new Date(request.approval_valid_until) < new Date();
    const isLimitExceeded = request.download_count >= request.max_downloads;

    if (request.status === 'pending') {
      return {
        label: 'Pending Review',
        bg: 'rgba(245, 158, 11, 0.15)',
        color: '#f59e0b',
        canDownload: false,
        message: 'Your request is being reviewed by the admin.'
      };
    }

    if (request.status === 'rejected') {
      const isAutoRevoked = request.admin_comments?.includes('[Auto-');
      return {
        label: isAutoRevoked ? 'Access Revoked' : 'Rejected',
        bg: 'rgba(239, 68, 68, 0.15)',
        color: '#ef4444',
        canDownload: false,
        message: request.admin_comments || 'Your request was not approved.'
      };
    }

    if (request.status === 'approved') {
      if (isExpired) {
        return {
          label: 'Expired',
          bg: 'rgba(107, 114, 128, 0.15)',
          color: '#6b7280',
          canDownload: false,
          message: 'Your access has expired. Please submit a new request.'
        };
      }
      if (isLimitExceeded) {
        return {
          label: 'Limit Reached',
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#f59e0b',
          canDownload: false,
          message: `You have used all ${request.max_downloads} downloads. Please submit a new request.`
        };
      }
      return {
        label: 'Approved',
        bg: 'rgba(34, 197, 94, 0.15)',
        color: '#22c55e',
        canDownload: true,
        message: `Downloads: ${request.download_count} / ${request.max_downloads}`
      };
    }

    return { label: 'Unknown', bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', canDownload: false, message: '' };
  };

  if (authLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin w-12 h-12 border-4 rounded-full" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--accent-gradient)' }}>
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold" style={{ color: 'var(--text-primary)' }}>Data Access</h1>
              <p className="text-base mt-1" style={{ color: 'var(--text-secondary)' }}>Request and download the FloodLens research dataset</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium flex-1" style={{ color: '#ef4444' }}>{error}</p>
            <button onClick={() => setError(null)} className="text-sm underline" style={{ color: '#ef4444' }}>Dismiss</button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium flex-1" style={{ color: '#22c55e' }}>{success}</p>
            <button onClick={() => setSuccess(null)} className="text-sm underline" style={{ color: '#22c55e' }}>Dismiss</button>
          </div>
        )}

        {/* New Request Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-10 px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: 'var(--accent-gradient)', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)' }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Data Request
          </button>
        )}

        {/* Request Form */}
        {showForm && (
          <div className="mb-10 rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Submit New Request</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Provide details about your research and intended use</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Full Name *</label>
                  <input type="text" value={formData.requester_name} onChange={(e) => setFormData({ ...formData, requester_name: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Email *</label>
                  <input type="email" value={formData.requester_email} onChange={(e) => setFormData({ ...formData, requester_email: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Institution *</label>
                <input type="text" value={formData.institution} onChange={(e) => setFormData({ ...formData, institution: e.target.value })} required className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Purpose *</label>
                <textarea value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} required rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Intended Use *</label>
                <textarea value={formData.intended_use} onChange={(e) => setFormData({ ...formData, intended_use: e.target.value })} required rows={3} className="w-full px-4 py-3 rounded-xl text-sm resize-none" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Preferred Format</label>
                <div className="flex gap-3">
                  {['csv', 'excel', 'both'].map((format) => (
                    <button key={format} type="button" onClick={() => setFormData({ ...formData, export_format: format as 'csv' | 'excel' | 'both' })} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: formData.export_format === format ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: formData.export_format === format ? 'white' : 'var(--text-secondary)' }}>
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={isSubmitting} className="px-8 py-3 rounded-xl text-white font-semibold disabled:opacity-50" style={{ background: 'var(--accent-gradient)' }}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl font-semibold" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests List */}
        <div>
          <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Your Requests</h2>

          {isLoading ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="animate-spin w-10 h-10 border-3 rounded-full mx-auto" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }} />
              <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--bg-tertiary)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>No requests yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Submit a request to download the dataset</p>
              {!showForm && (
                <button onClick={() => setShowForm(true)} className="px-6 py-2.5 rounded-xl text-white font-semibold" style={{ background: 'var(--accent-gradient)' }}>
                  Create Your First Request
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const statusInfo = getStatusInfo(request);
                const isDownloading = downloadingId === request.id;
                const isDropdownOpen = openDropdown === request.id;

                return (
                  <div key={request.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    {/* Header */}
                    <div className="p-5 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-base leading-relaxed mb-2" style={{ color: 'var(--text-primary)' }}>
                          {request.purpose.length > 120 ? request.purpose.substring(0, 120) + '...' : request.purpose}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Submitted {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide flex-shrink-0" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Status Details */}
                    <div className="px-5 pb-5">
                      {/* Approved with download */}
                      {statusInfo.canDownload && (
                        <div className="p-4 rounded-xl mb-3" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                          <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="font-bold" style={{ color: '#22c55e' }}>Access Granted!</p>
                              </div>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Downloads used: <strong>{request.download_count}</strong> / {request.max_downloads}
                                {request.approval_valid_until && ` • Valid until ${new Date(request.approval_valid_until).toLocaleDateString()}`}
                              </p>
                            </div>

                            {/* Single Export Button with Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                              <button
                                onClick={() => setOpenDropdown(isDropdownOpen ? null : request.id)}
                                disabled={isDownloading}
                                className="px-5 py-2.5 rounded-lg text-white font-semibold text-sm flex items-center gap-2 disabled:opacity-50"
                                style={{ background: '#22c55e' }}
                              >
                                {isDownloading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                                    Downloading...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export Data
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </>
                                )}
                              </button>

                              {isDropdownOpen && !isDownloading && (
                                <div className="absolute right-0 mt-2 w-40 rounded-xl shadow-lg z-10 overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                                  <button
                                    onClick={() => handleDownload(request, 'csv')}
                                    className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-opacity-50 transition-colors"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    CSV
                                  </button>
                                  <button
                                    onClick={() => handleDownload(request, 'excel')}
                                    className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-opacity-50 transition-colors"
                                    style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <svg className="w-5 h-5" style={{ color: '#22c55e' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Excel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Not approved or limit reached */}
                      {!statusInfo.canDownload && statusInfo.message && (
                        <div className="p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{statusInfo.message}</p>
                        </div>
                      )}

                      {/* Admin comments */}
                      {request.admin_comments && !request.admin_comments.includes('[Auto-') && (
                        <div className="p-3 rounded-xl mt-3" style={{ background: 'var(--bg-tertiary)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Admin Response</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{request.admin_comments.replace(/\n\[Auto-.*\]/g, '')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
