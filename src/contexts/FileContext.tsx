// HAMOODI SyntheTech Intelligence — File Management Context
// Phase 04: Cloud File Storage & Management

import React, { createContext, useContext, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase/client';
import type { FileUploadStatus } from '../lib/supabase/types';

export interface WorkspaceFile {
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
}

export interface FileFolder {
  id: string;
  workspace_id: string;
  hub_id: string | null;
  project_id: string | null;
  parent_folder_id: string | null;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FileContextValue {
  files: WorkspaceFile[];
  folders: FileFolder[];
  isLoading: boolean;
  
  // File actions
  uploadFile: (file: File, options: { workspace_id: string; hub_id?: string; project_id?: string; folder_id?: string; display_name?: string }) => Promise<WorkspaceFile | null>;
  deleteFile: (id: string) => Promise<void>;
  updateFile: (id: string, updates: Partial<WorkspaceFile>) => Promise<void>;
  getFileUrl: (file: WorkspaceFile) => Promise<string | null>;
  
  // Folder actions
  createFolder: (workspaceId: string, name: string, options?: { hub_id?: string; project_id?: string; parent_folder_id?: string }) => Promise<FileFolder | null>;
  deleteFolder: (id: string) => Promise<void>;
  updateFolder: (id: string, updates: Partial<FileFolder>) => Promise<void>;
  
  // Load files
  loadFiles: (workspaceId: string, options?: { hub_id?: string; project_id?: string; folder_id?: string }) => Promise<void>;
  loadFolders: (workspaceId: string, options?: { hub_id?: string; project_id?: string; parent_folder_id?: string }) => Promise<void>;
}

const FileContext = createContext<FileContextValue | null>(null);

const STORAGE_BUCKET = 'si-workspace-files';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function FileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [folders, setFolders] = useState<FileFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = useCallback(async (workspaceId: string, options?: { hub_id?: string; project_id?: string; folder_id?: string }) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setIsLoading(true);
    let query = supabase
      .from('workspace_files')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('upload_status', 'ready')
      .order('created_at', { ascending: false });

    if (options?.hub_id) query = query.eq('hub_id', options.hub_id);
    if (options?.project_id) query = query.eq('project_id', options.project_id);
    if (options?.folder_id) query = query.eq('folder_id', options.folder_id);
    else query = query.is('folder_id', null);

    const { data } = await query;
    if (data) {
      setFiles(data as WorkspaceFile[]);
    }
    setIsLoading(false);
  }, []);

  const loadFolders = useCallback(async (workspaceId: string, options?: { hub_id?: string; project_id?: string; parent_folder_id?: string }) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let query = supabase
      .from('file_folders')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true });

    if (options?.hub_id) query = query.eq('hub_id', options.hub_id);
    if (options?.project_id) query = query.eq('project_id', options.project_id);
    if (options?.parent_folder_id) query = query.eq('parent_folder_id', options.parent_folder_id);
    else query = query.is('parent_folder_id', null);

    const { data } = await query;
    if (data) {
      setFolders(data as FileFolder[]);
    }
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    options: { workspace_id: string; hub_id?: string; project_id?: string; folder_id?: string; display_name?: string }
  ) => {
    if (!user) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB limit`);
    }

    const fileId = uuidv4();
    const storagePath = `workspaces/${options.workspace_id}/objects/${fileId}/${file.name}`;

    // Create file record with pending status
    const { data: fileRecord, error: insertError } = await supabase
      .from('workspace_files')
      .insert({
        id: fileId,
        workspace_id: options.workspace_id,
        hub_id: options.hub_id || null,
        project_id: options.project_id || null,
        folder_id: options.folder_id || null,
        uploaded_by: user.id,
        display_name: options.display_name || file.name,
        original_name: file.name,
        storage_bucket: STORAGE_BUCKET,
        storage_path: storagePath,
        mime_type: file.type,
        size_bytes: file.size,
        upload_status: 'uploading',
      })
      .select()
      .single();

    if (insertError || !fileRecord) {
      throw new Error('Failed to create file record');
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      // Mark as failed
      await supabase
        .from('workspace_files')
        .update({ upload_status: 'failed' })
        .eq('id', fileId);
      throw new Error('Failed to upload file');
    }

    // Mark as ready
    const { data: updatedFile } = await supabase
      .from('workspace_files')
      .update({ upload_status: 'ready' })
      .eq('id', fileId)
      .select()
      .single();

    if (updatedFile) {
      setFiles(prev => [updatedFile as WorkspaceFile, ...prev]);
      return updatedFile as WorkspaceFile;
    }

    return null;
  }, [user]);

  const deleteFile = useCallback(async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Get file to delete from storage
    const { data: file } = await supabase
      .from('workspace_files')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (file) {
      // Delete from storage
      await supabase.storage.from(STORAGE_BUCKET).remove([file.storage_path]);
    }

    // Delete record
    await supabase.from('workspace_files').delete().eq('id', id);
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFile = useCallback(async (id: string, updates: Partial<WorkspaceFile>) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('workspace_files')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } : f));
  }, []);

  const getFileUrl = useCallback(async (file: WorkspaceFile) => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data } = await supabase.storage
      .from(file.storage_bucket)
      .createSignedUrl(file.storage_path, 3600); // 1 hour

    return data?.signedUrl || null;
  }, []);

  const createFolder = useCallback(async (
    workspaceId: string,
    name: string,
    options?: { hub_id?: string; project_id?: string; parent_folder_id?: string }
  ) => {
    if (!user) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('file_folders')
      .insert({
        workspace_id: workspaceId,
        hub_id: options?.hub_id || null,
        project_id: options?.project_id || null,
        parent_folder_id: options?.parent_folder_id || null,
        name,
        created_by: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      const newFolder = data as FileFolder;
      setFolders(prev => [newFolder, ...prev]);
      return newFolder;
    }

    return null;
  }, [user]);

  const deleteFolder = useCallback(async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Check if folder has files
    const { count } = await supabase
      .from('workspace_files')
      .select('*', { count: 'exact', head: true })
      .eq('folder_id', id);

    if (count && count > 0) {
      throw new Error('Cannot delete folder with files. Move or delete files first.');
    }

    await supabase.from('file_folders').delete().eq('id', id);
    setFolders(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFolder = useCallback(async (id: string, updates: Partial<FileFolder>) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('file_folders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    setFolders(prev => prev.map(f => f.id === id ? { ...f, ...updates, updated_at: new Date().toISOString() } : f));
  }, []);

  return (
    <FileContext.Provider value={{
      files,
      folders,
      isLoading,
      uploadFile,
      deleteFile,
      updateFile,
      getFileUrl,
      createFolder,
      deleteFolder,
      updateFolder,
      loadFiles,
      loadFolders,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles(): FileContextValue {
  const context = useContext(FileContext);
  if (!context) throw new Error('useFiles must be used within FileProvider');
  return context;
}
