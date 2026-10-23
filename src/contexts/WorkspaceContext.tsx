// HAMOODI SyntheTech Intelligence — Workspace Context
// Phase 03: Local/Cloud Data Management & Migration

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase/client';
import { isSupabaseConfigured } from '../lib/supabase/config';

// Types
export interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  project_id: string | null;
  title: string;
  selected_model_id: string | null;
  is_pinned: boolean;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';
  model_id: string | null;
  created_at: string;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  reduced_motion: boolean;
  sidebar_collapsed: boolean;
  default_model_id: string | null;
  stream_responses: boolean;
  project_view: 'grid' | 'list';
}

export type WorkspaceMode = 'local' | 'cloud';

export interface ActivityEvent {
  id: string;
  event_type: string;
  subject_type: string;
  subject_id: string | null;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface WorkspaceContextValue {
  mode: WorkspaceMode;
  projects: Project[];
  conversations: Conversation[];
  preferences: UserPreferences;
  activities: ActivityEvent[];
  isLoading: boolean;
  hasLocalData: boolean;
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createConversation: (conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'messages'>) => Promise<Conversation>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'created_at'>) => Promise<Message>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  importLocalData: () => Promise<{ success: boolean; imported: { projects: number; conversations: number; messages: number } }>;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  reduced_motion: false,
  sidebar_collapsed: false,
  default_model_id: null,
  stream_responses: true,
  project_view: 'grid',
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// Local storage keys
const LS_PROJECTS = 'hamoodi_local_projects';
const LS_CONVERSATIONS = 'hamoodi_local_conversations';
const LS_PREFERENCES = 'hamoodi_local_preferences';
const LS_ACTIVITIES = 'hamoodi_local_activities';

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, state: authState } = useAuth();
  const mode: WorkspaceMode = authState === 'authenticated' && user ? 'cloud' : 'local';
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'offline'>('idle');

  // Load local data on mount
  useEffect(() => {
    const localProjects = loadLocal<Project[]>(LS_PROJECTS, []);
    const localConversations = loadLocal<Conversation[]>(LS_CONVERSATIONS, []);
    const localPrefs = loadLocal<Partial<UserPreferences>>(LS_PREFERENCES, {});
    const localActivities = loadLocal<ActivityEvent[]>(LS_ACTIVITIES, []);
    
    setPreferences({ ...defaultPreferences, ...localPrefs });
    setActivities(localActivities);
    setHasLocalData(localProjects.length > 0 || localConversations.length > 0);

    if (mode === 'local') {
      setProjects(localProjects);
      setConversations(localConversations);
      setIsLoading(false);
    }
  }, []);

  // Load cloud data when authenticated
  useEffect(() => {
    if (mode !== 'cloud' || !user) {
      setIsLoading(false);
      return;
    }

    const loadCloudData = async () => {
      setIsLoading(true);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const [projectsRes, convosRes, prefsRes] = await Promise.all([
          supabase.from('projects').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false }),
          supabase.from('conversations').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false }),
          supabase.from('user_preferences').select('*').eq('user_id', user.id).single(),
        ]);

        if (projectsRes.data) {
          setProjects(projectsRes.data as Project[]);
        }

        if (convosRes.data) {
          const convos = convosRes.data as Conversation[];
          // Load messages for each conversation
          const convosWithMessages = await Promise.all(
            convos.map(async (c) => {
              const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', c.id)
                .order('sequence_number', { ascending: true });
              return { ...c, messages: (messages || []) as Message[] };
            })
          );
          setConversations(convosWithMessages);
        }

        if (prefsRes.data) {
          setPreferences(prev => ({ ...prev, ...prefsRes.data }));
        }

        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }

      setIsLoading(false);
    };

    loadCloudData();
  }, [mode, user]);

  const addActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'created_at'>) => {
    const newActivity: ActivityEvent = {
      ...event,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };

    if (mode === 'local') {
      setActivities(prev => {
        const updated = [newActivity, ...prev].slice(0, 100);
        saveLocal(LS_ACTIVITIES, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        supabase.from('activity_events').insert({
          owner_id: user.id,
          event_type: event.event_type,
          subject_type: event.subject_type,
          subject_id: event.subject_id,
          summary: event.summary,
          metadata: event.metadata,
        });
      }
    }
  }, [mode, user]);

  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> => {
    const now = new Date().toISOString();
    const newProject: Project = { ...projectData, id: uuidv4(), created_at: now, updated_at: now };

    if (mode === 'local') {
      setProjects(prev => {
        const updated = [newProject, ...prev];
        saveLocal(LS_PROJECTS, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        setSyncStatus('syncing');
        const { data, error } = await supabase.from('projects').insert({
          owner_id: user.id,
          name: newProject.name,
          description: newProject.description,
          icon: newProject.icon,
          color: newProject.color,
          is_pinned: newProject.is_pinned,
        }).select().single();

        if (!error && data) {
          setProjects(prev => [data as unknown as Project, ...prev]);
        }
        setSyncStatus(error ? 'error' : 'synced');
      }
    }

    addActivity({
      event_type: 'project_created',
      subject_type: 'project',
      subject_id: newProject.id,
      summary: `Created project "${newProject.name}"`,
      metadata: {},
    });

    return newProject;
  }, [mode, user, addActivity]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    const now = new Date().toISOString();

    if (mode === 'local') {
      setProjects(prev => {
        const updated = prev.map(p => p.id === id ? { ...p, ...updates, updated_at: now } : p);
        saveLocal(LS_PROJECTS, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        setSyncStatus('syncing');
        await supabase.from('projects').update({ ...updates, updated_at: now }).eq('id', id).eq('owner_id', user.id);
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updated_at: now } : p));
        setSyncStatus('synced');
      }
    }
  }, [mode, user]);

  const deleteProject = useCallback(async (id: string) => {
    if (mode === 'local') {
      setProjects(prev => {
        const updated = prev.filter(p => p.id !== id);
        saveLocal(LS_PROJECTS, updated);
        return updated;
      });
      // Detach conversations from deleted project
      setConversations(prev => {
        const updated = prev.map(c => c.project_id === id ? { ...c, project_id: null } : c);
        saveLocal(LS_CONVERSATIONS, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        setSyncStatus('syncing');
        // Detach conversations first
        await supabase.from('conversations').update({ project_id: null }).eq('project_id', id).eq('owner_id', user.id);
        await supabase.from('projects').delete().eq('id', id).eq('owner_id', user.id);
        setProjects(prev => prev.filter(p => p.id !== id));
        setConversations(prev => prev.map(c => c.project_id === id ? { ...c, project_id: null } : c));
        setSyncStatus('synced');
      }
    }

    addActivity({
      event_type: 'project_deleted',
      subject_type: 'project',
      subject_id: id,
      summary: 'Deleted a project',
      metadata: {},
    });
  }, [mode, user, addActivity]);

  const createConversation = useCallback(async (convoData: Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'messages'>): Promise<Conversation> => {
    const now = new Date().toISOString();
    const newConvo: Conversation = { ...convoData, id: uuidv4(), messages: [], created_at: now, updated_at: now };

    if (mode === 'local') {
      setConversations(prev => {
        const updated = [newConvo, ...prev];
        saveLocal(LS_CONVERSATIONS, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        setSyncStatus('syncing');
        const { data, error } = await supabase.from('conversations').insert({
          owner_id: user.id,
          project_id: newConvo.project_id,
          title: newConvo.title,
          selected_model_id: newConvo.selected_model_id,
          is_pinned: newConvo.is_pinned,
        }).select().single();

        if (!error && data) {
          setConversations(prev => [{ ...data, messages: [] } as unknown as Conversation, ...prev]);
        }
        setSyncStatus(error ? 'error' : 'synced');
      }
    }

    return newConvo;
  }, [mode, user]);

  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    const now = new Date().toISOString();

    if (mode === 'local') {
      setConversations(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, ...updates, updated_at: now } : c);
        saveLocal(LS_CONVERSATIONS, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        const { project_id, title, selected_model_id, is_pinned, messages, ...rest } = updates;
        await supabase.from('conversations').update({
          project_id, title, selected_model_id, is_pinned, updated_at: now,
        }).eq('id', id).eq('owner_id', user.id);
        setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates, updated_at: now } : c));
      }
    }
  }, [mode, user]);

  const deleteConversation = useCallback(async (id: string) => {
    if (mode === 'local') {
      setConversations(prev => {
        const updated = prev.filter(c => c.id !== id);
        saveLocal(LS_CONVERSATIONS, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        await supabase.from('messages').delete().eq('conversation_id', id);
        await supabase.from('conversations').delete().eq('id', id).eq('owner_id', user.id);
        setConversations(prev => prev.filter(c => c.id !== id));
      }
    }
  }, [mode, user]);

  const addMessage = useCallback(async (conversationId: string, msgData: Omit<Message, 'id' | 'created_at'>): Promise<Message> => {
    const now = new Date().toISOString();
    const newMsg: Message = { ...msgData, id: uuidv4(), created_at: now };

    if (mode === 'local') {
      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id !== conversationId) return c;
          const msgs = [...c.messages, newMsg];
          return { ...c, messages: msgs, updated_at: now };
        });
        saveLocal(LS_CONVERSATIONS, updated);
        return updated;
      });
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        // Get current sequence number
        const { data: existing } = await supabase
          .from('messages')
          .select('sequence_number')
          .eq('conversation_id', conversationId)
          .order('sequence_number', { ascending: false })
          .limit(1);

        const seqNum = (existing?.[0]?.sequence_number || 0) + 1;

        const { data, error } = await supabase.from('messages').insert({
          owner_id: user.id,
          conversation_id: conversationId,
          role: newMsg.role,
          content: newMsg.content,
          status: newMsg.status,
          model_id: newMsg.model_id,
          sequence_number: seqNum,
        }).select().single();

        if (!error && data) {
          setConversations(prev => prev.map(c => {
            if (c.id !== conversationId) return c;
            return { ...c, messages: [...c.messages, data as unknown as Message], updated_at: now };
          }));
        }

        // Update conversation timestamp
        await supabase.from('conversations').update({ updated_at: now }).eq('id', conversationId).eq('owner_id', user.id);
      }
    }

    return newMsg;
  }, [mode, user]);

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);

    if (mode === 'local') {
      saveLocal(LS_PREFERENCES, newPrefs);
    } else {
      const supabase = getSupabaseClient();
      if (supabase && user) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          ...newPrefs,
          updated_at: new Date().toISOString(),
        });
      }
    }
  }, [mode, user, preferences]);

  const importLocalData = useCallback(async () => {
    if (mode !== 'cloud' || !user) return { success: false, imported: { projects: 0, conversations: 0, messages: 0 } };
    
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, imported: { projects: 0, conversations: 0, messages: 0 } };

    const localProjects = loadLocal<Project[]>(LS_PROJECTS, []);
    const localConversations = loadLocal<Conversation[]>(LS_CONVERSATIONS, []);

    if (localProjects.length === 0 && localConversations.length === 0) {
      return { success: true, imported: { projects: 0, conversations: 0, messages: 0 } };
    }

    setSyncStatus('syncing');
    const idMap: Record<string, string> = {};
    let importedProjects = 0;
    let importedConversations = 0;
    let importedMessages = 0;

    // Import projects
    for (const p of localProjects) {
      const newId = uuidv4();
      idMap[p.id] = newId;
      const { error } = await supabase.from('projects').insert({
        id: newId,
        owner_id: user.id,
        name: p.name,
        description: p.description,
        icon: p.icon,
        color: p.color,
        is_pinned: p.is_pinned,
      });
      if (!error) importedProjects++;
    }

    // Import conversations
    for (const c of localConversations) {
      const newId = uuidv4();
      idMap[c.id] = newId;
      const mappedProjectId = c.project_id ? (idMap[c.project_id] || null) : null;
      
      const { error } = await supabase.from('conversations').insert({
        id: newId,
        owner_id: user.id,
        project_id: mappedProjectId,
        title: c.title,
        selected_model_id: c.selected_model_id,
        is_pinned: c.is_pinned,
      });
      if (!error) importedConversations++;

      // Import messages
      for (let i = 0; i < c.messages.length; i++) {
        const m = c.messages[i];
        const { error: msgError } = await supabase.from('messages').insert({
          owner_id: user.id,
          conversation_id: newId,
          role: m.role,
          content: m.content,
          status: m.status,
          model_id: m.model_id,
          sequence_number: i + 1,
        });
        if (!msgError) importedMessages++;
      }
    }

    setSyncStatus('synced');
    return { success: true, imported: { projects: importedProjects, conversations: importedConversations, messages: importedMessages } };
  }, [mode, user]);

  return (
    <WorkspaceContext.Provider value={{
      mode,
      projects,
      conversations,
      preferences,
      activities,
      isLoading,
      hasLocalData,
      createProject,
      updateProject,
      deleteProject,
      createConversation,
      updateConversation,
      deleteConversation,
      addMessage,
      updatePreferences,
      importLocalData,
      syncStatus,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
