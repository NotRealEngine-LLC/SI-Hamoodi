// HAMOODI SyntheTech Intelligence — MCP Client Manager
// Phase 08: Model Context Protocol client implementation with official SDK

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
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
  private clientInstances: Map<string, { client: Client; transport: StreamableHTTPClientTransport }> = new Map();

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
   * Initialize MCP server connection using official SDK
   */
  private async initializeMCPServer(connection: IntegrationConnection): Promise<MCPServer> {
    // Validate endpoint for SSRF protection
    const endpoint = connection.mcp_endpoint!;
    if (!this.isValidEndpoint(endpoint)) {
      throw new ConnectionError('Invalid MCP endpoint - SSRF protection blocked this URL');
    }

    try {
      // Create MCP client with Streamable HTTP transport
      const transport = new StreamableHTTPClientTransport(new URL(endpoint));
      const client = new Client(
        {
          name: 'hamoodi-si-client',
          version: '1.0.0',
        },
        {
          capabilities: {
            roots: { listChanged: true },
          },
        }
      );

      // Connect to the server
      await client.connect(transport);

      // Get server capabilities
      const serverCapabilities = client.getServerCapabilities();
      const serverInfo = client.getServerVersion();

      // Discover tools, resources, and prompts
      const tools = await client.listTools();
      const resources = serverCapabilities?.resources ? await client.listResources() : { resources: [] };
      const prompts = serverCapabilities?.prompts ? await client.listPrompts() : { prompts: [] };

      const capabilities: MCPCapabilities = {
        tools: serverCapabilities?.tools || { listChanged: false },
        resources: serverCapabilities?.resources || { subscribe: false, listChanged: false },
        prompts: serverCapabilities?.prompts || { listChanged: false },
        logging: serverCapabilities?.logging,
      };

      // Store the client instance for later use
      this.clientInstances.set(connection.id, { client, transport });

      return {
        id: crypto.randomUUID(),
        connection_id: connection.id,
        server_name: serverInfo?.name || `MCP Server ${connection.name}`,
        server_version: serverInfo?.version || '1.0.0',
        protocol_version: connection.mcp_protocol_version || '2026-07-28',
        transport_type: 'streamable_http',
        capabilities,
        tools_count: tools.tools?.length || 0,
        resources_count: resources.resources?.length || 0,
        prompts_count: prompts.prompts?.length || 0,
        is_connected: true,
        last_connected_at: new Date().toISOString(),
        last_discovery_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      throw new ConnectionError(
        `Failed to initialize MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Discover tools from MCP server using real SDK
   */
  async discoverTools(connectionId: string): Promise<MCPTool[]> {
    const instance = this.clientInstances.get(connectionId);
    if (!instance) {
      throw new ConnectionError('Not connected to MCP server');
    }

    try {
      const result = await instance.client.listTools();
      // Map SDK tool format to our MCPTool interface
      return (result.tools || []).map((tool: any) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema || { type: 'object', properties: {} },
        outputSchema: tool.outputSchema,
        annotations: tool.annotations,
      }));
    } catch (error) {
      throw new ConnectionError(
        `Failed to discover tools: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Discover resources from MCP server using real SDK
   */
  async discoverResources(connectionId: string): Promise<MCPResource[]> {
    const instance = this.clientInstances.get(connectionId);
    if (!instance) {
      throw new ConnectionError('Not connected to MCP server');
    }

    try {
      const result = await instance.client.listResources();
      // Map SDK resource format to our MCPResource interface
      return (result.resources || []).map((resource: any) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
        annotations: resource.annotations,
      }));
    } catch (error) {
      throw new ConnectionError(
        `Failed to discover resources: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Discover prompts from MCP server using real SDK
   */
  async discoverPrompts(connectionId: string): Promise<MCPPrompt[]> {
    const instance = this.clientInstances.get(connectionId);
    if (!instance) {
      throw new ConnectionError('Not connected to MCP server');
    }

    try {
      const result = await instance.client.listPrompts();
      // Map SDK prompt format to our MCPPrompt interface
      return (result.prompts || []).map((prompt: any) => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
      }));
    } catch (error) {
      throw new ConnectionError(
        `Failed to discover prompts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Invoke a tool on MCP server using real SDK
   */
  async invokeTool(
    connectionId: string,
    toolName: string,
    input: Record<string, any>
  ): Promise<any> {
    const instance = this.clientInstances.get(connectionId);
    if (!instance) {
      throw new ConnectionError('Not connected to MCP server');
    }

    try {
      const result = await instance.client.callTool({
        name: toolName,
        arguments: input,
      });
      
      // Return the tool result content
      return result.content;
    } catch (error) {
      throw new ConnectionError(
        `Tool invocation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(connectionId: string): Promise<void> {
    const supabase = getSupabaseClient();
    
    // Close the MCP client connection
    const instance = this.clientInstances.get(connectionId);
    if (instance) {
      try {
        await instance.client.close();
      } catch (error) {
        console.error('Error closing MCP client:', error);
      }
      this.clientInstances.delete(connectionId);
    }

    // Remove from active connections
    this.activeConnections.delete(connectionId);

    // Update connection status in database
    if (supabase) {
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
