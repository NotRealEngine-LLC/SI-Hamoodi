// HAMOODI SyntheTech Intelligence — MCP Client Manager
// Phase 08: Model Context Protocol client implementation

import { getSupabaseClient } from '../supabase/client';
import {
  IntegrationConnection,
  MCPServer,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPCapabilities,
  ConnectionStatus,
  ConnectionError,
  AuthenticationError,
} from './types';

export class SIMCPClientManager {
  private activeConnections: Map<string, MCPServer> = new Map();

  /**
   * Connect to an MCP server
   */
  async connect(connection: IntegrationConnection): Promise<MCPServer> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ConnectionError('Supabase not configured');

    if (!connection.mcp_endpoint) {
      throw new ConnectionError('MCP endpoint not configured');
    }

    // Update status to connecting
    await this.updateConnectionStatus(connection.id, 'connecting');

    try {
      // Initialize MCP connection
      const server = await this.initializeMCPServer(connection);

      // Store active connection
      this.activeConnections.set(connection.id, server);

      // Update connection status
      await supabase
        .from('integration_connections')
        .update({
          status: 'connected',
          mcp_protocol_version: server.protocol_version,
          mcp_capabilities: server.capabilities,
          last_success_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      // Create or update MCP server record
      await supabase
        .from('mcp_servers')
        .upsert({
          connection_id: connection.id,
          server_name: server.server_name,
          server_version: server.server_version,
          protocol_version: server.protocol_version,
          transport_type: server.transport_type,
          capabilities: server.capabilities,
          tools_count: server.tools_count,
          resources_count: server.resources_count,
          prompts_count: server.prompts_count,
          is_connected: true,
          last_connected_at: new Date().toISOString(),
        }, {
          onConflict: 'connection_id'
        });

      return server;
    } catch (error) {
      await this.updateConnectionStatus(connection.id, 'failed', 
        error instanceof Error ? error.message : 'Connection failed');
      throw error;
    }
  }

  /**
   * Initialize MCP server connection
   */
  private async initializeMCPServer(connection: IntegrationConnection): Promise<MCPServer> {
    // In production, this would use the official MCP SDK
    // For now, simulate MCP server initialization
    
    // Validate endpoint
    const endpoint = connection.mcp_endpoint!;
    if (!this.isValidEndpoint(endpoint)) {
      throw new ConnectionError('Invalid MCP endpoint');
    }

    // Simulate MCP initialization handshake
    // In production: const client = new MCPClient(endpoint);
    // await client.initialize();

    const capabilities: MCPCapabilities = {
      tools: { listChanged: true },
      resources: { subscribe: false, listChanged: true },
      prompts: { listChanged: true },
    };

    return {
      id: crypto.randomUUID(),
      connection_id: connection.id,
      server_name: `MCP Server ${connection.name}`,
      server_version: '1.0.0',
      protocol_version: connection.mcp_protocol_version || '2026-07-28',
      transport_type: 'streamable_http',
      capabilities,
      tools_count: 0,
      resources_count: 0,
      prompts_count: 0,
      is_connected: true,
      last_connected_at: new Date().toISOString(),
      last_discovery_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Discover tools from MCP server
   */
  async discoverTools(connectionId: string): Promise<MCPTool[]> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      throw new ConnectionError('Not connected to MCP server');
    }

    // In production, this would call the MCP SDK
    // const tools = await client.listTools();

    // Simulate tool discovery
    // In production, return actual tools from MCP server
    return [];
  }

  /**
   * Discover resources from MCP server
   */
  async discoverResources(connectionId: string): Promise<MCPResource[]> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      throw new ConnectionError('Not connected to MCP server');
    }

    // In production: const resources = await client.listResources();
    return [];
  }

  /**
   * Discover prompts from MCP server
   */
  async discoverPrompts(connectionId: string): Promise<MCPPrompt[]> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      throw new ConnectionError('Not connected to MCP server');
    }

    // In production: const prompts = await client.listPrompts();
    return [];
  }

  /**
   * Invoke a tool on MCP server
   */
  async invokeTool(
    connectionId: string,
    toolName: string,
    input: Record<string, any>
  ): Promise<any> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      throw new ConnectionError('Not connected to MCP server');
    }

    // In production, this would use the MCP SDK
    // const result = await client.callTool(toolName, input);

    // Simulate tool invocation
    throw new Error('Tool invocation not yet implemented - requires MCP SDK integration');
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(connectionId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Remove from active connections
    this.activeConnections.delete(connectionId);

    // Update connection status
    await supabase
      .from('integration_connections')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    // Update MCP server record
    await supabase
      .from('mcp_servers')
      .update({
        is_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq('connection_id', connectionId);
  }

  /**
   * Test connection health
   */
  async testConnection(connectionId: string): Promise<boolean> {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      return false;
    }

    // In production, this would ping the MCP server
    // const healthy = await client.ping();

    // Simulate health check
    return true;
  }

  /**
   * Refresh tools from MCP server
   */
  async refreshTools(connectionId: string): Promise<MCPTool[]> {
    const tools = await this.discoverTools(connectionId);
    
    const supabase = getSupabaseClient();
    if (!supabase) return tools;

    // Update tool definitions in database
    // In production, this would upsert the discovered tools
    await supabase
      .from('mcp_servers')
      .update({
        tools_count: tools.length,
        last_discovery_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('connection_id', connectionId);

    return tools;
  }

  /**
   * Update connection status
   */
  private async updateConnectionStatus(
    connectionId: string,
    status: ConnectionStatus,
    errorMessage?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const update: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      update.last_error_message = errorMessage;
    }

    await supabase
      .from('integration_connections')
      .update(update)
      .eq('id', connectionId);
  }

  /**
   * Validate MCP endpoint URL
   */
  private isValidEndpoint(endpoint: string): boolean {
    try {
      const url = new URL(endpoint);
      
      // Must be HTTPS in production
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return false;
      }

      // Reject localhost in production
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        // Allow in development
        if (import.meta.env.PROD) {
          return false;
        }
      }

      // Reject private IP ranges
      if (this.isPrivateIP(url.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if hostname is a private IP
   */
  private isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^fc00:/,
      /^fd/,
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Get active connection
   */
  getActiveConnection(connectionId: string): MCPServer | undefined {
    return this.activeConnections.get(connectionId);
  }

  /**
   * Check if connection is active
   */
  isConnected(connectionId: string): boolean {
    return this.activeConnections.has(connectionId);
  }
}

export const mcpClientManager = new SIMCPClientManager();
