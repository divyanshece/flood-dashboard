import { createClient } from './supabase/client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  requiresAuth?: boolean;
}

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export async function apiCall<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Data Request API
export const requestsApi = {
  getMyRequests: () => apiCall<{ requests: DataRequestResponse[] }>('/api/requests'),

  getRequest: (id: string) => apiCall<{ request: DataRequestResponse }>(`/api/requests/${id}`),

  createRequest: (data: CreateRequestData) =>
    apiCall<{ request: DataRequestResponse }>('/api/requests', {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    }),

  replyToRequest: (id: string, data: ReplyData) =>
    apiCall<{ request: DataRequestResponse; message: string }>(`/api/requests/${id}/reply`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    }),

  cancelRequest: (id: string) =>
    apiCall<{ message: string }>(`/api/requests/${id}`, {
      method: 'DELETE',
    }),
};

// Admin API
export const adminApi = {
  getStats: () => apiCall<{ stats: AdminStats }>('/api/admin/stats'),

  getRequests: (params?: RequestsParams) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return apiCall<{ requests: DataRequestResponse[]; pagination: Pagination }>(
      `/api/admin/requests?${searchParams.toString()}`
    );
  },

  approveRequest: (id: string, data?: ApproveData) =>
    apiCall<{ request: DataRequestResponse; message: string }>(`/api/admin/requests/${id}/approve`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
    }),

  rejectRequest: (id: string, admin_comments: string) =>
    apiCall<{ request: DataRequestResponse; message: string }>(`/api/admin/requests/${id}/reject`, {
      method: 'POST',
      body: { admin_comments },
    }),

  markPending: (id: string, admin_comments: string) =>
    apiCall<{ request: DataRequestResponse; message: string }>(`/api/admin/requests/${id}/pending`, {
      method: 'POST',
      body: { admin_comments },
    }),

  getDownloads: (params?: { request_id?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.request_id) searchParams.set('request_id', params.request_id);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    return apiCall<{ downloads: DownloadLog[]; pagination: Pagination }>(
      `/api/admin/downloads?${searchParams.toString()}`
    );
  },

  updateUserRole: (id: string, role: 'researcher' | 'admin') =>
    apiCall<{ user: Profile; message: string }>(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: { role },
    }),
};

// Download API
export const downloadApi = {
  getStatus: () => apiCall<DownloadStatus>('/api/download/status'),

  getPreview: () => apiCall<PreviewResponse>('/api/download/preview'),

  downloadCsv: async (params?: DownloadParams) => {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();
    if (params?.request_id) searchParams.set('request_id', params.request_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.location) searchParams.set('location', params.location);

    const response = await fetch(`${API_BASE_URL}/api/download/csv?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(error.error || 'Download failed');
    }

    return response.blob();
  },

  downloadExcel: async (params?: DownloadParams) => {
    const token = await getAuthToken();
    const searchParams = new URLSearchParams();
    if (params?.request_id) searchParams.set('request_id', params.request_id);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.location) searchParams.set('location', params.location);

    const response = await fetch(`${API_BASE_URL}/api/download/excel?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(error.error || 'Download failed');
    }

    return response.blob();
  },
};

// Types
interface DataRequestResponse {
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
  profiles?: { full_name: string; email: string };
}

interface CreateRequestData {
  requester_name: string;
  requester_email: string;
  institution: string;
  purpose: string;
  intended_use: string;
  data_description?: string;
  export_format?: 'csv' | 'excel' | 'both';
}

interface ReplyData {
  reply: string;
  updated_purpose?: string;
  updated_intended_use?: string;
}

interface ApproveData {
  admin_comments?: string;
  max_downloads?: number;
  validity_days?: number;
}

interface RequestsParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalDownloads: number;
  totalUsers: number;
}

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  institution?: string;
  role: 'researcher' | 'admin';
}

interface DownloadLog {
  id: string;
  request_id: string;
  user_id: string;
  download_format: string;
  downloaded_at: string;
  data_requests?: { requester_name: string; requester_email: string };
  profiles?: { full_name: string; email: string };
}

interface DownloadStatus {
  eligible: boolean;
  message?: string;
  request?: {
    id: string;
    approved_at: string;
    valid_until: string;
    downloads_remaining: number;
    export_format: string;
  };
}

interface PreviewResponse {
  preview: boolean;
  count: number;
  data: FloodEvent[];
  message: string;
}

interface FloodEvent {
  event_id: number;
  event_date: string;
  location: string;
  latitude: number;
  longitude: number;
  severity?: number;
}

interface DownloadParams {
  request_id?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
}

export type {
  DataRequestResponse,
  CreateRequestData,
  AdminStats,
  DownloadStatus,
  Pagination,
  DownloadLog,
  FloodEvent,
};
