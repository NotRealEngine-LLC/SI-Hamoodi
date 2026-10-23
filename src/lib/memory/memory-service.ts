// HAMOODI SyntheTech Intelligence — Synthetic Memory Service
// Phase 07: Core memory operations

import { getSupabaseClient } from '../supabase/client';
import {
  MemoryItem,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryScope,
  MemoryType,
  MemoryStatus,
  MemoryError,
  AuthorizationError,
} from './types';

export class SyntheticMemoryService {
  /**
   * Create a new memory item
   */
  async createMemory(userId: string, input: CreateMemoryInput): Promise<MemoryItem> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    // Validate scope permissions
    await this.validateScopePermissions(userId, input.scope, input.workspace_id, input.hub_id, input.project_id);

    const { data, error } = await supabase
      .from('memory_items')
      .insert({
        owner_id: userId,
        workspace_id: input.workspace_id || null,
        hub_id: input.hub_id || null,
        project_id: input.project_id || null,
        conversation_id: input.conversation_id || null,
        scope: input.scope,
        memory_type: input.memory_type,
        title: input.title,
        content: input.content,
        source_type: input.source_type || null,
        source_id: input.source_id || null,
        source_reference: input.source_reference || null,
        capture_method: input.capture_method || 'explicit',
        confidence: input.confidence || 'user_confirmed',
        expires_at: input.expires_at || null,
        status: 'active',
        version: 1,
      })
      .select()
      .single();

    if (error) throw new MemoryError('CREATE_FAILED', `Failed to create memory: ${error.message}`);

