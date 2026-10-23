-- HAMOODI SyntheTech Intelligence — Phase 08 Migration
-- MCP Ecosystem, External Integrations & OAuth Authorization

-- ============================================================
-- 1. INTEGRATION PROVIDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.integration_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('mcp', 'oauth', 'api_key', 'builtin')),
  auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'oauth2', 'api_key', 'bearer')),
  
  -- OAuth Configuration
  oauth_authorize_url TEXT,
  oauth_token_url TEXT,
  oauth_client_id TEXT,
  oauth_scopes TEXT[],
  
  -- MCP Configuration
  mcp_endpoint_template TEXT,
  mcp_protocol_version TEXT DEFAULT '2026-07-28',
  
  -- Metadata
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.integration_providers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_integration_providers_name ON public.integration_providers(name);
CREATE INDEX IF NOT EXISTS idx_integration_providers_category ON public.integration_providers(category);

-- RLS: All authenticated users can view providers
CREATE POLICY "Authenticated users can view providers"
  ON public.integration_providers FOR SELECT
  TO authenticated
  USING (TRUE);

-- ============================================================
-- 2. INTEGRATION CONNECTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.integration_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.integration_providers(id) ON DELETE CASCADE,
  
  -- Connection Metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Connection State
  status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN (
    'unconfigured', 'connecting', 'auth_required', 'connected', 
    'degraded', 'disconnected', 'expired', 'failed', 'disabled'
  )),
  
  -- MCP Server Info
  mcp_endpoint TEXT,
  mcp_protocol_version TEXT,
  mcp_capabilities JSONB DEFAULT '{}',
  
  -- OAuth Info
  oauth_scopes TEXT[],
  oauth_expires_at TIMESTAMPTZ,
  
  -- Health
  last_health_check TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  last_error_code TEXT,
  last_error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_integration_connections_user ON public.integration_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_workspace ON public.integration_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_provider ON public.integration_connections(provider_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_status ON public.integration_connections(status);

-- RLS: Users can view their own connections and workspace connections
CREATE POLICY "Users can view own connections"
  ON public.integration_connections FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create own connections"
  ON public.integration_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (workspace_id IS NULL OR workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    ))
  );

CREATE POLICY "Users can update own connections"
  ON public.integration_connections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own connections"
  ON public.integration_connections FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 3. INTEGRATION CREDENTIALS TABLE (ENCRYPTED)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  
  -- Encrypted Credential Storage
  credential_type TEXT NOT NULL CHECK (credential_type IN ('oauth_token', 'api_key', 'bearer_token')),
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  encrypted_api_key TEXT,
  
  -- Token Metadata
  token_expires_at TIMESTAMPTZ,
  token_scopes TEXT[],
  
  -- Security
  encryption_key_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_integration_credentials_connection ON public.integration_credentials(connection_id);

-- RLS: Credentials are NOT directly accessible via Data API
-- Access only through secure server-side functions
CREATE POLICY "No direct access to credentials"
  ON public.integration_credentials FOR SELECT
  TO authenticated
  USING (FALSE);

CREATE POLICY "No direct insert to credentials"
  ON public.integration_credentials FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

CREATE POLICY "No direct update to credentials"
  ON public.integration_credentials FOR UPDATE
  TO authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE POLICY "No direct delete to credentials"
  ON public.integration_credentials FOR DELETE
  TO authenticated
  USING (FALSE);

-- ============================================================
-- 4. MCP SERVERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.integration_connections(id) ON DELETE CASCADE,
  
  -- Server Identity
  server_name TEXT NOT NULL,
  server_version TEXT,
  
  -- Protocol
  protocol_version TEXT NOT NULL DEFAULT '2026-07-28',
  transport_type TEXT NOT NULL DEFAULT 'streamable_http' CHECK (transport_type IN ('streamable_http', 'stdio')),
  
  -- Capabilities
  capabilities JSONB NOT NULL DEFAULT '{}',
  tools_count INTEGER NOT NULL DEFAULT 0,
  resources_count INTEGER NOT NULL DEFAULT 0,
  prompts_count INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  last_connected_at TIMESTAMPTZ,
  last_discovery_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mcp_servers ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mcp_servers_connection ON public.mcp_servers(connection_id);

