-- HAMOODI SyntheTech Intelligence — Phase 07 Migration
-- Synthetic Memory & Knowledge Intelligence System

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. MEMORY ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  
  -- Memory Classification
  scope TEXT NOT NULL CHECK (scope IN ('personal', 'workspace', 'hub', 'project', 'conversation')),
  memory_type TEXT NOT NULL CHECK (memory_type IN ('working', 'episodic', 'semantic', 'preference', 'procedural')),
  
  -- Content
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  content TEXT NOT NULL CHECK (char_length(content) > 0),
  
  -- Provenance
  source_type TEXT CHECK (source_type IN ('explicit', 'suggested', 'document', 'decision', 'conversation')),
  source_id UUID,
  source_reference TEXT,
  capture_method TEXT NOT NULL DEFAULT 'explicit' CHECK (capture_method IN ('explicit', 'suggested', 'document', 'decision')),
  confidence TEXT CHECK (confidence IN ('user_confirmed', 'source_backed', 'unverified', 'potentially_outdated')),
  
  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_review', 'archived', 'expired', 'deleted')),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_memory_items_owner ON public.memory_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_workspace ON public.memory_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_memory_items_scope ON public.memory_items(scope);
CREATE INDEX IF NOT EXISTS idx_memory_items_type ON public.memory_items(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_items_status ON public.memory_items(status);

-- RLS: Users can access their own memories and workspace memories they're authorized for
CREATE POLICY "Users can view own memories"
  ON public.memory_items FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    (scope = 'workspace' AND workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )) OR
    (scope = 'hub' AND hub_id IN (
      SELECT id FROM public.hubs 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )) OR
    (scope = 'project' AND project_id IN (
      SELECT id FROM public.projects 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    ))
  );

CREATE POLICY "Users can create own memories"
  ON public.memory_items FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own memories"
  ON public.memory_items FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own memories"
  ON public.memory_items FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- 2. MEMORY VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memory_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memory_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memory_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_memory_versions_memory ON public.memory_versions(memory_id);

