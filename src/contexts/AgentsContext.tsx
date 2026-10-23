// HAMOODI SyntheTech Intelligence — Agents Context
// Phase 10: Agent, Skill & Workflow State Management

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { agentService } from '../lib/agents/agent-service';
import { skillService } from '../lib/agents/skill-service';
import { workflowService } from '../lib/agents/workflow-service';
import { useAuth } from './AuthContext';
import type { CustomAgent, AgentSkill, WorkflowDefinition, MarketplaceListing } from '../lib/agents/types';

interface AgentsContextValue {
  // Agents
  agents: CustomAgent[];
  selectedAgent: CustomAgent | null;
  isLoadingAgents: boolean;
  
  // Skills
  skills: AgentSkill[];
  selectedSkill: AgentSkill | null;
  isLoadingSkills: boolean;
  
  // Workflows
  workflows: WorkflowDefinition[];
  selectedWorkflow: WorkflowDefinition | null;
  isLoadingWorkflows: boolean;
  
  // Marketplace
  marketplaceListings: MarketplaceListing[];
  isLoadingMarketplace: boolean;
  
  // Agent Actions
  loadAgents: (filters?: any) => Promise<void>;
  createAgent: (input: any) => Promise<CustomAgent>;
  updateAgent: (id: string, updates: any) => Promise<void>;
  deleteAgent: (id: string) => Promise<void>;
  selectAgent: (agent: CustomAgent | null) => void;
  testAgent: (agentId: string, task: string) => Promise<any>;
  
  // Skill Actions
  loadSkills: (filters?: any) => Promise<void>;
  createSkill: (input: any) => Promise<AgentSkill>;
  updateSkill: (id: string, updates: any) => Promise<void>;
  deleteSkill: (id: string) => Promise<void>;
  selectSkill: (skill: AgentSkill | null) => void;
  
  // Workflow Actions
  loadWorkflows: (filters?: any) => Promise<void>;
  createWorkflow: (input: any) => Promise<WorkflowDefinition>;
  updateWorkflow: (id: string, updates: any) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  selectWorkflow: (workflow: WorkflowDefinition | null) => void;
  
  // Marketplace Actions
  loadMarketplace: () => Promise<void>;
  
  // State
  error: string | null;
  clearError: () => void;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<CustomAgent | null>(null);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(null);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [isLoadingMarketplace, setIsLoadingMarketplace] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Load agents
  const loadAgents = useCallback(async (filters?: any) => {
    if (!user) return;
    
    setIsLoadingAgents(true);
    setError(null);
    
    try {
      const result = await agentService.listAgents(user.id, filters);
      setAgents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoadingAgents(false);
    }
  }, [user]);

  // Create agent
  const createAgent = useCallback(async (input: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const agent = await agentService.createAgent(user.id, input);
    setAgents(prev => [agent, ...prev]);
    return agent;
  }, [user]);

  // Update agent
  const updateAgent = useCallback(async (id: string, updates: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const updated = await agentService.updateAgent(user.id, id, updates);
    setAgents(prev => prev.map(a => a.id === id ? updated : a));
    if (selectedAgent?.id === id) {
      setSelectedAgent(updated);
    }
  }, [user, selectedAgent]);

  // Delete agent
  const deleteAgent = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    
    await agentService.deleteAgent(user.id, id);
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selectedAgent?.id === id) {
      setSelectedAgent(null);
    }
  }, [user, selectedAgent]);

  // Select agent
  const selectAgent = useCallback((agent: CustomAgent | null) => {
    setSelectedAgent(agent);
  }, []);

  // Test agent
  const testAgent = useCallback(async (agentId: string, task: string) => {
    if (!user) throw new Error('Not authenticated');
    
    return await agentService.testAgent(user.id, agentId, task);
  }, [user]);

  // Load skills
  const loadSkills = useCallback(async (filters?: any) => {
    if (!user) return;
    
    setIsLoadingSkills(true);
    setError(null);
    
    try {
      const result = await skillService.listSkills(user.id, filters);
      setSkills(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setIsLoadingSkills(false);
    }
  }, [user]);

  // Create skill
  const createSkill = useCallback(async (input: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const skill = await skillService.createSkill(user.id, input);
    setSkills(prev => [skill, ...prev]);
    return skill;
  }, [user]);

  // Update skill
  const updateSkill = useCallback(async (id: string, updates: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const updated = await skillService.updateSkill(user.id, id, updates);
    setSkills(prev => prev.map(s => s.id === id ? updated : s));
    if (selectedSkill?.id === id) {
      setSelectedSkill(updated);
    }
  }, [user, selectedSkill]);

  // Delete skill
  const deleteSkill = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    
    await skillService.deleteSkill(user.id, id);
    setSkills(prev => prev.filter(s => s.id !== id));
    if (selectedSkill?.id === id) {
      setSelectedSkill(null);
    }
  }, [user, selectedSkill]);

  // Select skill
  const selectSkill = useCallback((skill: AgentSkill | null) => {
    setSelectedSkill(skill);
  }, []);

  // Load workflows
  const loadWorkflows = useCallback(async (filters?: any) => {
    if (!user) return;
    
    setIsLoadingWorkflows(true);
    setError(null);
    
    try {
      const result = await workflowService.listWorkflows(user.id, filters);
      setWorkflows(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setIsLoadingWorkflows(false);
    }
  }, [user]);

  // Create workflow
  const createWorkflow = useCallback(async (input: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const workflow = await workflowService.createWorkflow(user.id, input);
    setWorkflows(prev => [workflow, ...prev]);
    return workflow;
  }, [user]);

  // Update workflow
  const updateWorkflow = useCallback(async (id: string, updates: any) => {
    if (!user) throw new Error('Not authenticated');
    
    const updated = await workflowService.updateWorkflow(user.id, id, updates);
    setWorkflows(prev => prev.map(w => w.id === id ? updated : w));
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(updated);
    }
  }, [user, selectedWorkflow]);

  // Delete workflow
  const deleteWorkflow = useCallback(async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    
    await workflowService.deleteWorkflow(user.id, id);
    setWorkflows(prev => prev.filter(w => w.id !== id));
    if (selectedWorkflow?.id === id) {
      setSelectedWorkflow(null);
    }
  }, [user, selectedWorkflow]);

  // Select workflow
  const selectWorkflow = useCallback((workflow: WorkflowDefinition | null) => {
    setSelectedWorkflow(workflow);
  }, []);

  // Load marketplace
  const loadMarketplace = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    
    setIsLoadingMarketplace(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setMarketplaceListings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketplace');
    } finally {
      setIsLoadingMarketplace(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load data on mount
  useEffect(() => {
    if (user) {
      loadAgents();
      loadSkills();
      loadWorkflows();
      loadMarketplace();
    }
  }, [user, loadAgents, loadSkills, loadWorkflows, loadMarketplace]);

  return (
    <AgentsContext.Provider value={{
      agents,
      selectedAgent,
      isLoadingAgents,
      skills,
      selectedSkill,
      isLoadingSkills,
      workflows,
      selectedWorkflow,
      isLoadingWorkflows,
      marketplaceListings,
      isLoadingMarketplace,
      loadAgents,
      createAgent,
      updateAgent,
      deleteAgent,
      selectAgent,
      testAgent,
      loadSkills,
      createSkill,
      updateSkill,
      deleteSkill,
      selectSkill,
      loadWorkflows,
      createWorkflow,
      updateWorkflow,
      deleteWorkflow,
      selectWorkflow,
      loadMarketplace,
      error,
      clearError,
    }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents(): AgentsContextValue {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgents must be used within AgentsProvider');
  }
  return context;
}