    return data as MemoryItem;
  }

  /**
   * Get a memory item by ID
   */
  async getMemory(userId: string, memoryId: string): Promise<MemoryItem | null> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('memory_items')
      .select('*')
      .eq('id', memoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new MemoryError('GET_FAILED', `Failed to get memory: ${error.message}`);
    }

    const memory = data as MemoryItem;

    // Verify access
    if (!await this.hasMemoryAccess(userId, memory)) {
      throw new AuthorizationError();
    }

    // Update last_used_at
    await supabase
      .from('memory_items')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', memoryId);

    return memory;
  }

  /**
   * List memories for a user with optional filters
   */
  async listMemories(
    userId: string,
    filters?: {
      scope?: MemoryScope;
      memory_type?: MemoryType;
      status?: MemoryStatus;
      workspace_id?: string;
      hub_id?: string;
      project_id?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<MemoryItem[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('memory_items')
      .select('*')
      .eq('owner_id', userId)
      .order('updated_at', { ascending: false });

    if (filters?.scope) query = query.eq('scope', filters.scope);
    if (filters?.memory_type) query = query.eq('memory_type', filters.memory_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
    if (filters?.hub_id) query = query.eq('hub_id', filters.hub_id);
    if (filters?.project_id) query = query.eq('project_id', filters.project_id);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;

    if (error) throw new MemoryError('LIST_FAILED', `Failed to list memories: ${error.message}`);

    return (data || []) as MemoryItem[];
  }

  /**
   * Update a memory item
   */
  async updateMemory(userId: string, memoryId: string, updates: UpdateMemoryInput): Promise<MemoryItem> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    // Get current memory
    const current = await this.getMemory(userId, memoryId);
    if (!current) throw new MemoryError('NOT_FOUND', 'Memory not found');

    // Create version record if content changed
    if (updates.content && updates.content !== current.content) {
      await supabase.from('memory_versions').insert({
        memory_id: memoryId,
        version: current.version,
        title: current.title,
        content: current.content,
        changed_by: userId,
        change_reason: 'User edited memory',
      });
    }

    // Update memory
    const { data, error } = await supabase
      .from('memory_items')
      .update({
        ...updates,
        version: current.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId)
      .select()
      .single();

    if (error) throw new MemoryError('UPDATE_FAILED', `Failed to update memory: ${error.message}`);

    return data as MemoryItem;
  }

  /**
   * Delete a memory item (soft delete)
   */
  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    // Verify access
    const memory = await this.getMemory(userId, memoryId);
    if (!memory) throw new MemoryError('NOT_FOUND', 'Memory not found');

    // Soft delete
    const { error } = await supabase
      .from('memory_items')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', memoryId);

    if (error) throw new MemoryError('DELETE_FAILED', `Failed to delete memory: ${error.message}`);
  }

  /**
   * Search memories by content
   */
  async searchMemories(
    userId: string,
    query: string,
    filters?: {
      scope?: MemoryScope;
      memory_type?: MemoryType;
      workspace_id?: string;
      limit?: number;
    }
  ): Promise<MemoryItem[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    let sqlQuery = supabase
      .from('memory_items')
      .select('*')
      .eq('owner_id', userId)
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (filters?.scope) sqlQuery = sqlQuery.eq('scope', filters.scope);
    if (filters?.memory_type) sqlQuery = sqlQuery.eq('memory_type', filters.memory_type);
    if (filters?.workspace_id) sqlQuery = sqlQuery.eq('workspace_id', filters.workspace_id);
    if (filters?.limit) sqlQuery = sqlQuery.limit(filters.limit);

    const { data, error } = await sqlQuery;

    if (error) throw new MemoryError('SEARCH_FAILED', `Failed to search memories: ${error.message}`);

    return (data || []) as MemoryItem[];
  }

  /**
   * Get memory versions
   */
  async getMemoryVersions(userId: string, memoryId: string): Promise<any[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    // Verify access to memory
    const memory = await this.getMemory(userId, memoryId);
    if (!memory) throw new MemoryError('NOT_FOUND', 'Memory not found');

    const { data, error } = await supabase
      .from('memory_versions')
      .select('*')
      .eq('memory_id', memoryId)
      .order('version', { ascending: false });

    if (error) throw new MemoryError('VERSIONS_FAILED', `Failed to get versions: ${error.message}`);

    return data || [];
  }

  /**
   * Validate scope permissions
   */
  private async validateScopePermissions(
    userId: string,
    scope: MemoryScope,
    workspaceId?: string,
    hubId?: string,
    projectId?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    if (scope === 'personal') {
      // No additional validation needed
      return;
    }

    if (scope === 'workspace' && workspaceId) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new AuthorizationError('Not a member of this workspace');
      }
      return;
    }

    if (scope === 'hub' && hubId) {
      const { data: hub } = await supabase
        .from('hubs')
        .select('workspace_id, visibility')
        .eq('id', hubId)
        .single();

      if (!hub) {
        throw new AuthorizationError('Hub not found');
      }

      // Check workspace membership
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', hub.workspace_id)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new AuthorizationError('Not a member of hub workspace');
      }

      // If restricted hub, check hub membership
      if (hub.visibility === 'restricted') {
        const { data: hubMembership } = await supabase
          .from('hub_members')
          .select('id')
          .eq('hub_id', hubId)
          .eq('user_id', userId)
          .single();

        if (!hubMembership) {
          throw new AuthorizationError('Not a member of this restricted hub');
        }
      }
      return;
    }

    if (scope === 'project' && projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single();

      if (!project) {
        throw new AuthorizationError('Project not found');
      }

      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', project.workspace_id)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        throw new AuthorizationError('Not a member of project workspace');
      }
      return;
    }
  }

  /**
   * Check if user has access to a memory
   */
  private async hasMemoryAccess(userId: string, memory: MemoryItem): Promise<boolean> {
    // Owner always has access
    if (memory.owner_id === userId) return true;

    // Check scope-based access
    if (memory.scope === 'personal') return false;

    const supabase = getSupabaseClient();
    if (!supabase) return false;

    if (memory.scope === 'workspace' && memory.workspace_id) {
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', memory.workspace_id)
        .eq('user_id', userId)
        .single();

      return !!membership;
    }

    // TODO: Implement hub and project access checks

    return false;
  }
}

export const memoryService = new SyntheticMemoryService();
