// HAMOODI SyntheTech Intelligence — Document Ingestion Service
// Phase 07: Document processing pipeline

import { getSupabaseClient } from '../supabase/client';
import {
  KnowledgeSource,
  KnowledgeDocument,
  KnowledgeChunk,
  IngestionJob,
  IngestionStatus,
  IngestionError,
} from './types';

export class DocumentIngestionService {
  /**
   * Start ingestion process for a knowledge source
   */
  async startIngestion(userId: string, sourceId: string): Promise<IngestionJob> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new IngestionError(sourceId, 'Supabase not configured', 'init');

    // Get source
    const { data: source, error: sourceError } = await supabase
      .from('knowledge_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      throw new IngestionError(sourceId, 'Source not found', 'init');
    }

    // Create ingestion job
    const { data: job, error: jobError } = await supabase
      .from('knowledge_ingestion_jobs')
      .insert({
        source_id: sourceId,
        document_version: source.source_version,
        workspace_id: source.workspace_id,
        status: 'queued',
        attempt_count: 0,
        max_attempts: 3,
        processed_chunks: 0,
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new IngestionError(sourceId, 'Failed to create ingestion job', 'init');
    }

    // Update source status
    await supabase
      .from('knowledge_sources')
      .update({ index_status: 'queued' })
      .eq('id', sourceId);

    // Process synchronously (in production, this would be a background job)
    await this.processIngestion(job.id, userId);

    return job as IngestionJob;
  }

  /**
   * Process ingestion job
   */
  private async processIngestion(jobId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // Get job
      const { data: job } = await supabase
        .from('knowledge_ingestion_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!job) return;

      // Update status to extracting
      await this.updateJobStatus(jobId, 'extracting', 'Extracting content');

      // Get source
      const { data: source } = await supabase
        .from('knowledge_sources')
        .select('*')
        .eq('id', job.source_id)
        .single();

      if (!source) {
        throw new Error('Source not found');
      }

      // Extract content (simplified - in production would handle different file types)
      let content = '';
      if (source.file_id) {
        // Get file from storage
        const { data: file } = await supabase
          .from('workspace_files')
          .select('*')
          .eq('id', source.file_id)
          .single();

        if (file) {
          // For now, just use display_name as content
          // In production, would download and extract text
          content = `Content from ${file.display_name}`;
        }
      } else if (source.source_type === 'note') {
        // For notes, content would be stored directly
        content = source.description || '';
      }

      if (!content) {
        throw new Error('No content to extract');
      }

      // Create document
      await this.updateJobStatus(jobId, 'chunking', 'Creating document');
      
      const contentHash = await this.hashContent(content);
      
      const { data: document } = await supabase
        .from('knowledge_documents')
        .insert({
          source_id: source.id,
          version: source.source_version,
          content,
          content_hash: contentHash,
          word_count: content.split(/\s+/).length,
          character_count: content.length,
        })
        .select()
        .single();

      if (!document) {
        throw new Error('Failed to create document');
      }

      // Chunk content
      await this.updateJobStatus(jobId, 'chunking', 'Chunking content');
      const chunks = this.chunkContent(content, 500, 100); // ~500 tokens, 100 overlap

      // Create chunks
      const chunkRecords = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        const chunkHash = await this.hashContent(chunkContent);
        
        const { data: chunk } = await supabase
          .from('knowledge_chunks')
          .insert({
            document_id: document.id,
            source_id: source.id,
            chunk_index: i,
            content: chunkContent,
            content_hash: chunkHash,
            token_estimate: Math.ceil(chunkContent.length / 4), // Rough estimate
          })
          .select()
          .single();

        if (chunk) {
          chunkRecords.push(chunk);
        }

        // Update progress
        await supabase
          .from('knowledge_ingestion_jobs')
          .update({ 
            processed_chunks: i + 1,
            total_chunks: chunks.length,
          })
          .eq('id', jobId);
      }

      // Generate embeddings (simplified - would use real embedding provider)
      await this.updateJobStatus(jobId, 'embedding', 'Generating embeddings');
      
      for (const chunk of chunkRecords) {
        // In production, would call real embedding API
        // For now, create placeholder embeddings
        const embedding = new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
        
        await supabase.from('knowledge_embeddings').insert({
          chunk_id: chunk.id,
          embedding,
          model_id: 'text-embedding-3-small',
          model_version: '1',
          dimensions: 1536,
        });
      }

      // Update source
      await this.updateJobStatus(jobId, 'indexing', 'Finalizing');
      
      await supabase
        .from('knowledge_sources')
        .update({
          index_status: 'ready',
          indexed_at: new Date().toISOString(),
          chunk_count: chunkRecords.length,
          embedding_model: 'text-embedding-3-small',
        })
        .eq('id', source.id);

      // Mark job complete
      await this.updateJobStatus(jobId, 'completed', 'Ingestion complete');

    } catch (error) {
      // Mark job as failed
      await supabase
        .from('knowledge_ingestion_jobs')
        .update({
          status: 'failed',
          error_code: 'PROCESSING_ERROR',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      // Update source status
      await supabase
        .from('knowledge_sources')
        .update({ index_status: 'failed' })
        .eq('id', (await supabase.from('knowledge_ingestion_jobs').select('source_id').eq('id', jobId).single()).data?.source_id);

      throw error;
    }
  }

  /**
   * Update job status
   */
  private async updateJobStatus(jobId: string, status: IngestionStatus, stage: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const updates: any = {
      status,
      stage,
    };

    if (status === 'extracting' || status === 'chunking' || status === 'embedding') {
      if (!stage.includes('started')) {
        updates.started_at = new Date().toISOString();
      }
    }

    if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }

    await supabase
      .from('knowledge_ingestion_jobs')
      .update(updates)
      .eq('id', jobId);
  }

  /**
   * Chunk content into smaller pieces
   */
  private chunkContent(content: string, targetTokens: number, overlapTokens: number): string[] {
    const chunks: string[] = [];
    const words = content.split(/\s+/);
    const wordsPerChunk = targetTokens * 4 / 5; // Rough word to token ratio
    const overlapWords = overlapTokens * 4 / 5;

    let startIndex = 0;
    while (startIndex < words.length) {
      const endIndex = Math.min(startIndex + wordsPerChunk, words.length);
      const chunk = words.slice(startIndex, endIndex).join(' ');
      chunks.push(chunk);

      startIndex = endIndex - overlapWords;
      if (startIndex >= words.length) break;
    }

    return chunks;
  }

  /**
   * Hash content for deduplication
   */
  private async hashContent(content: string): Promise<string> {
    // Simple hash for now - in production would use SHA-256
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get ingestion job status
   */
  async getJobStatus(jobId: string): Promise<IngestionJob | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('knowledge_ingestion_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) return null;

    return data as IngestionJob;
  }

  /**
   * List ingestion jobs for a source
   */
  async listJobs(sourceId: string): Promise<IngestionJob[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('knowledge_ingestion_jobs')
      .select('*')
      .eq('source_id', sourceId)
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data || []) as IngestionJob[];
  }
}

export const ingestionService = new DocumentIngestionService();
