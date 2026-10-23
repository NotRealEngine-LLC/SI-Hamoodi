// HAMOODI SyntheTech Intelligence — Agent Service
// Phase 10: Custom Agent Management & Execution

import { getSupabaseClient } from '../supabase/client';
import { siIntelligenceService } from '../intelligence/service';
import {
  CustomAgent,
  AgentVersion,
  CreateAgentInput,
  UpdateAgentInput,
  AgentError,
  AgentNotFoundError,
} from './types';

export class AgentService {
  /**
   * Create a new custom agent
   */
  async createAgent(userId: string, input: CreateAgentInput): Promise<CustomAgent> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new AgentError('NO_SUPABASE', 'Supabase not configured');

    // Validate input
    this.validateAgentInput(input);

    const { data, error } = await supabase
      .from('custom_agents')
      .insert({
        workspace_id: input.workspace_id,
        owner_id: userId,
        name: input.name,
        description: input.description || null,
        icon: input.icon || null,
        color: input.color || null,
        category: input.category || null,
        instructions: input.instructions,
        model_policy: input.model_policy || { mode: 'auto' },
        skill_ids: input.skill_ids || [],
        allowed_tool_ids: input.allowed_tool_ids || [],
        knowledge_scope: input.knowledge_scope || [],
        max_iterations: input.max_iterations || 10,
        max_model_calls: input.max_model_calls || 20,
        max_tool_calls: input.max_tool_calls || 25,
        requires_approval_for_writes: input.requires_approval_for_writes ?? true,
        status: 'draft',
        current_version: 1,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw new AgentError('CREATE_FAILED', `Failed to create agent: ${error.message}`);

    const agent = data as CustomAgent;

    // Create initial version
    await this.createVersion(userId, agent.id, 1, agent, 'Initial version');

    return agent;
  }

  /**
   * Get an agent by ID
   */
  async getAgent(userId: string, agentId: string): Promise<CustomAgent | null> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new AgentError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('custom_agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AgentError('GET_FAILED', `Failed to get agent: ${error.message}`);
    }

    return data as CustomAgent;
  }