CREATE POLICY "Users can view memory versions they own"
  ON public.memory_versions FOR SELECT
  TO authenticated
  USING (
    memory_id IN (
      SELECT id FROM public.memory_items WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 3. KNOWLEDGE SOURCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.workspace_files(id) ON DELETE CASCADE,
  
  -- Source Metadata
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'note', 'project_document', 'memory', 'external')),
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  description TEXT,
  mime_type TEXT,
  content_hash TEXT,
  source_version INTEGER NOT NULL DEFAULT 1,
  
  -- Indexing Status
  index_status TEXT NOT NULL DEFAULT 'not_indexed' CHECK (index_status IN (
    'not_indexed', 'queued', 'extracting', 'chunking', 'embedding', 'indexing', 'ready', 'failed', 'cancelled', 'outdated'
  )),
  indexed_at TIMESTAMPTZ,
  chunk_count INTEGER NOT NULL DEFAULT 0,
  embedding_model TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_workspace ON public.knowledge_sources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_hub ON public.knowledge_sources(hub_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_project ON public.knowledge_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_status ON public.knowledge_sources(index_status);

CREATE POLICY "Workspace members can view knowledge sources"
  ON public.knowledge_sources FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create knowledge sources"
  ON public.knowledge_sources FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update knowledge sources"
  ON public.knowledge_sources FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can delete knowledge sources"
  ON public.knowledge_sources FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- ============================================================
-- 4. KNOWLEDGE DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Document Content
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  page_count INTEGER,
  word_count INTEGER,
  character_count INTEGER,
  
  -- Metadata
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source ON public.knowledge_documents(source_id);

CREATE POLICY "Users can view documents from authorized sources"
  ON public.knowledge_documents FOR SELECT
  TO authenticated
  USING (
    source_id IN (
      SELECT id FROM public.knowledge_sources
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================================
-- 5. KNOWLEDGE CHUNKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  
  -- Chunk Content
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  token_estimate INTEGER,
  
  -- Metadata
  page_number INTEGER,
  section_title TEXT,
  sheet_name TEXT,
  slide_number INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document ON public.knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON public.knowledge_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_index ON public.knowledge_chunks(document_id, chunk_index);

CREATE POLICY "Users can view chunks from authorized sources"
  ON public.knowledge_chunks FOR SELECT
  TO authenticated
  USING (
    source_id IN (
      SELECT id FROM public.knowledge_sources
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================================
-- 6. KNOWLEDGE EMBEDDINGS TABLE (pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES public.knowledge_chunks(id) ON DELETE CASCADE,
  
  -- Embedding Vector (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536) NOT NULL,
  
  -- Model Info
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  dimensions INTEGER NOT NULL DEFAULT 1536,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- HNSW index for cosine similarity
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector 
  ON public.knowledge_embeddings 
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_chunk ON public.knowledge_embeddings(chunk_id);

CREATE POLICY "Users can view embeddings from authorized chunks"
  ON public.knowledge_embeddings FOR SELECT
  TO authenticated
  USING (
    chunk_id IN (
      SELECT id FROM public.knowledge_chunks
      WHERE source_id IN (
        SELECT id FROM public.knowledge_sources
        WHERE workspace_id IN (
          SELECT id FROM public.workspaces 
          WHERE owner_id = auth.uid() 
          OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
      )
    )
  );

-- ============================================================
-- 7. KNOWLEDGE INGESTION JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES public.knowledge_sources(id) ON DELETE CASCADE,
  document_version INTEGER NOT NULL DEFAULT 1,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Job Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'validating', 'extracting', 'normalizing', 'chunking', 'embedding', 'indexing', 'verifying', 'completed', 'failed', 'cancelled'
  )),
  stage TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  
  -- Progress
  total_chunks INTEGER,
  processed_chunks INTEGER DEFAULT 0,
  
  -- Error Info
  error_code TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.knowledge_ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_source ON public.knowledge_ingestion_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON public.knowledge_ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_workspace ON public.knowledge_ingestion_jobs(workspace_id);

CREATE POLICY "Workspace members can view ingestion jobs"
  ON public.knowledge_ingestion_jobs FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create ingestion jobs"
  ON public.knowledge_ingestion_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update ingestion jobs"
  ON public.knowledge_ingestion_jobs FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- ============================================================
-- 8. KNOWLEDGE RETRIEVAL EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.knowledge_retrieval_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Query Info
  query_text TEXT NOT NULL,
  search_mode TEXT NOT NULL CHECK (search_mode IN ('keyword', 'semantic', 'hybrid')),
  result_count INTEGER NOT NULL DEFAULT 0,
  
  -- Retrieved Chunks
  retrieved_chunk_ids UUID[],
  
  -- Performance
  duration_ms INTEGER,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.knowledge_retrieval_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_retrieval_events_workspace ON public.knowledge_retrieval_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_events_user ON public.knowledge_retrieval_events(user_id);
CREATE INDEX IF NOT EXISTS idx_retrieval_events_created ON public.knowledge_retrieval_events(created_at DESC);

CREATE POLICY "Workspace members can view retrieval events"
  ON public.knowledge_retrieval_events FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create retrieval events"
  ON public.knowledge_retrieval_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 9. FULL-TEXT SEARCH INDEXES
-- ============================================================
-- Add full-text search columns
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS content_tsv tsvector;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_content_tsv 
  ON public.knowledge_chunks 
  USING gin (content_tsv);

-- Function to update tsvector
CREATE OR REPLACE FUNCTION update_chunk_tsv()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content_tsv := to_tsvector('english', NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_chunk_tsv
  BEFORE INSERT OR UPDATE ON public.knowledge_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_chunk_tsv();

-- ============================================================
-- 10. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_items TO authenticated;
GRANT SELECT ON public.memory_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_sources TO authenticated;
GRANT SELECT ON public.knowledge_documents TO authenticated;
GRANT SELECT ON public.knowledge_chunks TO authenticated;
GRANT SELECT ON public.knowledge_embeddings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_ingestion_jobs TO authenticated;
GRANT SELECT, INSERT ON public.knowledge_retrieval_events TO authenticated;

-- ============================================================
-- NOTES:
-- - pgvector extension enabled for vector similarity search
-- - All tables use RLS with workspace membership checks
-- - Memory items support multiple scopes (personal, workspace, hub, project, conversation)
-- - Knowledge sources track indexing status and progress
-- - Embeddings use 1536 dimensions (OpenAI text-embedding-3-small)
-- - HNSW index for efficient vector similarity search
-- - Full-text search with tsvector for keyword retrieval
-- - Ingestion jobs track document processing pipeline
-- - Retrieval events log search activity for analytics
