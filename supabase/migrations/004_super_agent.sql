-- HAMOODI SyntheTech Intelligence — Phase 06 Migration
-- Super Agent: Autonomous Planning & Multi-Agent Orchestration

-- ============================================================
-- 1. AGENT RUNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  initiated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Goal & Plan
  objective TEXT NOT NULL,
  plan JSONB,
  plan_version INTEGER NOT NULL DEFAULT 1,
  plan_approved_at TIMESTAMPTZ,
  plan_approved_by UUID REFERENCES auth.users(id),
  
  -- Execution State
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'planning', 'awaiting_plan_approval', 'queued', 'running',
    'paused', 'awaiting_approval', 'awaiting_client', 'cancelling',
    'cancelled', 'completed', 'partially_completed', 'failed'
  )),
  
  -- Configuration
  execution_mode TEXT NOT NULL DEFAULT 'interactive' CHECK (execution_mode IN ('interactive', 'durable', 'hybrid')),
  model_policy TEXT NOT NULL DEFAULT 'balanced',
  budget JSONB NOT NULL DEFAULT '{}',
  
  -- Execution Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_model_calls INTEGER NOT NULL DEFAULT 0,
  total_tool_calls INTEGER NOT NULL DEFAULT 0,
  total_tokens_used INTEGER NOT NULL DEFAULT 0,
  
  -- Results
  final_result JSONB,
  execution_report JSONB,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_runs_workspace ON public.agent_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_initiated_by ON public.agent_runs(initiated_by);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON public.agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON public.agent_runs(created_at DESC);

-- RLS: Workspace members can view runs
CREATE POLICY "Workspace members can view agent runs"
  ON public.agent_runs FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create agent runs"
  ON public.agent_runs FOR INSERT
  TO authenticated
  WITH CHECK (
    initiated_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update agent runs"
  ON public.agent_runs FOR UPDATE
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
-- 2. AGENT TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  
  -- Task Definition
  title TEXT NOT NULL,
  description TEXT,
  expected_output TEXT,
  assigned_role TEXT NOT NULL CHECK (assigned_role IN ('planner', 'research', 'analyst', 'creator', 'reviewer', 'coordinator')),
  
  -- Dependencies
  dependencies UUID[] DEFAULT '{}',
  
  -- Execution State
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'ready', 'running', 'awaiting_approval', 'blocked',
    'retrying', 'completed', 'skipped', 'cancelled', 'failed'
  )),
  
  -- Execution Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  model_id TEXT,
  model_calls INTEGER NOT NULL DEFAULT 0,
  tool_calls INTEGER NOT NULL DEFAULT 0,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Results
  output JSONB,
  verification_status TEXT CHECK (verification_status IN ('verified', 'reviewed', 'unverified', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_tasks_run ON public.agent_tasks(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON public.agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_role ON public.agent_tasks(assigned_role);

-- RLS: Tasks inherit run permissions
CREATE POLICY "Workspace members can view agent tasks"
  ON public.agent_tasks FOR SELECT
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "System can create agent tasks"
  ON public.agent_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

CREATE POLICY "System can update agent tasks"
  ON public.agent_tasks FOR UPDATE
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  )
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================================
-- 3. AGENT EXECUTION EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  
  -- Event Data
  event_type TEXT NOT NULL,
  agent_role TEXT,
  event_data JSONB NOT NULL DEFAULT '{}',
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_execution_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_events_run ON public.agent_execution_events(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_task ON public.agent_execution_events(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_created ON public.agent_execution_events(created_at DESC);

-- RLS: Events inherit run permissions
CREATE POLICY "Workspace members can view execution events"
  ON public.agent_execution_events FOR SELECT
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "System can create execution events"
  ON public.agent_execution_events FOR INSERT
  TO authenticated
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================================
-- 4. AGENT CHECKPOINTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  
  -- Checkpoint Data
  checkpoint_version INTEGER NOT NULL,
  graph_state JSONB NOT NULL,
  completed_tasks UUID[] NOT NULL DEFAULT '{}',
  pending_tasks UUID[] NOT NULL DEFAULT '{}',
  task_outputs JSONB NOT NULL DEFAULT '{}',
  outstanding_approvals UUID[] NOT NULL DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_run ON public.agent_checkpoints(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_version ON public.agent_checkpoints(run_id, checkpoint_version DESC);

-- RLS: Checkpoints inherit run permissions
CREATE POLICY "Workspace members can view checkpoints"
  ON public.agent_checkpoints FOR SELECT
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "System can create checkpoints"
  ON public.agent_checkpoints FOR INSERT
  TO authenticated
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

-- ============================================================
-- 5. AGENT APPROVALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  
  -- Approval Request
  requested_by_agent TEXT NOT NULL,
  requested_action TEXT NOT NULL,
  arguments_hash TEXT NOT NULL,
  display_arguments JSONB NOT NULL DEFAULT '{}',
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Approval State
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  decision_reason TEXT,
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_approvals_run ON public.agent_approvals(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_status ON public.agent_approvals(status);
CREATE INDEX IF NOT EXISTS idx_agent_approvals_expires ON public.agent_approvals(expires_at);

-- RLS: Approvals inherit run permissions
CREATE POLICY "Workspace members can view approvals"
  ON public.agent_approvals FOR SELECT
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "System can create approvals"
  ON public.agent_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

CREATE POLICY "Workspace admins can update approvals"
  ON public.agent_approvals FOR UPDATE
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
  )
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
  );

-- ============================================================
-- 6. AGENT TOOL EXECUTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  
  -- Tool Execution
  tool_id TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}',
  output JSONB,
  
  -- Execution Metadata
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  execution_time_ms INTEGER,
  error_message TEXT,
  
  -- Idempotency
  idempotency_key TEXT NOT NULL,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.agent_tool_executions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_agent_tool_execs_run ON public.agent_tool_executions(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_execs_task ON public.agent_tool_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_tool_execs_idempotency ON public.agent_tool_executions(idempotency_key);

-- RLS: Tool executions inherit run permissions
CREATE POLICY "Workspace members can view tool executions"
  ON public.agent_tool_executions FOR SELECT
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "System can create tool executions"
  ON public.agent_tool_executions FOR INSERT
  TO authenticated
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  );

CREATE POLICY "System can update tool executions"
  ON public.agent_tool_executions FOR UPDATE
  TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.agent_runs
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
      )
    )
  )
  WITH CHECK (
    run_id IN (
      SELECT id FROM public.agent_runs
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
GRANT SELECT, INSERT, UPDATE ON public.agent_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agent_tasks TO authenticated;
GRANT SELECT, INSERT ON public.agent_execution_events TO authenticated;
GRANT SELECT, INSERT ON public.agent_checkpoints TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agent_approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.agent_tool_executions TO authenticated;

-- ============================================================
-- NOTES:
-- - All tables use RLS with workspace membership checks
-- - Agent runs track complete execution lifecycle
-- - Tasks form a DAG with explicit dependencies
-- - Checkpoints enable durable execution and recovery
-- - Approvals provide human-in-the-loop control
-- - Tool executions track all authorized actions
-- - Events provide full execution audit trail
