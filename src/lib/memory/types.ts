// HAMOODI SyntheTech Intelligence — Synthetic Memory Types
// Phase 07: Persistent Knowledge & RAG Engine

export type MemoryScope = 'personal' | 'workspace' | 'hub' | 'project' | 'conversation';
export type MemoryType = 'working' | 'episodic' | 'semantic' | 'preference' | 'procedural';
export type MemoryStatus = 'active' | 'pending_review' | 'archived' | 'expired' | 'deleted';
export type ConfidenceLevel = 'user_confirmed' | 'source_backed' | 'unverified' | 'potentially_outdated';
export type CaptureMethod = 'explicit' | 'suggested' | 'document' | 'decision';

export type SourceType = 'file' | 'note' | 'project_document' | 'memory' | 'external';
export type IndexStatus = 'not_indexed' | 'queued' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'ready' | 'failed' | 'cancelled' | 'outdated';
export type IngestionStatus = 'queued' | 'validating' | 'extracting' | 'normalizing' | 'chunking' | 'embedding' | 'indexing' | 'verifying' | 'completed' | 'failed' | 'cancelled';
export type SearchMode = 'keyword' | 'semantic' | 'hybrid';

// ============================================================
// MEMORY TYPES
// ============================================================

export interface MemoryItem {
  id: string;
  owner_id: string;
  workspace_id?: string;
  hub_id?: string;
  project_id?: string;
  conversation_id?: string;
  
  scope: MemoryScope;
  memory_type: MemoryType;
  
  title: string;
  content: string;
  
  source_type?: string;
  source_id?: string;
  source_reference?: string;
  capture_method: CaptureMethod;
  confidence?: ConfidenceLevel;
  
  status: MemoryStatus;
  expires_at?: string;
  last_used_at?: string;
  version: number;
  
  created_at: string;
  updated_at: string;
}

export interface MemoryVersion {
  id: string;
  memory_id: string;
  version: number;
  title: string;
  content: string;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

export interface CreateMemoryInput {
  scope: MemoryScope;
  memory_type: MemoryType;
  title: string;
  content: string;
  workspace_id?: string;
  hub_id?: string;
  project_id?: string;
  conversation_id?: string;
  source_type?: string;
  source_id?: string;
  source_reference?: string;
  capture_method?: CaptureMethod;
  confidence?: ConfidenceLevel;
  expires_at?: string;
}

export interface UpdateMemoryInput {
  title?: string;
  content?: string;
  status?: MemoryStatus;
  confidence?: ConfidenceLevel;
  expires_at?: string;
}

// ============================================================
// KNOWLEDGE SOURCE TYPES
// ============================================================

export interface KnowledgeSource {
  id: string;
  workspace_id: string;
  hub_id?: string;
  project_id?: string;
  file_id?: string;
  
  source_type: SourceType;
  title: string;
  description?: string;
  mime_type?: string;
  content_hash?: string;
  source_version: number;
  
  index_status: IndexStatus;
  indexed_at?: string;
  chunk_count: number;
  embedding_model?: string;
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeSourceInput {
  workspace_id: string;
  hub_id?: string;
  project_id?: string;
  file_id?: string;
  source_type: SourceType;
  title: string;
  description?: string;
  mime_type?: string;
}

// ============================================================
// DOCUMENT TYPES
// ============================================================

export interface KnowledgeDocument {
  id: string;
  source_id: string;
  version: number;
  
  content: string;
  content_hash: string;
  page_count?: number;
  word_count?: number;
  character_count?: number;
  
  extracted_at: string;
  created_at: string;
}

// ============================================================
// CHUNK TYPES
// ============================================================

export interface KnowledgeChunk {
  id: string;
  document_id: string;
  source_id: string;
  chunk_index: number;
  
  content: string;
  content_hash: string;
  token_estimate?: number;
  
  page_number?: number;
  section_title?: string;
  sheet_name?: string;
  slide_number?: number;
  
  created_at: string;
}

// ============================================================
// EMBEDDING TYPES
// ============================================================

export interface KnowledgeEmbedding {
  id: string;
  chunk_id: string;
  
  embedding: number[];
  
  model_id: string;
  model_version: string;
  dimensions: number;
  
  created_at: string;
}

export interface EmbeddingProvider {
  id: string;
  modelId: string;
  dimensions: number;
  
  embedText(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// ============================================================
// INGESTION TYPES
// ============================================================

export interface IngestionJob {
  id: string;
  source_id: string;
  document_version: number;
  workspace_id: string;
  
  status: IngestionStatus;
  stage?: string;
  attempt_count: number;
  max_attempts: number;
  
  total_chunks?: number;
  processed_chunks: number;
  
  error_code?: string;
  error_message?: string;
  
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// ============================================================
// RETRIEVAL TYPES
// ============================================================

export interface KnowledgeQuery {
  query: string;
  workspaceId: string;
  hubId?: string;
  projectId?: string;
  sourceIds?: string[];
  maxResults?: number;
  mode: SearchMode;
}

export interface KnowledgeResult {
  chunkId: string;
  sourceId: string;
  documentId: string;
  content: string;
  title: string;
  reference?: string;
  rank: number;
  similarity?: number;
  score?: number;
}

export interface RetrievalEvent {
  id: string;
  workspace_id: string;
  user_id: string;
  
  query_text: string;
  search_mode: SearchMode;
  result_count: number;
  
  retrieved_chunk_ids: string[];
  
  duration_ms?: number;
  
  created_at: string;
}

// ============================================================
// CITATION TYPES
// ============================================================

export interface Citation {
  citation_id: string;
  source_id: string;
  document_id: string;
  chunk_id: string;
  source_title: string;
  page_number?: number;
  section?: string;
  excerpt: string;
}

// ============================================================
// CONTEXT TYPES
// ============================================================

export interface ContextBudget {
  maxTokens: number;
  maxChunks: number;
  maxRetrievedText: number;
  
  allocatedTokens: {
    systemPrompt: number;
    instructions: number;
    retrievedKnowledge: number;
    conversationHistory: number;
    userPrompt: number;
  };
}

// ============================================================
// ERROR TYPES
// ============================================================

export class MemoryError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'MemoryError';
  }
}

export class IngestionError extends MemoryError {
  constructor(
    public jobId: string,
    message: string,
    public stage: string,
    context?: any
  ) {
    super('INGESTION_FAILED', message, context);
    this.name = 'IngestionError';
  }
}

export class RetrievalError extends MemoryError {
  constructor(message: string, context?: any) {
    super('RETRIEVAL_FAILED', message, context);
    this.name = 'RetrievalError';
  }
}

export class AuthorizationError extends MemoryError {
  constructor(message: string = 'Unauthorized access to memory or knowledge') {
    super('UNAUTHORIZED', message);
    this.name = 'AuthorizationError';
  }
}
