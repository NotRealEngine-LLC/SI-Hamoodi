// HAMOODI SyntheTech Intelligence — Database Types
// Phase 03: PostgreSQL Schema Types

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_path?: string | null;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          user_id: string;
          theme: 'dark' | 'light' | 'system';
          reduced_motion: boolean;
          sidebar_collapsed: boolean;
          default_model_id: string | null;
          stream_responses: boolean;
          project_view: 'grid' | 'list';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: 'dark' | 'light' | 'system';
          reduced_motion?: boolean;
          sidebar_collapsed?: boolean;
          default_model_id?: string | null;
          stream_responses?: boolean;
          project_view?: 'grid' | 'list';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          theme?: 'dark' | 'light' | 'system';
          reduced_motion?: boolean;
          sidebar_collapsed?: boolean;
          default_model_id?: string | null;
          stream_responses?: boolean;
          project_view?: 'grid' | 'list';
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          is_pinned?: boolean;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          owner_id: string;
          project_id: string | null;
          title: string;
          selected_model_id: string | null;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          project_id?: string | null;
          title: string;
          selected_model_id?: string | null;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string | null;
          title?: string;
          selected_model_id?: string | null;
          is_pinned?: boolean;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          owner_id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          status: 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';
          model_id: string | null;
          error_code: string | null;
          sequence_number: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          status?: 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';
          model_id?: string | null;
          error_code?: string | null;
          sequence_number?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          status?: 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';
          model_id?: string | null;
          error_code?: string | null;
          updated_at?: string;
        };
      };
      activity_events: {
        Row: {
          id: string;
          owner_id: string;
          event_type: string;
          subject_type: string;
          subject_id: string | null;
          summary: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          event_type: string;
          subject_type: string;
          subject_id?: string | null;
          summary: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          metadata?: Json;
        };
      };
      local_import_batches: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'completed' | 'failed';
          projects_count: number;
          conversations_count: number;
          messages_count: number;
          fingerprint: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'pending' | 'completed' | 'failed';
          projects_count?: number;
          conversations_count?: number;
          messages_count?: number;
          fingerprint: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'completed' | 'failed';
          completed_at?: string | null;
        };
      };
    };
  };
}
