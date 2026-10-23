// HAMOODI SyntheTech Intelligence — Super Agent Context
// Phase 06: React context for Super Agent access

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { superAgentEngine } from '../lib/super-agent/engine';
import { AgentRun, ExecutionPlan, RunStatus } from '../lib/super-agent/types';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase/client';

interface SuperAgentContextValue {
  // Runs
  runs: AgentRun[];
  activeRun: AgentRun | null;
  isLoading: boolean;
  
  // Actions
  createRun: (objective: string, context: {
    workspaceId: string;
    hubId?: string;
    projectId?: string;
    conversationId?: string;
  }) => Promise<AgentRun>;
  
  generatePlan: (runId: string) => Promise<ExecutionPlan>;
  approvePlan: (runId: string) => Promise<void>;
  executeRun: (runId: string) => Promise<void>;
  cancelRun: (runId: string) => Promise<void>;
  
  // State
  error: string | null;
  clearError: () => void;
}

const SuperAgentContext = createContext<SuperAgentContextValue | null>(null);

export function SuperAgentProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load runs
  useEffect(() => {
    if (!user) return;

    const loadRuns = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data } = await supabase
        .from('agent_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setRuns(data as AgentRun[]);
      }
    };

    loadRuns();
  }, [user]);

  const createRun = useCallback(async (
    objective: string,
    context: {
      workspaceId: string;
      hubId?: string;
      projectId?: string;
      conversationId?: string;
    }
  ) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const run = await superAgentEngine.createRun(objective, {
        ...context,
        userId: user.id,
      });

      setRuns(prev => [run, ...prev]);
      setActiveRun(run);
      return run;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create run';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const generatePlan = useCallback(async (runId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      const plan = await superAgentEngine.generatePlan(runId, user.id);
      
      // Update local state
      setRuns(prev => prev.map(r => 
        r.id === runId ? { ...r, plan, status: 'awaiting_plan_approval' as RunStatus } : r
      ));

      if (activeRun?.id === runId) {
        setActiveRun(prev => prev ? { ...prev, plan, status: 'awaiting_plan_approval' as RunStatus } : null);
      }

      return plan;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate plan';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeRun]);

  const approvePlan = useCallback(async (runId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      await superAgentEngine.approvePlan(runId, user.id);
      
      // Update local state
      setRuns(prev => prev.map(r => 
        r.id === runId ? { 
          ...r, 
          status: 'queued' as RunStatus,
          plan_approved_at: new Date().toISOString(),
          plan_approved_by: user.id,
        } : r
      ));

      if (activeRun?.id === runId) {
        setActiveRun(prev => prev ? { 
          ...prev, 
          status: 'queued' as RunStatus,
          plan_approved_at: new Date().toISOString(),
          plan_approved_by: user.id,
        } : null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve plan';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeRun]);

  const executeRun = useCallback(async (runId: string) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    setError(null);

    try {
      await superAgentEngine.executeRun(runId, user.id);
      
      // Reload runs to get updated state
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data } = await supabase
          .from('agent_runs')
          .select('*')
          .eq('id', runId)
          .single();

        if (data) {
          setRuns(prev => prev.map(r => r.id === runId ? data as AgentRun : r));
          if (activeRun?.id === runId) {
            setActiveRun(data as AgentRun);
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute run';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, activeRun]);

  const cancelRun = useCallback(async (runId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await superAgentEngine.cancelRun(runId);
      
      // Update local state
      setRuns(prev => prev.map(r => 
        r.id === runId ? { ...r, status: 'cancelled' as RunStatus } : r
      ));

      if (activeRun?.id === runId) {
        setActiveRun(prev => prev ? { ...prev, status: 'cancelled' as RunStatus } : null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel run';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [activeRun]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <SuperAgentContext.Provider value={{
      runs,
      activeRun,
      isLoading,
      createRun,
      generatePlan,
      approvePlan,
      executeRun,
      cancelRun,
      error,
      clearError,
    }}>
      {children}
    </SuperAgentContext.Provider>
  );
}

export function useSuperAgent(): SuperAgentContextValue {
  const context = useContext(SuperAgentContext);
  if (!context) {
    throw new Error('useSuperAgent must be used within SuperAgentProvider');
  }
  return context;
}