  /**
   * List agents with filters
   */
  async listAgents(
    userId: string,
    filters?: {
      workspace_id?: string;
      status?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<CustomAgent[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new AgentError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('custom_agents')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters?.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;

    if (error) throw new AgentError('LIST_FAILED', `Failed to list agents: ${error.message}`);

    return (data || []) as CustomAgent[];
  }

  /**
   * Update an agent
   */
  async updateAgent(
    userId: string,
    agentId: string,
    updates: UpdateAgentInput
  ): Promise<CustomAgent> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new AgentError('NO_SUPABASE', 'Supabase not configured');

    const current = await this.getAgent(userId, agentId);
    if (!current) throw new AgentNotFoundError(agentId);

    const newVersion = current.current_version + 1;

    // Update agent
    const { data, error } = await supabase
      .from('custom_agents')
      .update({
        name: updates.name,
        description: updates.description,
        icon: updates.icon,
        color: updates.color,
        category: updates.category,
        instructions: updates.instructions,
        model_policy: updates.model_policy,
        skill_ids: updates.skill_ids,
        allowed_tool_ids: updates.allowed_tool_ids,
        knowledge_scope: updates.knowledge_scope,
        max_iterations: updates.max_iterations,
        max_model_calls: updates.max_model_calls,
        max_tool_calls: updates.max_tool_calls,
        requires_approval_for_writes: updates.requires_approval_for_writes,
        status: updates.status,
        current_version: newVersion,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
        archived_at: updates.status === 'archived' ? new Date().toISOString() : null,
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw new AgentError('UPDATE_FAILED', `Failed to update agent: ${error.message}`);

    const agent = data as CustomAgent;

    // Create new version
    await this.createVersion(userId, agentId, newVersion, agent, updates.change_summary);

    return agent;
  }

  /**
   * Delete an agent (soft delete via archive)
   */
  async deleteAgent(userId: string, agentId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new AgentError('NO_SUPABASE', 'Supabase not configured');

    const { error } = await supabase
      .from('custom_agents')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (error) throw new AgentError('DELETE_FAILED', `Failed to delete agent: ${error.message}`);
  }

  /**
   * Get agent versions
   */
  async getVersions(agentId: string): Promise<AgentVersion[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new AgentError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('agent_id', agentId)
      .order('version_number', { ascending: false });

    if (error) throw new AgentError('VERSIONS_FAILED', `Failed to get versions: ${error.message}`);

    return (data || []) as AgentVersion[];
  }

  /**
   * Get a specific agent version
   */
  async getVersion(agentId: string, versionNumber: number): Promise<AgentVersion | null> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new AgentError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('agent_versions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('version_number', versionNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new AgentError('VERSION_FAILED', `Failed to get version: ${error.message}`);
    }

    return data as AgentVersion;
  }

  /**
   * Restore an agent to a previous version
   */
  async restoreVersion(userId: string, agentId: string, versionNumber: number): Promise<CustomAgent> {
    const version = await this.getVersion(agentId, versionNumber);
    if (!version) throw new AgentError('VERSION_NOT_FOUND', `Version ${versionNumber} not found`);

    return this.updateAgent(userId, agentId, {
      ...version.configuration,
      instructions: version.instructions,
      model_policy: version.model_policy,
      skill_ids: version.skill_ids,
      allowed_tool_ids: version.allowed_tool_ids,
      change_summary: `Restored from version ${versionNumber}`,
    });
  }

  /**
   * Test an agent with a sample task
   */
  async testAgent(
    userId: string,
    agentId: string,
    task: string,
    options?: {
      mode?: 'safe_preview' | 'connected_test' | 'controlled_write';
    }
  ): Promise<any> {
    const agent = await this.getAgent(userId, agentId);
    if (!agent) throw new AgentNotFoundError(agentId);

    if (agent.status !== 'active' && agent.status !== 'draft') {
      throw new AgentError('AGENT_NOT_TESTABLE', 'Agent must be active or draft to test');
    }

    // Build context with agent instructions
    const systemPrompt = this.buildAgentPrompt(agent);

    // Execute through intelligence service
    const result = await siIntelligenceService.generate(
      {
        workspaceId: agent.workspace_id,
      },
      userId,
      task,
      agent.model_policy.modelId || 'gpt-4o-mini',
      undefined, // preset
      undefined // signal
    );

    return {
      agentId: agent.id,
      agentVersion: agent.current_version,
      task,
      result: result.content,
      modelUsed: result.modelId,
      tokenUsage: result.tokenUsage,
      durationMs: result.durationMs,
    };
  }

  /**
   * Execute an agent for a real task
   */
  async executeAgent(
    userId: string,
    agentId: string,
    task: string,
    context?: {
      workspaceId?: string;
      hubId?: string;
      projectId?: string;
    }
  ): Promise<any> {
    const agent = await this.getAgent(userId, agentId);
    if (!agent) throw new AgentNotFoundError(agentId);

    if (agent.status !== 'active') {
      throw new AgentError('AGENT_NOT_ACTIVE', 'Agent must be active to execute');
    }

    // Build context with agent instructions and skills
    const systemPrompt = await this.buildFullAgentPrompt(agent);

    // Execute through intelligence service
    const result = await siIntelligenceService.generate(
      {
        workspaceId: context?.workspaceId || agent.workspace_id,
        hubId: context?.hubId,
        projectId: context?.projectId,
      },
      userId,
      task,
      agent.model_policy.modelId || 'gpt-4o-mini',
      undefined,
      undefined
    );

    return {
      agentId: agent.id,
      agentVersion: agent.current_version,
      task,
      result: result.content,
      modelUsed: result.modelId,
      tokenUsage: result.tokenUsage,
      durationMs: result.durationMs,
    };
  }

  /**
   * Create a version snapshot
   */
  private async createVersion(
    userId: string,
    agentId: string,
    versionNumber: number,
    agent: CustomAgent,
    changeSummary?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('agent_versions').insert({
      agent_id: agentId,
      version_number: versionNumber,
      configuration: {
        name: agent.name,
        description: agent.description,
        icon: agent.icon,
        color: agent.color,
        category: agent.category,
        max_iterations: agent.max_iterations,
        max_model_calls: agent.max_model_calls,
        max_tool_calls: agent.max_tool_calls,
        requires_approval_for_writes: agent.requires_approval_for_writes,
        status: agent.status,
        metadata: agent.metadata,
      },
      instructions: agent.instructions,
      model_policy: agent.model_policy,
      skill_ids: agent.skill_ids,
      allowed_tool_ids: agent.allowed_tool_ids,
      change_summary: changeSummary,
      created_by: userId,
    });
  }

  /**
   * Build agent system prompt
   */
  private buildAgentPrompt(agent: CustomAgent): string {
    const parts: string[] = [];

    parts.push(`You are ${agent.name}, a specialized AI agent.`);
    if (agent.description) {
      parts.push(agent.description);
    }
    parts.push('');
    parts.push('## Instructions');
    parts.push(agent.instructions);
    parts.push('');

    return parts.join('\n');
  }

  /**
   * Build full agent prompt with skills and knowledge
   */
  private async buildFullAgentPrompt(agent: CustomAgent): Promise<string> {
    const parts: string[] = [];

    parts.push(`You are ${agent.name}, a specialized AI agent.`);
    if (agent.description) {
      parts.push(agent.description);
    }
    parts.push('');

    // Add agent instructions
    parts.push('## Instructions');
    parts.push(agent.instructions);
    parts.push('');

    // Add skill instructions
    if (agent.skill_ids.length > 0) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: skills } = await supabase
          .from('agent_skills')
          .select('name, instructions')
          .in('id', agent.skill_ids);

        if (skills && skills.length > 0) {
          parts.push('## Skills');
          skills.forEach((skill: any) => {
            parts.push(`### ${skill.name}`);
            parts.push(skill.instructions);
            parts.push('');
          });
        }
      }
    }

