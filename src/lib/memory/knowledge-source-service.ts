// HAMOODI SyntheTech Intelligence — Knowledge Source Service
// Phase 07: Knowledge source management

import { getSupabaseClient } from '../supabase/client';
import {
  KnowledgeSource,
  CreateKnowledgeSourceInput,
  IndexStatus,
  MemoryError,
} from './types';
import { ingestionService } from './ingestion-service';

export class KnowledgeSourceService {
  /**
   * Create a new knowledge source
   */
  async createSource(userId: string, input: CreateKnowledgeSourceInput): Promise<KnowledgeSource> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('knowledge_sources')
      .insert({
        workspace_id: input.workspace_id,
        hub_id: input.hub_id || null,
        project_id: input.project_id || null,
        file_id: input.file_id || null,
        source_type: input.source_type,
        title: input.title,
        description: input.description || null,
        mime_type: input.mime_type || null,
        created_by: userId,
        index_status: 'not_indexed',
        source_version: 1,
        chunk_count: 0,
      })
      .select()
      .single();

    if (error) throw new MemoryError('CREATE_FAILED', `Failed to create source: ${error.message}`);

    return data as KnowledgeSource;
  }

  /**
   * Get a knowledge source by ID
   */
  async getSource(userId: string, sourceId: string): Promise<KnowledgeSource | null> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new MemoryError('GET_FAILED', `Failed to get source: ${error.message}`);
    }

    return data as KnowledgeSource;
  }

  /**
   * List knowledge sources for a workspace
   */
  async listSources(
    userId: string,
    workspaceId: string,
    filters?: {
      hub_id?: string;
      project_id?: string;
      index_status?: IndexStatus;
      limit?: number;
    }
  ): Promise<KnowledgeSource[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('knowledge_sources')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (filters?.hub_id) query = query.eq('hub_id', filters.hub_id);
    if (filters?.project_id) query = query.eq('project_id', filters.project_id);
    if (filters?.index_status) query = query.eq('index_status', filters.index_status);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) throw new MemoryError('LIST_FAILED', `Failed to list sources: ${error.message}`);

    return (data || []) as KnowledgeSource[];
  }

  /**
   * Index a knowledge source
   */
  async indexSource(userId: string, sourceId: string): Promise<void> {
    await ingestionService.startIngestion(userId, sourceId);
  }

  /**
   * Reindex a knowledge source
   */
  async reindexSource(userId: string, sourceId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    // Update source version
    const { data: source } = await supabase
      .from('knowledge_sources')
      .select('source_version')
      .eq('id', sourceId)
      .single();

    if (!source) throw new MemoryError('NOT_FOUND', 'Source not found');

    await supabase
      .from('knowledge_sources')
      .update({
        source_version: source.source_version + 1,
        index_status: 'outdated',
      })
      .eq('id', sourceId);

    // Start reindexing
    await this.indexSource(userId, sourceId);
  }

  /**
   * Delete a knowledge source
   */
  async deleteSource(userId: string, sourceId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new MemoryError('NO_SUPABASE', 'Supabase not configured');

    // Delete source (cascades to documents, chunks, embeddings)
    const { error } = await supabase
      .from('knowledge_sources')
      .delete()
      .eq('id', sourceId);

    if (error) throw new MemoryError('DELETE_FAILED', `Failed to delete source: ${error.message}`);
  }

  /**
   * Get ingestion jobs for a source
   */
  async getIngestionJobs(sourceId: string) {
    return ingestionService.listJobs(sourceId);
  }
}

export const knowledgeSourceService = new KnowledgeSourceService();
