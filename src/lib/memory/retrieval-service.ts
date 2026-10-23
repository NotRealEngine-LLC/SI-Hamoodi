// HAMOODI SyntheTech Intelligence — Retrieval Service
// Phase 07: Semantic and hybrid search

import { getSupabaseClient } from '../supabase/client';
import {
  KnowledgeQuery,
  KnowledgeResult,
  SearchMode,
  RetrievalError,
} from './types';

export class RetrievalService {
  /**
   * Search knowledge using semantic, keyword, or hybrid search
   */
  async search(userId: string, query: KnowledgeQuery): Promise<KnowledgeResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new RetrievalError('Supabase not configured');

    // Verify workspace access
    await this.verifyWorkspaceAccess(userId, query.workspaceId);

    const startTime = Date.now();

    let results: KnowledgeResult[] = [];

    switch (query.mode) {
      case 'semantic':
        results = await this.semanticSearch(query);
        break;
      case 'keyword':
        results = await this.keywordSearch(query);
        break;
      case 'hybrid':
        results = await this.hybridSearch(query);
        break;
    }

    // Log retrieval event
    await this.logRetrievalEvent(userId, query, results, Date.now() - startTime);

    return results;
  }

  /**
   * Semantic search using vector similarity
   */
  private async semanticSearch(query: KnowledgeQuery): Promise<KnowledgeResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    // Generate query embedding (simplified - would use real embedding API)
    const queryEmbedding = await this.generateQueryEmbedding(query.query);

    // Build base query with authorization
    let sqlQuery = supabase
      .from('knowledge_embeddings')
      .select(`
        id,
        chunk_id,
        chunk:knowledge_chunks (
          id,
          content,
          document_id,
          source_id,
          page_number,
          section_title
        ),
        source:knowledge_chunks!inner (
          source:knowledge_sources (
            id,
            title,
            workspace_id,
            hub_id,
            project_id
          )
        )
      `)
      .eq('knowledge_chunks.source.workspace_id', query.workspaceId);

    // Apply filters
    if (query.hubId) {
      sqlQuery = sqlQuery.eq('knowledge_chunks.source.hub_id', query.hubId);
    }
    if (query.projectId) {
      sqlQuery = sqlQuery.eq('knowledge_chunks.source.project_id', query.projectId);
    }
    if (query.sourceIds && query.sourceIds.length > 0) {
      sqlQuery = sqlQuery.in('knowledge_chunks.source_id', query.sourceIds);
    }

    // Note: In production, would use pgvector similarity search
    // For now, return empty results as we don't have real embeddings
    // This is a placeholder for the actual vector similarity search

    const { data, error } = await sqlQuery.limit(query.maxResults || 5);

    if (error || !data) return [];

    return data.map((item: any, index: number) => ({
      chunkId: item.chunk_id,
      sourceId: item.source?.source?.id || '',
      documentId: item.chunk?.document_id || '',
      content: item.chunk?.content || '',
      title: item.source?.source?.title || '',
      reference: item.chunk?.page_number ? `Page ${item.chunk.page_number}` : undefined,
      rank: index + 1,
      similarity: 0.95 - (index * 0.05), // Placeholder similarity
    }));
  }

  /**
   * Keyword search using full-text search
   */
  private async keywordSearch(query: KnowledgeQuery): Promise<KnowledgeResult[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    let sqlQuery = supabase
      .from('knowledge_chunks')
      .select(`
        id,
        content,
        document_id,
        source_id,
        page_number,
        section_title,
        source:knowledge_sources (
          id,
          title,
          workspace_id,
          hub_id,
          project_id
        )
      `)
      .eq('source.workspace_id', query.workspaceId)
      .textSearch('content_tsv', query.query, { config: 'english' });

    if (query.hubId) {
      sqlQuery = sqlQuery.eq('source.hub_id', query.hubId);
    }
    if (query.projectId) {
      sqlQuery = sqlQuery.eq('source.project_id', query.projectId);
    }
    if (query.sourceIds && query.sourceIds.length > 0) {
      sqlQuery = sqlQuery.in('source_id', query.sourceIds);
    }

    const { data, error } = await sqlQuery.limit(query.maxResults || 5);

    if (error || !data) return [];

    return data.map((chunk: any, index: number) => ({
      chunkId: chunk.id,
      sourceId: chunk.source?.id || '',
      documentId: chunk.document_id,
      content: chunk.content,
      title: chunk.source?.title || '',
      reference: chunk.page_number ? `Page ${chunk.page_number}` : undefined,
      rank: index + 1,
    }));
  }

  /**
   * Hybrid search combining semantic and keyword
   */
  private async hybridSearch(query: KnowledgeQuery): Promise<KnowledgeResult[]> {
    // Get results from both methods
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query),
      this.keywordSearch(query),
    ]);

    // Combine using Reciprocal Rank Fusion
    const combined = this.reciprocalRankFusion(semanticResults, keywordResults);

    return combined.slice(0, query.maxResults || 5);
  }

  /**
   * Reciprocal Rank Fusion for combining search results
   */
  private reciprocalRankFusion(
    semanticResults: KnowledgeResult[],
    keywordResults: KnowledgeResult[]
  ): KnowledgeResult[] {
    const k = 60; // Constant for RRF
    const scores = new Map<string, { result: KnowledgeResult; score: number }>();

    // Score semantic results
    semanticResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      const existing = scores.get(result.chunkId);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(result.chunkId, { result, score: rrfScore });
      }
    });

    // Score keyword results
    keywordResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      const existing = scores.get(result.chunkId);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scores.set(result.chunkId, { result, score: rrfScore });
      }
    });

    // Sort by combined score
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item.result,
        rank: index + 1,
        score: item.score,
      }));
  }

  /**
   * Generate query embedding (placeholder)
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    // In production, would call real embedding API
    // For now, return placeholder
    return new Array(1536).fill(0);
  }

  /**
   * Verify workspace access
   */
  private async verifyWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new RetrievalError('Supabase not configured');

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      throw new RetrievalError('Unauthorized workspace access');
    }
  }

  /**
   * Log retrieval event for analytics
   */
  private async logRetrievalEvent(
    userId: string,
    query: KnowledgeQuery,
    results: KnowledgeResult[],
    durationMs: number
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('knowledge_retrieval_events').insert({
      workspace_id: query.workspaceId,
      user_id: userId,
      query_text: query.query,
      search_mode: query.mode,
      result_count: results.length,
      retrieved_chunk_ids: results.map(r => r.chunkId),
      duration_ms: durationMs,
    });
  }
}

export const retrievalService = new RetrievalService();
