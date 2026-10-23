// HAMOODI SyntheTech Intelligence — Artifact Service
// Phase 09: Core artifact management operations

import { getSupabaseClient } from '../supabase/client';
import {
  Artifact,
  ArtifactVersion,
  CreateArtifactInput,
  UpdateArtifactInput,
  ArtifactType,
  ArtifactStatus,
  ArtifactError,
  ArtifactNotFoundError,
  VersionConflictError,
} from './types';

export class SIArtifactService {
  /**
   * Create a new artifact
   */
  async createArtifact(userId: string, input: CreateArtifactInput): Promise<Artifact> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('si_artifacts')
      .insert({
        workspace_id: input.workspace_id,
        hub_id: input.hub_id || null,
        project_id: input.project_id || null,
        created_by: userId,
        artifact_type: input.artifact_type,
        title: input.title,
        description: input.description || null,
        status: 'draft',
        current_version: 1,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw new ArtifactError('CREATE_FAILED', `Failed to create artifact: ${error.message}`);

    const artifact = data as Artifact;

    // Create initial version if content provided
    if (input.content) {
      await this.saveVersion(userId, artifact.id, 1, input.content, 'Initial version');
    }

    return artifact;
  }

  /**
   * Get an artifact by ID
   */
  async getArtifact(userId: string, artifactId: string): Promise<Artifact | null> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('si_artifacts')
      .select('*')
      .eq('id', artifactId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new ArtifactError('GET_FAILED', `Failed to get artifact: ${error.message}`);
    }

    return data as Artifact;
  }

  /**
   * Get artifact content
   */
  async getArtifactContent(artifactId: string, versionNumber?: number): Promise<any> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    const artifact = await this.getArtifact('', artifactId);
    if (!artifact) throw new ArtifactNotFoundError(artifactId);

    const targetVersion = versionNumber || artifact.current_version;

    if (targetVersion === artifact.current_version && artifact.content_ref) {
      // Load from content_ref (could be JSON in DB or storage path)
      return this.loadContent(artifact.content_ref);
    }

    // Load from version history
    const { data: versionData, error } = await supabase
      .from('si_artifact_versions')
      .select('*')
      .eq('artifact_id', artifactId)
      .eq('version_number', targetVersion)
      .single();

    if (error || !versionData) {
      throw new ArtifactError('VERSION_NOT_FOUND', `Version ${targetVersion} not found`);
    }