    // Add budget constraints
    parts.push('## Constraints');
    parts.push(`- Maximum iterations: ${agent.max_iterations}`);
    parts.push(`- Maximum model calls: ${agent.max_model_calls}`);
    parts.push(`- Maximum tool calls: ${agent.max_tool_calls}`);
    if (agent.requires_approval_for_writes) {
      parts.push('- Write operations require user approval');
    }
    parts.push('');

    return parts.join('\n');
  }

  /**
   * Validate agent input
   */
  private validateAgentInput(input: CreateAgentInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new AgentError('INVALID_NAME', 'Agent name is required');
    }

    if (input.name.length > 200) {
      throw new AgentError('NAME_TOO_LONG', 'Agent name must be 200 characters or less');
    }

    if (!input.instructions || input.instructions.trim().length === 0) {
      throw new AgentError('INVALID_INSTRUCTIONS', 'Agent instructions are required');
    }

    if (input.max_iterations && input.max_iterations < 1) {
      throw new AgentError('INVALID_ITERATIONS', 'Max iterations must be at least 1');
    }

    if (input.max_model_calls && input.max_model_calls < 1) {
      throw new AgentError('INVALID_MODEL_CALLS', 'Max model calls must be at least 1');
    }

    if (input.max_tool_calls && input.max_tool_calls < 0) {
      throw new AgentError('INVALID_TOOL_CALLS', 'Max tool calls must be at least 0');
    }
  }

  /**
   * Duplicate an agent
   */
  async duplicateAgent(userId: string, agentId: string, newName?: string): Promise<CustomAgent> {
    const agent = await this.getAgent(userId, agentId);
    if (!agent) throw new AgentNotFoundError(agentId);

    return this.createAgent(userId, {
      workspace_id: agent.workspace_id,
      name: newName || `${agent.name} (Copy)`,
      description: agent.description,
      icon: agent.icon,
      color: agent.color,
      category: agent.category,
      instructions: agent.instructions,
      model_policy: agent.model_policy,
      skill_ids: agent.skill_ids,
      allowed_tool_ids: agent.allowed_tool_ids,
      knowledge_scope: agent.knowledge_scope,
      max_iterations: agent.max_iterations,
      max_model_calls: agent.max_model_calls,
      max_tool_calls: agent.max_tool_calls,
      requires_approval_for_writes: agent.requires_approval_for_writes,
      metadata: agent.metadata,
    });
  }
}

export const agentService = new AgentService();
