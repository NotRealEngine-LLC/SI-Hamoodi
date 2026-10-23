// HAMOODI SyntheTech Intelligence — Skill Service
// Phase 10: Agent Skills Management

import { getSupabaseClient } from '../supabase/client';
import {
  AgentSkill,
  SkillVersion,
  CreateSkillInput,
  UpdateSkillInput,
  SkillError,
  SkillNotFoundError,
} from './types';

export class SkillService {
  /**
   * Create a new skill
   */
  async createSkill(userId: string, input: CreateSkillInput): Promise<AgentSkill> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new SkillError('NO_SUPABASE', 'Supabase not configured');

    // Validate input
    this.validateSkillInput(input);

    const { data, error } = await supabase
      .from('agent_skills')
      .insert({
        workspace_id: input.workspace_id || null,
        owner_id: userId,
        name: input.name,
        description: input.description || null,
        category: input.category || null,
        instructions: input.instructions,
        manifest: input.manifest,
        resource_files: input.resource_files || [],
        requested_capabilities: input.requested_capabilities || [],
        status: 'draft',
        current_version: 1,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw new SkillError('CREATE_FAILED', `Failed to create skill: ${error.message}`);

    const skill = data as AgentSkill;

    // Create initial version
    await this.createVersion(userId, skill.id, 1, skill, 'Initial version');

    return skill;
  }

  /**
   * Get a skill by ID
   */
  async getSkill(userId: string, skillId: string): Promise<AgentSkill | null> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new SkillError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('agent_skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new SkillError('GET_FAILED', `Failed to get skill: ${error.message}`);
    }

    return data as AgentSkill;
  }

  /**
   * List skills with filters
   */
  async listSkills(
    userId: string,
    filters?: {
      workspace_id?: string;
      status?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AgentSkill[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new SkillError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('agent_skills')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters?.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;

    if (error) throw new SkillError('LIST_FAILED', `Failed to list skills: ${error.message}`);

    return (data || []) as AgentSkill[];
  }

  /**
   * Update a skill
   */
  async updateSkill(
    userId: string,
    skillId: string,
    updates: UpdateSkillInput
  ): Promise<AgentSkill> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new SkillError('NO_SUPABASE', 'Supabase not configured');

    const current = await this.getSkill(userId, skillId);
    if (!current) throw new SkillNotFoundError(skillId);

    const newVersion = current.current_version + 1;

    // Update skill
    const { data, error } = await supabase
      .from('agent_skills')
      .update({
        name: updates.name,
        description: updates.description,
        category: updates.category,
        instructions: updates.instructions,
        manifest: updates.manifest,
        resource_files: updates.resource_files,
        requested_capabilities: updates.requested_capabilities,
        status: updates.status,
        current_version: newVersion,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', skillId)
      .select()
      .single();

    if (error) throw new SkillError('UPDATE_FAILED', `Failed to update skill: ${error.message}`);

    const skill = data as AgentSkill;

    // Create new version
    await this.createVersion(userId, skillId, newVersion, skill, updates.change_summary);

    return skill;
  }

  /**
   * Delete a skill (soft delete via archive)
   */
  async deleteSkill(userId: string, skillId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new SkillError('NO_SUPABASE', 'Supabase not configured');

    const { error } = await supabase
      .from('agent_skills')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', skillId);

    if (error) throw new SkillError('DELETE_FAILED', `Failed to delete skill: ${error.message}`);
  }

  /**
   * Get skill versions
   */
  async getVersions(skillId: string): Promise<SkillVersion[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new SkillError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('skill_versions')
      .select('*')
      .eq('skill_id', skillId)
      .order('version_number', { ascending: false });

    if (error) throw new SkillError('VERSIONS_FAILED', `Failed to get versions: ${error.message}`);

    return (data || []) as SkillVersion[];
  }

  /**
   * Validate skill manifest
   */
  validateManifest(manifest: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.name || typeof manifest.name !== 'string') {
      errors.push('Manifest must include a name');
    }

    if (!manifest.description || typeof manifest.description !== 'string') {
      errors.push('Manifest must include a description');
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Manifest must include a version');
    }

    if (manifest.dependencies && !Array.isArray(manifest.dependencies)) {
      errors.push('Dependencies must be an array');
    }

    if (manifest.requested_capabilities && !Array.isArray(manifest.requested_capabilities)) {
      errors.push('Requested capabilities must be an array');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a version snapshot
   */
  private async createVersion(
    userId: string,
    skillId: string,
    versionNumber: number,
    skill: AgentSkill,
    changeSummary?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('skill_versions').insert({
      skill_id: skillId,
      version_number: versionNumber,
      instructions: skill.instructions,
      manifest: skill.manifest,
      resource_files: skill.resource_files,
      change_summary: changeSummary,
      created_by: userId,
    });
  }

  /**
   * Validate skill input
   */
  private validateSkillInput(input: CreateSkillInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new SkillError('INVALID_NAME', 'Skill name is required');
    }

    if (input.name.length > 100) {
      throw new SkillError('NAME_TOO_LONG', 'Skill name must be 100 characters or less');
    }

    if (!input.instructions || input.instructions.trim().length === 0) {
      throw new SkillError('INVALID_INSTRUCTIONS', 'Skill instructions are required');
    }

    if (!input.manifest) {
      throw new SkillError('INVALID_MANIFEST', 'Skill manifest is required');
    }

    const manifestValidation = this.validateManifest(input.manifest);
    if (!manifestValidation.valid) {
      throw new SkillError('INVALID_MANIFEST', `Manifest validation failed: ${manifestValidation.errors.join(', ')}`);
    }
  }

  /**
   * Load skill instructions progressively
   */
  async loadSkillInstructions(skillIds: string[]): Promise<Map<string, string>> {
    const supabase = getSupabaseClient();
    if (!supabase) return new Map();

    const { data, error } = await supabase
      .from('agent_skills')
      .select('id, instructions')
      .in('id', skillIds)
      .eq('status', 'published');

    if (error || !data) return new Map();

    const instructions = new Map<string, string>();
    data.forEach((skill: any) => {
      instructions.set(skill.id, skill.instructions);
    });

    return instructions;
  }

  /**
   * Search skills by name or description
   */
  async searchSkills(
    userId: string,
    query: string,
    filters?: {
      workspace_id?: string;
      category?: string;
      limit?: number;
    }
  ): Promise<AgentSkill[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new SkillError('NO_SUPABASE', 'Supabase not configured');

    let sqlQuery = supabase
      .from('agent_skills')
      .select('*')
      .neq('status', 'archived')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (filters?.workspace_id) sqlQuery = sqlQuery.eq('workspace_id', filters.workspace_id);
    if (filters?.category) sqlQuery = sqlQuery.eq('category', filters.category);
    if (filters?.limit) sqlQuery = sqlQuery.limit(filters.limit);

    const { data, error } = await sqlQuery;

    if (error) throw new SkillError('SEARCH_FAILED', `Failed to search skills: ${error.message}`);

    return (data || []) as AgentSkill[];
  }
}

export const skillService = new SkillService();
