-- HAMOODI SyntheTech Intelligence — Phase 10 Migration
-- Custom Agents, Skills Ecosystem & Workflow Automation

-- ============================================================
-- 1. CUSTOM AGENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.custom_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Agent Identity
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  icon TEXT,
  color TEXT,
  category TEXT,
  
  -- Configuration
  instructions TEXT NOT NULL,
  model_policy JSONB NOT NULL DEFAULT '{"mode": "auto"}',
  skill_ids UUID[] DEFAULT '{}',
  allowed_tool_ids TEXT[] DEFAULT '{}',
  knowledge_scope TEXT[] DEFAULT '{}',
  
  -- Budget & Limits
  max_iterations INTEGER NOT NULL DEFAULT 10,
  max_model_calls INTEGER NOT NULL DEFAULT 20,
  max_tool_calls INTEGER NOT NULL DEFAULT 25,
  
  -- Behavior
  requires_approval_for_writes BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  current_version INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

ALTER TABLE public.custom_agents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_custom_agents_workspace ON public.custom_agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_custom_agents_owner ON public.custom_agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_custom_agents_status ON public.custom_agents(status);
CREATE INDEX IF NOT EXISTS idx_custom_agents_category ON public.custom_agents(category);

-- RLS: Workspace members can view agents
CREATE POLICY "Workspace members can view agents"
  ON public.custom_agents FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create agents"
  ON public.custom_agents FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update agents"
  ON public.custom_agents FOR UPDATE
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

CREATE POLICY "Owners can delete agents"
  ON public.custom_agents FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 2. AGENT VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.custom_agents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version Snapshot
  configuration JSONB NOT NULL,
  instructions TEXT NOT NULL,
  model_policy JSONB NOT NULL,
  skill_ids UUID[] NOT NULL DEFAULT '{}',
  allowed_tool_ids TEXT[] NOT NULL DEFAULT '{}',
  
  -- Metadata
  change_summary TEXT CHECK (char_length(change_summary) <= 500),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(agent_id, version_number)
);

ALTER TABLE public.agent_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_versions_agent ON public.agent_versions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_versions_number ON public.agent_versions(agent_id, version_number DESC);

CREATE POLICY "Users can view agent versions"
  ON public.agent_versions FOR SELECT
  TO authenticated
  USING (
    agent_id IN (
      SELECT id FROM public.custom_agents
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================================
-- 3. AGENT SKILLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Skill Identity
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 1000),
  category TEXT,
  
  -- Skill Content
  instructions TEXT NOT NULL,
  manifest JSONB NOT NULL DEFAULT '{}',
  
  -- Resources
  resource_files TEXT[] DEFAULT '{}',
  
  -- Permissions
  requested_capabilities TEXT[] DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'published', 'deprecated', 'archived')),
  current_version INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_skills_workspace ON public.agent_skills(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_skills_owner ON public.agent_skills(owner_id);
CREATE INDEX IF NOT EXISTS idx_agent_skills_status ON public.agent_skills(status);
CREATE INDEX IF NOT EXISTS idx_agent_skills_category ON public.agent_skills(category);

-- RLS: Skills are visible to workspace members or public
CREATE POLICY "Users can view skills"
  ON public.agent_skills FOR SELECT
  TO authenticated
  USING (
    workspace_id IS NULL OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create skills"
  ON public.agent_skills FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (workspace_id IS NULL OR workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    ))
  );

CREATE POLICY "Users can update own skills"
  ON public.agent_skills FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own skills"
  ON public.agent_skills FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- 4. SKILL VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.skill_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.agent_skills(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version Snapshot
  instructions TEXT NOT NULL,
  manifest JSONB NOT NULL,
  resource_files TEXT[] NOT NULL DEFAULT '{}',
  
  -- Metadata
  change_summary TEXT CHECK (char_length(change_summary) <= 500),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(skill_id, version_number)
);

ALTER TABLE public.skill_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_skill_versions_skill ON public.skill_versions(skill_id);

CREATE POLICY "Users can view skill versions"
  ON public.skill_versions FOR SELECT
  TO authenticated
  USING (
    skill_id IN (
      SELECT id FROM public.agent_skills
      WHERE workspace_id IS NULL OR
      workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================================
-- 5. MARKETPLACE LISTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- Item Reference
  item_type TEXT NOT NULL CHECK (item_type IN ('agent', 'skill', 'workflow_template')),
  item_id UUID NOT NULL,
  item_version INTEGER NOT NULL,
  
  -- Listing Details
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  category TEXT,
  
  -- Visibility
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'workspace', 'curated_public')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_publisher ON public.marketplace_listings(publisher_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_workspace ON public.marketplace_listings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_type ON public.marketplace_listings(item_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_visibility ON public.marketplace_listings(visibility);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);

CREATE POLICY "Users can view approved listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (
    status = 'approved' AND
    (
      visibility = 'curated_public' OR
      (visibility = 'workspace' AND workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )) OR
      (visibility = 'private' AND publisher_id = auth.uid())
    )
  );

