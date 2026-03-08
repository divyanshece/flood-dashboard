export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'researcher' | 'admin';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type ExportFormat = 'csv' | 'excel' | 'both';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          institution: string | null;
          role: UserRole;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          institution?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          institution?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      data_requests: {
        Row: {
          id: string;
          user_id: string | null;
          requester_name: string;
          requester_email: string;
          institution: string;
          purpose: string;
          intended_use: string;
          data_description: string | null;
          export_format: ExportFormat;
          status: RequestStatus;
          admin_comments: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          approval_valid_until: string | null;
          download_count: number;
          max_downloads: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          requester_name: string;
          requester_email: string;
          institution: string;
          purpose: string;
          intended_use: string;
          data_description?: string | null;
          export_format?: ExportFormat;
          status?: RequestStatus;
          admin_comments?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          approval_valid_until?: string | null;
          download_count?: number;
          max_downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          requester_name?: string;
          requester_email?: string;
          institution?: string;
          purpose?: string;
          intended_use?: string;
          data_description?: string | null;
          export_format?: ExportFormat;
          status?: RequestStatus;
          admin_comments?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          approval_valid_until?: string | null;
          download_count?: number;
          max_downloads?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      data_request_downloads: {
        Row: {
          id: string;
          request_id: string;
          user_id: string | null;
          download_format: string;
          ip_address: string | null;
          user_agent: string | null;
          downloaded_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          user_id?: string | null;
          download_format: string;
          ip_address?: string | null;
          user_agent?: string | null;
          downloaded_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          user_id?: string | null;
          download_format?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          downloaded_at?: string;
        };
      };
      flood_events: {
        Row: {
          event_id: number;
          event_date: string | null;
          reported_date: string | null;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          digipin: string | null;
          location_validated: boolean;
          flood_type: string | null;
          trigger_cause: string | null;
          rainfall_mm: number | null;
          total_affected: number;
          damage_description: string | null;
          source_urls: string | null;
          extraction_model: string | null;
          last_updated: string;
        };
        Insert: {
          event_id?: number;
          event_date?: string | null;
          reported_date?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          digipin?: string | null;
          location_validated?: boolean;
          flood_type?: string | null;
          trigger_cause?: string | null;
          rainfall_mm?: number | null;
          total_affected?: number;
          damage_description?: string | null;
          source_urls?: string | null;
          extraction_model?: string | null;
          last_updated?: string;
        };
        Update: {
          event_id?: number;
          event_date?: string | null;
          reported_date?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          digipin?: string | null;
          location_validated?: boolean;
          flood_type?: string | null;
          trigger_cause?: string | null;
          rainfall_mm?: number | null;
          total_affected?: number;
          damage_description?: string | null;
          source_urls?: string | null;
          extraction_model?: string | null;
          last_updated?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      request_status: RequestStatus;
      export_format: ExportFormat;
    };
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type DataRequest = Database['public']['Tables']['data_requests']['Row'];
export type FloodEvent = Database['public']['Tables']['flood_events']['Row'];
