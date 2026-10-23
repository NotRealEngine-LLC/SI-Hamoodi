// HAMOODI SyntheTech Intelligence — Memory Context
// Phase 07: React context for memory state management

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { memoryService } from '../lib/memory/memory-service';
import { knowledgeSourceService } from '../lib/memory/knowledge-source-service';
import type { MemoryItem, KnowledgeSource, MemoryScope, MemoryType, MemoryStatus } from '../lib/memory/types';

interface MemoryContextValue {
  // Memories
  memories: MemoryItem[];
  selectedMemory: MemoryItem | null;
  isLoadingMemories: boolean;
  
  // Knowledge Sources
  knowledgeSources: KnowledgeSource[];
  isLoadingSources: boolean;
  
  // Memory Actions
  loadMemories: (filters?: any) => Promise<void>;
  createMemory: (input: any) => Promise<MemoryItem>;
  updateMemory: (id: string, updates: any) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  selectMemory: (memory: MemoryItem | null) => void;
  
  // Knowledge Source Actions
  loadKnowledgeSources: () => Promise<void>;
  createKnowledgeSource: (input: any) => Promise<KnowledgeSource>;
  indexSource: (sourceId: string) => Promise<void>;
  deleteSource: (sourceId: string) => Promise<void>;
  
  // State
  error: string | null;
  clearError: () => void;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceManagement();
  
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMemories = useCallback(async (filters?: any) => {
    if (!user) return;
    
    setIsLoadingMemories(true);
    setError(null);
    
    try {
      const result = await memoryService.listMemories(user.id, filters);
      setMemories(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memories');
    } finally {
      setIsLoadingMemories(false);
    }
  }, [user]);

  const createMemory = useCallback(async (input: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const memory = await memoryService.createMemory(user.id, input);
    setMemories(prev => [memory, ...prev]);
    return memory;
  }, [user]);

  const updateMemory = useCallback(async (id: string, updates: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const updated = await memoryService.updateMemory(user.id, id, updates);
    setMemories(prev => prev.map(m => m.id === id ? updated : m));
    if (selectedMemory?.id === id) {
      setSelectedMemory(updated);
    }
  }, [user, selectedMemory]);

  const deleteMemory = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    
    await memoryService.deleteMemory(user.id, id);
    setMemories(prev => prev.filter(m => m.id !== id));
    if (selectedMemory?.id === id) {
      setSelectedMemory(null);
    }
  }, [user, selectedMemory]);

  const selectMemory = useCallback((memory: MemoryItem | null) => {
    setSelectedMemory(memory);
  }, []);

  const loadKnowledgeSources = useCallback(async () => {
    if (!user || !currentWorkspace) return;
    
    setIsLoadingSources(true);
    setError(null);
    
    try {
      const sources = await knowledgeSourceService.listSources(user.id, currentWorkspace.id);
      setKnowledgeSources(sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge sources');
    } finally {
      setIsLoadingSources(false);
    }
  }, [user, currentWorkspace]);

  const createKnowledgeSource = useCallback(async (input: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const source = await knowledgeSourceService.createSource(user.id, input);
    setKnowledgeSources(prev => [source, ...prev]);
    return source;
  }, [user]);

  const indexSource = useCallback(async (sourceId: string) => {
    if (!user) throw new Error('Not authenticated');
    
    await knowledgeSourceService.indexSource(user.id, sourceId);
    // Reload sources to get updated status
    await loadKnowledgeSources();
  }, [user, loadKnowledgeSources]);

  const deleteSource = useCallback(async (sourceId: string) => {
    if (!user) throw new Error('Not authenticated');
    
    await knowledgeSourceService.deleteSource(user.id, sourceId);
    setKnowledgeSources(prev => prev.filter(s => s.id !== sourceId));
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load memories and sources on mount
  useEffect(() => {
    if (user) {
      loadMemories();
    }
  }, [user, loadMemories]);

  useEffect(() => {
    if (user && currentWorkspace) {
      loadKnowledgeSources();
    }
  }, [user, currentWorkspace, loadKnowledgeSources]);

  return (
    <MemoryContext.Provider value={{
      memories,
      selectedMemory,
      isLoadingMemories,
      knowledgeSources,
      isLoadingSources,
      loadMemories,
      createMemory,
      updateMemory,
      deleteMemory,
      selectMemory,
      loadKnowledgeSources,
      createKnowledgeSource,
      indexSource,
      deleteSource,
      error,
      clearError,
    }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory(): MemoryContextValue {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within MemoryProvider');
  }
  return context;
}