CREATE POLICY "Users can create listings"
  ON public.marketplace_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    publisher_id = auth.uid() AND
    (workspace_id IS NULL OR workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    ))
  );

-- ============================================================
-- 6. MARKETPLACE INSTALLATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketplace_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  installed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Installation Details
  installed_version INTEGER NOT NULL,
  installed_item_id UUID NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'uninstalled', 'outdated')),
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketplace_installations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_marketplace_installations_listing ON public.marketplace_installations(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_installations_workspace ON public.marketplace_installations(workspace_id);

CREATE POLICY "Users can view workspace installations"
  ON public.marketplace_installations FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create installations"
  ON public.marketplace_installations FOR INSERT
  TO authenticated
  WITH CHECK (
    installed_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- ============================================================
-- 7. WORKFLOW DEFINITIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Workflow Identity
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  
  -- Graph Structure
  nodes JSONB NOT NULL DEFAULT '[]',
  edges JSONB NOT NULL DEFAULT '[]',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  current_version INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_workspace ON public.workflow_definitions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_owner ON public.workflow_definitions(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_status ON public.workflow_definitions(status);

CREATE POLICY "Workspace members can view workflows"
  ON public.workflow_definitions FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create workflows"
  ON public.workflow_definitions FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update workflows"
  ON public.workflow_definitions FOR UPDATE
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

CREATE POLICY "Owners can delete workflows"
  ON public.workflow_definitions FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- ============================================================
-- 8. WORKFLOW VERSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version Snapshot
  nodes JSONB NOT NULL,
  edges JSONB NOT NULL,
  
  -- Metadata
  change_summary TEXT CHECK (char_length(change_summary) <= 500),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(workflow_id, version_number)
);

ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow ON public.workflow_versions(workflow_id);

CREATE POLICY "Users can view workflow versions"
  ON public.workflow_versions FOR SELECT
  TO authenticated
  USING (
    workflow_id IN (
      SELECT id FROM public.workflow_definitions
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================================
-- 9. WORKFLOW RUNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Run Details
  workflow_version INTEGER NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'webhook', 'event')),
  trigger_data JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'running', 'awaiting_approval', 'awaiting_client',
    'paused', 'completed', 'partially_completed', 'failed', 'cancelled'
  )),
  
  -- Execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Results
  node_results JSONB NOT NULL DEFAULT '{}',
  final_output JSONB,
  error_message TEXT,
  
  -- Metadata
  initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workspace ON public.workflow_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_created ON public.workflow_runs(created_at DESC);

CREATE POLICY "Workspace members can view runs"
  ON public.workflow_runs FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can create runs"
  ON public.workflow_runs FOR INSERT
  TO authenticated
  WITH CHECK (
    initiated_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can update runs"
  ON public.workflow_runs FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- ============================================================
-- 10. WORKFLOW TRIGGERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  
  -- Trigger Details
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'webhook', 'event')),
  configuration JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Webhook
  webhook_secret TEXT,
  webhook_url TEXT,
  
  -- Schedule
  schedule_timezone TEXT,
  schedule_expression TEXT,
  next_run_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow ON public.workflow_triggers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_type ON public.workflow_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_enabled ON public.workflow_triggers(enabled);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_next_run ON public.workflow_triggers(next_run_at) WHERE enabled = TRUE;

CREATE POLICY "Users can view triggersers"
  ON public.workflow_triggers FOR SELECT
  TO authenticated
  USING (
    workflow_id IN (
      SELECT id FROM public.workflow_definitions
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create triggers"
  ON public.workflow_triggers FOR INSERT
  TO authenticated
  WITH CHECK (
    workflow_id IN (
      SELECT id FROM public.workflow_definitions
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

CREATE POLICY "Users can update triggers"
  ON public.workflow_triggers FOR UPDATE
  TO authenticated
  USING (
    workflow_id IN (
      SELECT id FROM public.workflow_definitions
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  )
  WITH CHECK (
    workflow_id IN (
      SELECT id FROM public.workflow_definitions
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================================
-- 11. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_agents TO authenticated;
GRANT SELECT, INSERT ON public.agent_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_skills TO authenticated;
GRANT SELECT, INSERT ON public.skill_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.marketplace_listings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.marketplace_installations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_definitions TO authenticated;
GRANT SELECT, INSERT ON public.workflow_versions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workflow_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_triggers TO authenticated;

-- ============================================================
-- NOTES:
-- - All tables use RLS with workspace membership checks
-- - Agents support versioning and skill assignments
-- - Skills support instruction-based expertise packaging
-- - Marketplace supports private/workspace/public visibility
-- - Workflows use DAG-based execution with trigger system
-- - All entities support versioning for audit and rollback