-- RLS: Inherit from connection
CREATE POLICY "Users can view MCP servers via connection"
  ON public.mcp_servers FOR SELECT
  TO authenticated
  USING (
    connection_id IN (
      SELECT id FROM public.integration_connections
      WHERE user_id = auth.uid() OR
      workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

-- ============================================================
-- 5. MCP TOOL DEFINITIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mcp_tool_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.mcp_servers(id) ON DELETE CASCADE,
  
  -- Tool Identity
  server_tool_name TEXT NOT NULL,
  namespaced_id TEXT NOT NULL, -- Format: connectionId:toolName
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Schemas
  input_schema JSONB NOT NULL,
  output_schema JSONB,
  schema_hash TEXT NOT NULL,
  
  -- Classification
  risk_level TEXT NOT NULL DEFAULT 'read' CHECK (risk_level IN ('read', 'write', 'sensitive', 'high_risk')),
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Discovery
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(server_id, server_tool_name)
);

ALTER TABLE public.mcp_tool_definitions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_mcp_tools_server ON public.mcp_tool_definitions(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_namespaced ON public.mcp_tool_definitions(namespaced_id);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_risk ON public.mcp_tool_definitions(risk_level);

-- RLS: Inherit from server/connection
CREATE POLICY "Users can view MCP tools via server"
  ON public.mcp_tool_definitions FOR SELECT
  TO authenticated
  USING (
    server_id IN (
      SELECT id FROM public.mcp_servers
      WHERE connection_id IN (
        SELECT id FROM public.integration_connections
        WHERE user_id = auth.uid() OR
        workspace_id IN (
          SELECT id FROM public.workspaces 
          WHERE owner_id = auth.uid() 
          OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can update MCP tools via server"
  ON public.mcp_tool_definitions FOR UPDATE
  TO authenticated
  USING (
    server_id IN (
      SELECT id FROM public.mcp_servers
      WHERE connection_id IN (
        SELECT id FROM public.integration_connections
        WHERE user_id = auth.uid() OR
        workspace_id IN (
          SELECT id FROM public.workspaces 
          WHERE owner_id = auth.uid() 
          OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
      )
    )
  )
  WITH CHECK (
    server_id IN (
      SELECT id FROM public.mcp_servers
      WHERE connection_id IN (
        SELECT id FROM public.integration_connections
        WHERE user_id = auth.uid() OR
        workspace_id IN (
          SELECT id FROM public.workspaces 
          WHERE owner_id = auth.uid() 
          OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
      )
    )
  );

-- ============================================================
-- 6. TOOL PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tool_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tool_namespaced_id TEXT NOT NULL,
  
  -- Permission State
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Metadata
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, tool_namespaced_id)
);

ALTER TABLE public.tool_permissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tool_permissions_user ON public.tool_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_permissions_tool ON public.tool_permissions(tool_namespaced_id);

-- RLS: Users can view their own permissions
CREATE POLICY "Users can view own permissions"
  ON public.tool_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own permissions"
  ON public.tool_permissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own permissions"
  ON public.tool_permissions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 7. TOOL EXECUTION EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tool_execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  workspace_id UUID REFERENCES public.workspaces(id),
  connection_id UUID REFERENCES public.integration_connections(id),
  tool_namespaced_id TEXT NOT NULL,
  
  -- Execution Context
  run_id UUID,
  task_id UUID,
  
  -- Execution Details
  status TEXT NOT NULL CHECK (status IN ('pending', 'validating', 'awaiting_approval', 'queued', 'running', 'completed', 'failed', 'cancelled', 'expired')),
  risk_level TEXT NOT NULL,
  
  -- Input/Output (Redacted)
  input_hash TEXT NOT NULL,
  input_redacted JSONB,
  output_summary TEXT,
  output_size_bytes INTEGER,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Approval
  approval_id UUID,
  
  -- Errors
  error_code TEXT,
  error_message TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tool_execution_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_tool_exec_events_user ON public.tool_execution_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_exec_events_workspace ON public.tool_execution_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tool_exec_events_connection ON public.tool_execution_events(connection_id);
CREATE INDEX IF NOT EXISTS idx_tool_exec_events_tool ON public.tool_execution_events(tool_namespaced_id);
CREATE INDEX IF NOT EXISTS idx_tool_exec_events_status ON public.tool_execution_events(status);
CREATE INDEX IF NOT EXISTS idx_tool_exec_events_created ON public.tool_execution_events(created_at DESC);

-- RLS: Users can view their own execution events
CREATE POLICY "Users can view own execution events"
  ON public.tool_execution_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "System can create execution events"
  ON public.tool_execution_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. GRANTS
-- ============================================================
GRANT SELECT ON public.integration_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_connections TO authenticated;
GRANT SELECT ON public.mcp_servers TO authenticated;
GRANT SELECT, UPDATE ON public.mcp_tool_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tool_permissions TO authenticated;
GRANT SELECT, INSERT ON public.tool_execution_events TO authenticated;

-- ============================================================
-- NOTES:
-- - All tables use RLS with workspace membership checks
-- - Credentials table is NOT accessible via Data API (security)
-- - MCP tools are namespaced to prevent collisions
-- - Tool permissions track user-specific enable/disable
-- - Execution events provide audit trail
-- - OAuth tokens are encrypted at rest
-- - Connection states track health and status
