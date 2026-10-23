// HAMOODI SyntheTech Intelligence — Workspace Management Context
// Phase 04: Workspaces, Hubs, Files, Collaboration

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase/client';
import type { WorkspaceType, WorkspaceRole, HubVisibility, HubRole } from '../lib/supabase/types';

// Types
export interface Workspace {
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
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
  user?: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
}

export interface Hub {
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
  project_count?: number;
  file_count?: number;
}

export interface HubMember {
  id: string;
  hub_id: string;
  user_id: string;
  role: HubRole;
  created_at: string;
}

export interface HubInstruction {
  id: string;
  hub_id: string;
  content: string;
  version: number;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceContextValue {
  // Workspaces
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  currentMembership: WorkspaceMember | null;
  isLoadingWorkspaces: boolean;
  
  // Hubs
  hubs: Hub[];
  
  // Actions
  setCurrentWorkspace: (workspaceId: string) => void;
  createWorkspace: (name: string, type: WorkspaceType, description?: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  
  // Hub actions
  createHub: (workspaceId: string, name: string, visibility?: HubVisibility, description?: string) => Promise<Hub | null>;
  updateHub: (id: string, updates: Partial<Hub>) => Promise<void>;
  deleteHub: (id: string) => Promise<void>;
  
  // Permissions
  canCreateProject: boolean;
  canCreateHub: boolean;
  canManageMembers: boolean;
  canDeleteWorkspace: boolean;
  
  // Hub instructions
  getHubInstructions: (hubId: string) => Promise<HubInstruction | null>;
  updateHubInstructions: (hubId: string, content: string) => Promise<void>;
}

const WorkspaceManagementContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceManagementProvider({ children }: { children: React.ReactNode }) {
  const { user, state: authState } = useAuth();
  
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [currentMembership, setCurrentMembership] = useState<WorkspaceMember | null>(null);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);

  // Load workspaces
  useEffect(() => {
    if (authState !== 'authenticated' || !user) {
      setIsLoadingWorkspaces(false);
      return;
    }

    const loadWorkspaces = async () => {
      setIsLoadingWorkspaces(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setIsLoadingWorkspaces(false);
        return;
      }

      try {
        // Load workspaces user has access to
        const { data: workspacesData } = await supabase
          .from('workspaces')
          .select('*')
          .or(`owner_id.eq.${user.id},id.in.(select workspace_id from workspace_members where user_id=${user.id})`)
          .order('created_at', { ascending: false });

        if (workspacesData) {
          setWorkspaces(workspacesData as Workspace[]);
          
          // Set current workspace (prefer personal, then first available)
          const personalWs = workspacesData.find(w => w.type === 'personal');
          const defaultWs = personalWs || workspacesData[0];
          
          if (defaultWs && !currentWorkspace) {
            setCurrentWorkspaceState(defaultWs as Workspace);
            
            // Load membership
            if (defaultWs.owner_id === user.id) {
              setCurrentMembership({
                id: uuidv4(),
                workspace_id: defaultWs.id,
                user_id: user.id,
                role: 'owner',
                joined_at: defaultWs.created_at,
              });
            } else {
              const { data: memberData } = await supabase
                .from('workspace_members')
                .select('*')
                .eq('workspace_id', defaultWs.id)
                .eq('user_id', user.id)
                .single();
              
              if (memberData) {
                setCurrentMembership(memberData as WorkspaceMember);
              }
            }
          }
        }

        // Create personal workspace if none exists
        if (workspacesData?.length === 0) {
          const { data: newWs } = await supabase
            .from('workspaces')
            .insert({
              name: 'My Workspace',
              type: 'personal',
              owner_id: user.id,
              description: 'Your personal workspace',
            })
            .select()
            .single();

          if (newWs) {
            // Create owner membership
            await supabase.from('workspace_members').insert({
              workspace_id: newWs.id,
              user_id: user.id,
              role: 'owner',
            });

            setWorkspaces([newWs as Workspace]);
            setCurrentWorkspaceState(newWs as Workspace);
            setCurrentMembership({
              id: uuidv4(),
              workspace_id: newWs.id,
              user_id: user.id,
              role: 'owner',
              joined_at: newWs.created_at,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      }

      setIsLoadingWorkspaces(false);
    };

    loadWorkspaces();
  }, [authState, user]);

  // Load hubs when workspace changes
  useEffect(() => {
    if (!currentWorkspace || !user) {
      setHubs([]);
      return;
    }

    const loadHubs = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data } = await supabase
        .from('hubs')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });

      if (data) {
        setHubs(data as Hub[]);
      }
    };

    loadHubs();
  }, [currentWorkspace, user]);

  const setCurrentWorkspace = useCallback((workspaceId: string) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setCurrentWorkspaceState(ws);
    }
  }, [workspaces]);

  const createWorkspace = useCallback(async (name: string, type: WorkspaceType, description?: string) => {
    if (!user) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('workspaces')
      .insert({
        name,
        type,
        owner_id: user.id,
        description: description || null,
      })
      .select()
      .single();

    if (!error && data) {
      // Create owner membership
      await supabase.from('workspace_members').insert({
        workspace_id: data.id,
        user_id: user.id,
        role: 'owner',
      });

      const newWorkspace = data as Workspace;
      setWorkspaces(prev => [newWorkspace, ...prev]);
      return newWorkspace;
    }

    return null;
  }, [user]);

  const updateWorkspace = useCallback(async (id: string, updates: Partial<Workspace>) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('workspaces')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w));
    if (currentWorkspace?.id === id) {
      setCurrentWorkspaceState(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
    }
  }, [currentWorkspace]);

  const deleteWorkspace = useCallback(async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('workspaces').delete().eq('id', id);
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    if (currentWorkspace?.id === id) {
      setCurrentWorkspaceState(workspaces.find(w => w.id !== id) || null);
    }
  }, [currentWorkspace, workspaces]);

  const createHub = useCallback(async (workspaceId: string, name: string, visibility: HubVisibility = 'workspace', description?: string) => {
    if (!user) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('hubs')
      .insert({
        workspace_id: workspaceId,
        name,
        visibility,
        created_by: user.id,
        description: description || null,
      })
      .select()
      .single();

    if (!error && data) {
      const newHub = data as Hub;
      setHubs(prev => [newHub, ...prev]);
      return newHub;
    }

    return null;
  }, [user]);

  const updateHub = useCallback(async (id: string, updates: Partial<Hub>) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('hubs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    setHubs(prev => prev.map(h => h.id === id ? { ...h, ...updates, updated_at: new Date().toISOString() } : h));
  }, []);

  const deleteHub = useCallback(async (id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('hubs').delete().eq('id', id);
    setHubs(prev => prev.filter(h => h.id !== id));
  }, []);

  const getHubInstructions = useCallback(async (hubId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from('hub_instructions')
      .select('*')
      .eq('hub_id', hubId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    return data as HubInstruction | null;
  }, []);

  const updateHubInstructions = useCallback(async (hubId: string, content: string) => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Get current version
    const { data: current } = await supabase
      .from('hub_instructions')
      .select('version')
      .eq('hub_id', hubId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (current?.version || 0) + 1;

    await supabase.from('hub_instructions').insert({
      hub_id: hubId,
      content,
      version: newVersion,
      updated_by: user.id,
    });
  }, [user]);

  // Permission checks
  const canCreateProject = currentMembership ? ['owner', 'admin', 'editor'].includes(currentMembership.role) : false;
  const canCreateHub = canCreateProject;
  const canManageMembers = currentMembership ? ['owner', 'admin'].includes(currentMembership.role) : false;
  const canDeleteWorkspace = currentWorkspace?.owner_id === user?.id;

  return (
    <WorkspaceManagementContext.Provider value={{
      workspaces,
      currentWorkspace,
      currentMembership,
      isLoadingWorkspaces,
      hubs,
      setCurrentWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      createHub,
      updateHub,
      deleteHub,
      canCreateProject,
      canCreateHub,
      canManageMembers,
      canDeleteWorkspace,
      getHubInstructions,
      updateHubInstructions,
    }}>
      {children}
    </WorkspaceManagementContext.Provider>
  );
}

export function useWorkspaceManagement(): WorkspaceContextValue {
  const context = useContext(WorkspaceManagementContext);
  if (!context) throw new Error('useWorkspaceManagement must be used within WorkspaceManagementProvider');
  return context;
}
