// HAMOODI SyntheTech Intelligence — Integrations Context
// Phase 08: React context for integration state management

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../lib/supabase/client';
import { mcpClientManager } from '../lib/mcp/client-manager';
import { oauthConnectionService } from '../lib/mcp/oauth-service';
import { toolsGateway } from '../lib/mcp/tools-gateway';
import { useAuth } from './AuthContext';
import {
  IntegrationProvider,
  IntegrationConnection,
  MCPToolDefinition,
  ToolExecutionEvent,
  CreateConnectionInput,
} from '../lib/mcp/types';

interface IntegrationsContextValue {
  // Providers
  providers: IntegrationProvider[];
  isLoadingProviders: boolean;
  
  // Connections
  connections: IntegrationConnection[];
  isLoadingConnections: boolean;
  
  // Tools
  toolCatalog: MCPToolDefinition[];
  isLoadingTools: boolean;
  
  // Execution History
  executionHistory: ToolExecutionEvent[];
  isLoadingHistory: boolean;
  
  // Actions
  loadProviders: () => Promise<void>;
  loadConnections: () => Promise<void>;
  loadToolCatalog: () => Promise<void>;
  loadExecutionHistory: () => Promise<void>;
  
  createConnection: (input: CreateConnectionInput) => Promise<IntegrationConnection>;
  connectToServer: (connectionId: string) => Promise<void>;
  disconnectFromServer: (connectionId: string) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  
  startOAuthFlow: (connectionId: string, provider: IntegrationProvider) => Promise<string>;
  handleOAuthCallback: (code: string, state: string) => Promise<void>;
  
  refreshTools: (connectionId: string) => Promise<void>;
  setToolEnabled: (toolNamespacedId: string, enabled: boolean) => Promise<void>;
  
  // State
  error: string | null;
  clearError: () => void;
}

const IntegrationsContext = createContext<IntegrationsContextValue | null>(null);

export function IntegrationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [providers, setProviders] = useState<IntegrationProvider[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [toolCatalog, setToolCatalog] = useState<MCPToolDefinition[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ToolExecutionEvent[]>([]);
  
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setIsLoadingProviders(true);
    const { data, error } = await supabase
      .from('integration_providers')
      .select('*')
      .eq('is_enabled', true)
      .order('display_name');

    if (!error && data) {
      setProviders(data as IntegrationProvider[]);
    }
    setIsLoadingProviders(false);
  }, []);

  const loadConnections = useCallback(async () => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setIsLoadingConnections(true);
    const { data, error } = await supabase
      .from('integration_connections')
      .select('*, provider:integration_providers(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConnections(data as IntegrationConnection[]);
    }
    setIsLoadingConnections(false);
  }, [user]);

  const loadToolCatalog = useCallback(async () => {
    if (!user) return;

    setIsLoadingTools(true);
    const tools = await toolsGateway.getToolCatalog(user.id);
    setToolCatalog(tools);
    setIsLoadingTools(false);
  }, [user]);

  const loadExecutionHistory = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    const history = await toolsGateway.getExecutionHistory(user.id, { limit: 50 });
    setExecutionHistory(history);
    setIsLoadingHistory(false);
  }, [user]);

  const createConnection = useCallback(async (input: CreateConnectionInput) => {
    if (!user) throw new Error('Not authenticated');
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('integration_connections')
      .insert({
        user_id: user.id,
        provider_id: input.provider_id,
        workspace_id: input.workspace_id,
        name: input.name,
        description: input.description,
        mcp_endpoint: input.mcp_endpoint,
        status: 'unconfigured',
      })
      .select('*, provider:integration_providers(*)')
      .single();

    if (error) throw new Error(`Failed to create connection: ${error.message}`);

    const connection = data as IntegrationConnection;
    setConnections(prev => [connection, ...prev]);
    return connection;
  }, [user]);

  const connectToServer = useCallback(async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) throw new Error('Connection not found');

    try {
      await mcpClientManager.connect(connection);
      await loadConnections();
      await loadToolCatalog();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Connection failed');
      throw error;
    }
  }, [connections, loadConnections, loadToolCatalog]);

  const disconnectFromServer = useCallback(async (connectionId: string) => {
    await mcpClientManager.disconnect(connectionId);
    await loadConnections();
  }, [loadConnections]);

  const deleteConnection = useCallback(async (connectionId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await mcpClientManager.disconnect(connectionId);
    
    await supabase
      .from('integration_connections')
      .delete()
      .eq('id', connectionId);

    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  const startOAuthFlow = useCallback(async (connectionId: string, provider: IntegrationProvider) => {
    if (!user) throw new Error('Not authenticated');
    
    const authUrl = await oauthConnectionService.startOAuthFlow(
      user.id,
      connectionId,
      provider
    );
    
    return authUrl;
  }, [user]);

  const handleOAuthCallback = useCallback(async (code: string, state: string) => {
    await oauthConnectionService.handleOAuthCallback(code, state);
    await loadConnections();
  }, [loadConnections]);

  const refreshTools = useCallback(async (connectionId: string) => {
    await mcpClientManager.refreshTools(connectionId);
    await loadToolCatalog();
  }, [loadToolCatalog]);

  const setToolEnabled = useCallback(async (toolNamespacedId: string, enabled: boolean) => {
    if (!user) return;
    await toolsGateway.setToolEnabled(user.id, toolNamespacedId, enabled);
    await loadToolCatalog();
  }, [user, loadToolCatalog]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (user) {
      loadProviders();
      loadConnections();
      loadToolCatalog();
      loadExecutionHistory();
    }
  }, [user, loadProviders, loadConnections, loadToolCatalog, loadExecutionHistory]);

  return (
    <IntegrationsContext.Provider value={{
      providers,
      isLoadingProviders,
      connections,
      isLoadingConnections,
      toolCatalog,
      isLoadingTools,
      executionHistory,
      isLoadingHistory,
      loadProviders,
      loadConnections,
      loadToolCatalog,
      loadExecutionHistory,
      createConnection,
      connectToServer,
      disconnectFromServer,
      deleteConnection,
      startOAuthFlow,
      handleOAuthCallback,
      refreshTools,
      setToolEnabled,
      error,
      clearError,
    }}>
      {children}
    </IntegrationsContext.Provider>
  );
}

export function useIntegrations(): IntegrationsContextValue {
  const context = useContext(IntegrationsContext);
  if (!context) {
    throw new Error('useIntegrations must be used within IntegrationsProvider');
  }
  return context;
}