    const artifactVersion = versionData as ArtifactVersion;
    return this.loadContent(artifactVersion.content_ref || artifactVersion.storage_path || '');
  }

  /**
   * Update an artifact
   */
  async updateArtifact(
    userId: string,
    artifactId: string,
    updates: UpdateArtifactInput,
    expectedVersion?: number
  ): Promise<Artifact> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    // Get current artifact
    const current = await this.getArtifact(userId, artifactId);
    if (!current) throw new ArtifactNotFoundError(artifactId);

    // Check version conflict
    if (expectedVersion !== undefined && expectedVersion !== current.current_version) {
      throw new VersionConflictError(artifactId, expectedVersion, current.current_version);
    }

    const newVersion = current.current_version + 1;

    // Update artifact
    const { data, error } = await supabase
      .from('si_artifacts')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        metadata: updates.metadata,
        current_version: updates.content ? newVersion : current.current_version,
        updated_at: new Date().toISOString(),
      })
      .eq('id', artifactId)
      .select()
      .single();

    if (error) throw new ArtifactError('UPDATE_FAILED', `Failed to update artifact: ${error.message}`);

    // Save new version if content changed
    if (updates.content) {
      await this.saveVersion(userId, artifactId, newVersion, updates.content, updates.change_summary);
    }

    return data as Artifact;
  }

  /**
   * Delete an artifact (soft delete)
   */
  async deleteArtifact(userId: string, artifactId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    const { error } = await supabase
      .from('si_artifacts')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', artifactId);

    if (error) throw new ArtifactError('DELETE_FAILED', `Failed to delete artifact: ${error.message}`);
  }

  /**
   * List artifacts with filters
   */
  async listArtifacts(
    userId: string,
    filters?: {
      workspace_id?: string;
      hub_id?: string;
      project_id?: string;
      artifact_type?: ArtifactType;
      status?: ArtifactStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Artifact[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('si_artifacts')
      .select('*')
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false });

    if (filters?.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
    if (filters?.hub_id) query = query.eq('hub_id', filters.hub_id);
    if (filters?.project_id) query = query.eq('project_id', filters.project_id);
    if (filters?.artifact_type) query = query.eq('artifact_type', filters.artifact_type);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;

    if (error) throw new ArtifactError('LIST_FAILED', `Failed to list artifacts: ${error.message}`);

    return (data || []) as Artifact[];
  }

  /**
   * Get artifact versions
   */
  async getVersions(artifactId: string): Promise<ArtifactVersion[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('si_artifact_versions')
      .select('*')
      .eq('artifact_id', artifactId)
      .order('version_number', { ascending: false });

    if (error) throw new ArtifactError('VERSIONS_FAILED', `Failed to get versions: ${error.message}`);

    return (data || []) as ArtifactVersion[];
  }

  /**
   * Restore a specific version
   */
  async restoreVersion(userId: string, artifactId: string, versionNumber: number): Promise<Artifact> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    // Get the version to restore
    const { data: versionData, error: versionError } = await supabase
      .from('si_artifact_versions')
      .select('*')
      .eq('artifact_id', artifactId)
      .eq('version_number', versionNumber)
      .single();

    if (versionError || !versionData) {
      throw new ArtifactError('VERSION_NOT_FOUND', `Version ${versionNumber} not found`);
    }

    const artifactVersion = versionData as ArtifactVersion;

    // Load content from version
    const content = await this.loadContent(artifactVersion.content_ref || artifactVersion.storage_path || '');

    // Create new version with restored content
    const artifact = await this.getArtifact(userId, artifactId);
    if (!artifact) throw new ArtifactNotFoundError(artifactId);

    return this.updateArtifact(userId, artifactId, {
      content,
      change_summary: `Restored from version ${versionNumber}`,
    });
  }

  /**
   * Duplicate an artifact
   */
  async duplicateArtifact(userId: string, artifactId: string, newTitle?: string): Promise<Artifact> {
    const artifact = await this.getArtifact(userId, artifactId);
    if (!artifact) throw new ArtifactNotFoundError(artifactId);

    const content = await this.getArtifactContent(artifactId);

    return this.createArtifact(userId, {
      workspace_id: artifact.workspace_id,
      hub_id: artifact.hub_id,
      project_id: artifact.project_id,
      artifact_type: artifact.artifact_type,
      title: newTitle || `${artifact.title} (Copy)`,
      description: artifact.description,
      content,
      metadata: artifact.metadata,
    });
  }

  /**
   * Save a version
   */
  private async saveVersion(
    userId: string,
    artifactId: string,
    versionNumber: number,
    content: any,
    changeSummary?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Store content (for now, inline as JSON; in production, could use storage)
    const contentRef = `content://${artifactId}:${versionNumber}`;

    // In production, would save to Supabase Storage
    // For now, store in a separate content table or inline

    await supabase.from('si_artifact_versions').insert({
      artifact_id: artifactId,
      version_number: versionNumber,
      content_ref: contentRef,
      change_summary: changeSummary,
      created_by: userId,
    });
  }

  /**
   * Load content from reference
   */
  private async loadContent(contentRef: string): Promise<any> {
    // In production, would load from Supabase Storage or content table
    // For now, return placeholder
    if (contentRef.startsWith('content://')) {
      // Parse content reference
      return {};
    }

    // Load from storage
    const supabase = getSupabaseClient();
    if (!supabase) return {};

    const { data, error } = await supabase.storage
      .from('si-artifacts')
      .download(contentRef);

    if (error || !data) return {};

    const text = await data.text();
    return JSON.parse(text);
  }

  /**
   * Search artifacts
   */
  async searchArtifacts(
    userId: string,
    query: string,
    filters?: {
      workspace_id?: string;
      artifact_type?: ArtifactType;
    }
  ): Promise<Artifact[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ArtifactError('NO_SUPABASE', 'Supabase not configured');

    let sqlQuery = supabase
      .from('si_artifacts')
      .select('*')
      .neq('status', 'deleted')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    if (filters?.workspace_id) sqlQuery = sqlQuery.eq('workspace_id', filters.workspace_id);
    if (filters?.artifact_type) sqlQuery = sqlQuery.eq('artifact_type', filters.artifact_type);

    const { data, error } = await sqlQuery.limit(50);

    if (error) throw new ArtifactError('SEARCH_FAILED', `Failed to search artifacts: ${error.message}`);

    return (data || []) as Artifact[];
  }
}

export const artifactService = new SIArtifactService();
