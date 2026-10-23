// HAMOODI SyntheTech Intelligence — Tools Gateway
// Phase 08: Central tool execution gateway with security

import { getSupabaseClient } from '../supabase/client';
import { mcpClientManager } from './client-manager';
import {
  MCPToolDefinition,
  ToolPermission,
  ToolExecutionEvent,
  ToolInvocationRequest,
  ToolInvocationResult,
  ToolRiskLevel,
  ToolExecutionStatus,
  ToolNotFoundError,
  PermissionDeniedError,
  ValidationError,
} from './types';

export class SIToolsGateway {
  /**
   * Execute a tool with full security checks
   */
  async executeTool(request: ToolInvocationRequest): Promise<ToolInvocationResult> {
    const startTime = Date.now();
    const executionId = crypto.randomUUID();

    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Lookup tool
      const tool = await this.lookupTool(request.toolNamespacedId);
      if (!tool) {
        throw new ToolNotFoundError(request.toolNamespacedId);
      }

      // 3. Check permissions
      await this.checkPermissions(request.context.userId, request.toolNamespacedId, tool.risk_level);

      // 4. Validate input schema
      this.validateInput(tool.input_schema, request.input);

      // 5. Check if approval is required
      const requiresApproval = await this.requiresApproval(
        request.context.userId,
        request.toolNamespacedId,
        tool.risk_level
      );

      if (requiresApproval) {
        // Create pending execution event
        await this.createExecutionEvent({
          id: executionId,
          user_id: request.context.userId,
          workspace_id: request.context.workspaceId,
          tool_namespaced_id: request.toolNamespacedId,
          run_id: request.context.runId,
          task_id: request.context.taskId,
          status: 'awaiting_approval',
          risk_level: tool.risk_level,
          input_hash: await this.hashInput(request.input),
          input_redacted: this.redactInput(request.input, tool.risk_level),
          created_at: new Date().toISOString(),
        });

        return {
          success: false,
          error: {
            code: 'APPROVAL_REQUIRED',
            message: 'Tool execution requires approval',
            retryable: false,
          },
          durationMs: Date.now() - startTime,
          executionId,
        };
      }

      // 6. Execute tool
      await this.updateExecutionStatus(executionId, 'running');

      const connectionId = this.extractConnectionId(request.toolNamespacedId);
      const toolName = this.extractToolName(request.toolNamespacedId);

      const output = await mcpClientManager.invokeTool(
        connectionId,
        toolName,
        request.input
      );

      // 7. Validate output
      if (tool.output_schema) {
        this.validateOutput(tool.output_schema, output);
      }

      // 8. Record execution
      await this.createExecutionEvent({
        id: executionId,
        user_id: request.context.userId,
        workspace_id: request.context.workspaceId,
        connection_id: connectionId,
        tool_namespaced_id: request.toolNamespacedId,
        run_id: request.context.runId,
        task_id: request.context.taskId,
        status: 'completed',
        risk_level: tool.risk_level,
        input_hash: await this.hashInput(request.input),
        input_redacted: this.redactInput(request.input, tool.risk_level),
        output_summary: this.summarizeOutput(output),
        output_size_bytes: JSON.stringify(output).length,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        created_at: new Date().toISOString(),
      });

      return {
        success: true,
        output,
        durationMs: Date.now() - startTime,
        executionId,
      };
    } catch (error) {
      // Record failure
      await this.createExecutionEvent({
        id: executionId,
        user_id: request.context.userId,
        workspace_id: request.context.workspaceId,
        tool_namespaced_id: request.toolNamespacedId,
        run_id: request.context.runId,
        task_id: request.context.taskId,
        status: 'failed',
        risk_level: 'read', // Default if tool lookup failed
        input_hash: await this.hashInput(request.input),
        error_code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        created_at: new Date().toISOString(),
      });

      return {
        success: false,
        error: {
          code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: error instanceof Error && 'retryable' in error ? (error as any).retryable : false,
        },
        durationMs: Date.now() - startTime,
        executionId,
      };
    }
  }

  /**
   * Get tool catalog for a user/workspace
   */
  async getToolCatalog(
    userId: string,
    workspaceId?: string
  ): Promise<MCPToolDefinition[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    // Get all connected MCP servers for user/workspace
    let query = supabase
      .from('mcp_tool_definitions')
      .select(`
        *,
        server:mcp_servers!inner(
          *,
          connection:integration_connections!inner(*)
        )
      `)
      .eq('server.connection.user_id', userId)
      .eq('is_enabled', true);

    if (workspaceId) {
      query = query.or(`server.connection.workspace_id.eq.${workspaceId},server.connection.workspace_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch tool catalog:', error);
      return [];
    }

    return (data || []) as MCPToolDefinition[];
  }

  /**
   * Get tool execution history
   */
  async getExecutionHistory(
    userId: string,
    options?: {
      workspaceId?: string;
      toolNamespacedId?: string;
      limit?: number;
    }
  ): Promise<ToolExecutionEvent[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    let query = supabase
      .from('tool_execution_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.workspaceId) {
      query = query.eq('workspace_id', options.workspaceId);
    }

    if (options?.toolNamespacedId) {
      query = query.eq('tool_namespaced_id', options.toolNamespacedId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    } else {
      query = query.limit(100);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch execution history:', error);
      return [];
    }

    return (data || []) as ToolExecutionEvent[];
  }

  /**
   * Enable/disable a tool
   */
  async setToolEnabled(
    userId: string,
    toolNamespacedId: string,
    enabled: boolean
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('mcp_tool_definitions')
      .update({
        is_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('namespaced_id', toolNamespacedId);
  }

  /**
   * Set tool permission
   */
  async setToolPermission(
    userId: string,
    toolNamespacedId: string,
    enabled: boolean,
    requiresApproval: boolean
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('tool_permissions')
      .upsert({
        user_id: userId,
        tool_namespaced_id: toolNamespacedId,
        is_enabled: enabled,
        requires_approval: requiresApproval,
        granted_by: userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,tool_namespaced_id'
      });
  }

  /**
   * Validate request
   */
  private validateRequest(request: ToolInvocationRequest): void {
    if (!request.toolNamespacedId) {
      throw new ValidationError('Tool ID is required');
    }

    if (!request.context.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!request.input || typeof request.input !== 'object') {
      throw new ValidationError('Input must be an object');
    }
  }

  /**
   * Lookup tool definition
   */
  private async lookupTool(toolNamespacedId: string): Promise<MCPToolDefinition | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('mcp_tool_definitions')
      .select('*')
      .eq('namespaced_id', toolNamespacedId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as MCPToolDefinition;
  }

  /**
   * Check permissions
   */
  private async checkPermissions(
    userId: string,
    toolNamespacedId: string,
    riskLevel: ToolRiskLevel
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new PermissionDeniedError();

    // Check if user has explicit permission
    const { data: permission } = await supabase
      .from('tool_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('tool_namespaced_id', toolNamespacedId)
      .single();

    if (permission && !permission.is_enabled) {
      throw new PermissionDeniedError('Tool is disabled for this user');
    }

    // High-risk tools require explicit permission
    if (riskLevel === 'high_risk' && !permission) {
      throw new PermissionDeniedError('High-risk tools require explicit permission');
    }
  }

  /**
   * Check if approval is required
   */
  private async requiresApproval(
    userId: string,
    toolNamespacedId: string,
    riskLevel: ToolRiskLevel
  ): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    // Sensitive and high-risk tools always require approval
    if (riskLevel === 'sensitive' || riskLevel === 'high_risk') {
      return true;
    }

    // Check if user has configured approval requirement
    const { data: permission } = await supabase
      .from('tool_permissions')
      .select('requires_approval')
      .eq('user_id', userId)
      .eq('tool_namespaced_id', toolNamespacedId)
      .single();

    return permission?.requires_approval || false;
  }

  /**
   * Validate input against schema
   */
  private validateInput(schema: Record<string, any>, input: Record<string, any>): void {
    // In production, use a JSON Schema validator like Ajv
    // For now, basic validation

    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in input)) {
          throw new ValidationError(`Missing required field: ${field}`);
        }
      }
    }

    if (schema.properties) {
      for (const [key, value] of Object.entries(input)) {
        const propSchema = schema.properties[key];
        if (propSchema && propSchema.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== propSchema.type) {
            throw new ValidationError(`Invalid type for field ${key}: expected ${propSchema.type}, got ${actualType}`);
          }
        }
      }
    }
  }

  /**
   * Validate output against schema
   */
  private validateOutput(schema: Record<string, any>, output: any): void {
    // In production, validate output against schema
    // For now, just ensure output exists
    if (output === undefined || output === null) {
      throw new ValidationError('Tool returned no output');
    }
  }

  /**
   * Hash input for deduplication
   */
  private async hashInput(input: Record<string, any>): Promise<string> {
    const json = JSON.stringify(input);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Redact sensitive input fields
   */
  private redactInput(input: Record<string, any>, riskLevel: ToolRiskLevel): Record<string, any> {
    if (riskLevel === 'read') {
      return input;
    }

    // Redact sensitive fields
    const redacted = { ...input };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];

    for (const field of sensitiveFields) {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    }

    return redacted;
  }

  /**
   * Summarize output for storage
   */
  private summarizeOutput(output: any): string {
    const json = JSON.stringify(output);
    if (json.length <= 500) {
      return json;
    }
    return json.substring(0, 500) + '...';
  }

  /**
   * Extract connection ID from namespaced tool ID
   */
  private extractConnectionId(namespacedId: string): string {
    const parts = namespacedId.split(':');
    if (parts.length < 2) {
      throw new ValidationError('Invalid namespaced tool ID');
    }
    return parts[0];
  }

  /**
   * Extract tool name from namespaced tool ID
   */
  private extractToolName(namespacedId: string): string {
    const parts = namespacedId.split(':');
    if (parts.length < 2) {
      throw new ValidationError('Invalid namespaced tool ID');
    }
    return parts.slice(1).join(':');
  }

  /**
   * Create execution event
   */
  private async createExecutionEvent(event: ToolExecutionEvent): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('tool_execution_events')
      .insert(event);
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(executionId: string, status: ToolExecutionStatus): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase
      .from('tool_execution_events')
      .update({
        status,
        started_at: status === 'running' ? new Date().toISOString() : undefined,
      })
      .eq('id', executionId);
  }
}

export const toolsGateway = new SIToolsGateway();
