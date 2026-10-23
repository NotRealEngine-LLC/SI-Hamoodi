-- HAMOODI SyntheTech Intelligence — Phase 09 Migration
-- Creation Studios & Artifact Management System

-- ============================================================
-- 1. ARTIFACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.si_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Artifact Identity
  artifact_type TEXT NOT NULL CHECK (artifact_type IN (
    'research_report', 'document', 'spreadsheet', 'presentation', 
    'image', 'code_project', 'code_file'
  )),
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  description TEXT CHECK (char_length(description) <= 2000),
  
  -- Status & Versioning
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'deleted')),
  current_version INTEGER NOT NULL DEFAULT 1,
  
  -- Storage References
  content_ref TEXT, -- Reference to structured content (JSON in storage or DB)
  storage_path TEXT, -- Path in Supabase Storage for large binaries
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

ALTER TABLE public.si_artifacts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_artifacts_workspace ON public.si_artifacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_hub ON public.si_artifacts(hub_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_project ON public.si_artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON public.si_artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_by ON public.si_artifacts(created_by);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON public.si_artifacts(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_updated ON public.si_artifacts(updated_at DESC);

-- RLS: Workspace members can view artifacts
CREATE POLICY "Workspace members can view artifacts"
  ON public.si_artifacts FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create artifacts"
  ON public.si_artifacts FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update artifacts"
  ON public.si_artifacts FOR UPDATE
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

CREATE POLICY "Workspace editors can delete artifacts"
  ON public.si_artifacts FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- ============================================================
-- 2. ARTIFACT VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.si_artifact_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES public.si_artifacts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version Content
  content_ref TEXT,
  storage_path TEXT,
  
  -- Metadata
  change_summary TEXT CHECK (char_length(change_summary) <= 500),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(artifact_id, version_number)
);

ALTER TABLE public.si_artifact_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_artifact_versions_artifact ON public.si_artifact_versions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_number ON public.si_artifact_versions(artifact_id, version_number DESC);

-- RLS: Inherit from artifact
CREATE POLICY "Users can view artifact versions"
  ON public.si_artifact_versions FOR SELECT
  TO authenticated
  USING (
    artifact_id IN (
      SELECT id FROM public.si_artifacts
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create artifact versions"
  ON public.si_artifact_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    artifact_id IN (
      SELECT id FROM public.si_artifacts
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================================
-- 3. ARTIFACT EXPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.si_artifact_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES public.si_artifacts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Export Details
  export_format TEXT NOT NULL CHECK (export_format IN (
    'txt', 'md', 'pdf', 'docx', 'csv', 'xlsx', 'pptx', 'png', 'zip'
  )),
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.si_artifact_exports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_artifact_exports_artifact ON public.si_artifact_exports(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_exports_status ON public.si_artifact_exports(status);

-- RLS: Inherit from artifact
CREATE POLICY "Users can view artifact exports"
  ON public.si_artifact_exports FOR SELECT
  TO authenticated
  USING (
    artifact_id IN (
      SELECT id FROM public.si_artifacts
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create artifact exports"
  ON public.si_artifact_exports FOR INSERT
  TO authenticated
  WITH CHECK (
    artifact_id IN (
      SELECT id FROM public.si_artifacts
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================================
-- 4. ARTIFACT GENERATION JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.si_artifact_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID REFERENCES public.si_artifacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Job Details
  job_type TEXT NOT NULL CHECK (job_type IN (
    'research_report', 'document_generation', 'spreadsheet_generation',
    'presentation_generation', 'image_generation', 'code_generation'
  )),
  
  -- Input
  prompt TEXT NOT NULL,
  input_context JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'preparing', 'generating', 'validating', 'saving', 'completed', 'failed', 'cancelled'
  )),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  
  -- Output
  result_artifact_id UUID REFERENCES public.si_artifacts(id) ON DELETE SET NULL,
  result_data JSONB,
  
  -- Model Info
  model_id TEXT,
  provider_adapter TEXT,
  
  -- Errors
  error_code TEXT,
  error_message TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.si_artifact_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_generation_jobs_artifact ON public.si_artifact_generation_jobs(artifact_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_workspace ON public.si_artifact_generation_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.si_artifact_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created ON public.si_artifact_generation_jobs(created_at DESC);

-- RLS: Workspace members can view jobs
CREATE POLICY "Workspace members can view generation jobs"
  ON public.si_artifact_generation_jobs FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create generation jobs"
  ON public.si_artifact_generation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update generation jobs"
  ON public.si_artifact_generation_jobs FOR UPDATE
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
-- 5. RESEARCH SESSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.si_research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  
  -- Session Details
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  research_question TEXT NOT NULL,
  research_mode TEXT NOT NULL CHECK (research_mode IN ('quick', 'deep', 'document')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning', 'researching', 'analyzing', 'generating', 'completed', 'failed'
  )),
  
  -- Results
  outline JSONB,
  findings JSONB,
  report_artifact_id UUID REFERENCES public.si_artifacts(id) ON DELETE SET NULL,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.si_research_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_research_sessions_workspace ON public.si_research_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON public.si_research_sessions(status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created ON public.si_research_sessions(created_at DESC);

-- RLS: Workspace members can view sessions
CREATE POLICY "Workspace members can view research sessions"
  ON public.si_research_sessions FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create research sessions"
  ON public.si_research_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update research sessions"
  ON public.si_research_sessions FOR UPDATE
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
-- 6. RESEARCH SOURCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.si_research_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_session_id UUID NOT NULL REFERENCES public.si_research_sessions(id) ON DELETE CASCADE,
  
  -- Source Details
  source_type TEXT NOT NULL CHECK (source_type IN ('web', 'document', 'database', 'manual')),
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  url TEXT,
  document_id UUID REFERENCES public.si_artifacts(id) ON DELETE SET NULL,
  
  -- Content
  excerpt TEXT,
  full_content TEXT,
  
  -- Metadata
  author TEXT,
  published_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN (
    'verified', 'unverified', 'questionable', 'deprecated'
  )),
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.si_research_sources ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_research_sources_session ON public.si_research_sources(research_session_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_type ON public.si_research_sources(source_type);

-- RLS: Inherit from research session
CREATE POLICY "Users can view research sources"
  ON public.si_research_sources FOR SELECT
  TO authenticated
  USING (
    research_session_id IN (
      SELECT id FROM public.si_research_sessions
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create research sources"
  ON public.si_research_sources FOR INSERT
  TO authenticated
  WITH CHECK (
    research_session_id IN (
      SELECT id FROM public.si_research_sessions
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================================
-- 7. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.si_artifacts TO authenticated;
GRANT SELECT, INSERT ON public.si_artifact_versions TO authenticated;
GRANT SELECT, INSERT ON public.si_artifact_exports TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.si_artifact_generation_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.si_research_sessions TO authenticated;
GRANT SELECT, INSERT ON public.si_research_sources TO authenticated;

-- ============================================================
-- NOTES:
-- - All tables use RLS with workspace membership checks
-- - Artifacts support 7 types: research, document, spreadsheet, presentation, image, code project, code file
-- - Versioning tracks all changes with content references
-- - Export jobs track file generation status
-- - Generation jobs track AI-assisted artifact creation
-- - Research sessions manage structured investigation workflows
-- - Research sources track citations with verification status
