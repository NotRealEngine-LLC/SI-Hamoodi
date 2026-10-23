// HAMOODI SyntheTech Intelligence — Database Types
// Phase 04: Workspaces, Hubs, Files, Collaboration

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type WorkspaceType = 'personal' | 'team';
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';
export type HubVisibility = 'workspace' | 'restricted';
export type HubRole = 'manager' | 'editor' | 'viewer';
export type FileUploadStatus = 'pending' | 'uploading' | 'ready' | 'failed' | 'deleted';
export type InvitationRole = 'admin' | 'editor' | 'viewer';

export interface Database {
  public: {
    Tables: {
      // Phase 03 tables
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
          workspace_id: string | null;
          hub_id: string | null;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          is_pinned: boolean;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          workspace_id?: string | null;
          hub_id?: string | null;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          is_pinned?: boolean;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workspace_id?: string | null;
          hub_id?: string | null;
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          is_pinned?: boolean;
          archived_at?: string | null;
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

      // Phase 04 tables
      workspaces: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: WorkspaceType;
          owner_id: string;
          icon: string | null;
          color: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type?: WorkspaceType;
          owner_id: string;
          icon?: string | null;
          color?: string | null;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          archived_at?: string | null;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          joined_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          joined_at?: string;
          created_at?: string;
        };
        Update: {
          role?: WorkspaceRole;
        };
      };
      hubs: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string | null;
          visibility: HubVisibility;
          created_by: string;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          visibility?: HubVisibility;
          created_by: string;
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string | null;
          color?: string | null;
          visibility?: HubVisibility;
          archived_at?: string | null;
          updated_at?: string;
        };
      };
      hub_members: {
        Row: {
          id: string;
          hub_id: string;
          user_id: string;
          role: HubRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          user_id: string;
          role?: HubRole;
          created_at?: string;
        };
        Update: {
          role?: HubRole;
        };
      };
      hub_instructions: {
        Row: {
          id: string;
          hub_id: string;
          content: string;
          version: number;
          updated_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          content: string;
          version?: number;
          updated_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          version?: number;
          updated_at?: string;
        };
      };
      file_folders: {
        Row: {
          id: string;
          workspace_id: string;
          hub_id: string | null;
          project_id: string | null;
          parent_folder_id: string | null;
          name: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          hub_id?: string | null;
          project_id?: string | null;
          parent_folder_id?: string | null;
          name: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          parent_folder_id?: string | null;
          updated_at?: string;
        };
      };
      workspace_files: {
        Row: {
          id: string;
          workspace_id: string;
          hub_id: string | null;
          project_id: string | null;
          folder_id: string | null;
          uploaded_by: string;
          display_name: string;
          original_name: string;
          storage_bucket: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          upload_status: FileUploadStatus;
          checksum: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          hub_id?: string | null;
          project_id?: string | null;
          folder_id?: string | null;
          uploaded_by: string;
          display_name: string;
          original_name: string;
          storage_bucket: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          upload_status?: FileUploadStatus;
          checksum?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string;
          folder_id?: string | null;
          upload_status?: FileUploadStatus;
          updated_at?: string;
        };
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          invited_email: string;
          invited_role: InvitationRole;
          token_hash: string;
          invited_by: string;
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          invited_email: string;
          invited_role?: InvitationRole;
          token_hash: string;
          invited_by: string;
          expires_at: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
      };
    };
  };
}
