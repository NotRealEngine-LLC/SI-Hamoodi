-- HAMOODI SyntheTech Intelligence — Phase 05 Migration
-- SI Core Intelligence, Multi-Model Gateway, Advanced Chat Engine

-- ============================================================
-- 1. EXTEND MESSAGES TABLE
-- ============================================================
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS generation_id TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS provider_adapter TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS token_usage JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_workspace ON public.messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent ON public.messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_generation ON public.messages(generation_id);

-- ============================================================
-- 2. EXTEND CONVERSATIONS TABLE
-- ============================================================
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS parent_conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS forked_from_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS branch_label TEXT;

CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON public.conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_conversations_parent ON public.conversations(parent_conversation_id);

-- Add constraint: conversation's workspace must match project's workspace
ALTER TABLE public.conversations ADD CONSTRAINT chk_conversation_workspace_match CHECK (
  workspace_id IS NULL OR
  project_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = conversations.project_id 
    AND (p.workspace_id IS NULL OR p.workspace_id = conversations.workspace_id)
  )
);

-- ============================================================
-- 3. GENERATION TRACES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generation_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider_adapter TEXT NOT NULL,
  model_id TEXT NOT NULL,
  request_metadata JSONB DEFAULT '{}',
  response_metadata JSONB DEFAULT '{}',
  token_usage JSONB DEFAULT '{}',
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'cancelled')),
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.generation_traces ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_generation_traces_conversation ON public.generation_traces(conversation_id);
CREATE INDEX IF NOT EXISTS idx_generation_traces_workspace ON public.generation_traces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generation_traces_created ON public.generation_traces(created_at DESC);

-- RLS: Users can view traces for their conversations
CREATE POLICY "Users can view generation traces"
  ON public.generation_traces FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert generation traces"
  ON public.generation_traces FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- ============================================================
-- 4. AI MODEL PREFERENCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_model_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, model_id)
);

ALTER TABLE public.ai_model_preferences ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_model_preferences_user ON public.ai_model_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_model_preferences_favorite ON public.ai_model_preferences(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_model_preferences_last_used ON public.ai_model_preferences(user_id, last_used_at DESC);

-- RLS: Users can only manage their own preferences
CREATE POLICY "Users can view own model preferences"
  ON public.ai_model_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own model preferences"
  ON public.ai_model_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own model preferences"
  ON public.ai_model_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own model preferences"
  ON public.ai_model_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 5. AI CONFIGURATION PRESETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  system_prompt TEXT,
  temperature REAL CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER CHECK (max_tokens > 0 AND max_tokens <= 128000),
  top_p REAL CHECK (top_p >= 0 AND top_p <= 1),
  frequency_penalty REAL CHECK (frequency_penalty >= -2 AND frequency_penalty <= 2),
  presence_penalty REAL CHECK (presence_penalty >= -2 AND presence_penalty <= 2),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_presets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_presets_user ON public.ai_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_presets_workspace ON public.ai_presets(workspace_id);

-- RLS: Users can manage their own presets or workspace presets
CREATE POLICY "Users can view own or workspace presets"
  ON public.ai_presets FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create own presets"
  ON public.ai_presets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "Users can update own or workspace presets"
  ON public.ai_presets FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "Users can delete own presets"
  ON public.ai_presets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- 6. BACKFILL EXISTING DATA
-- ============================================================
-- Backfill workspace_id for existing conversations
DO $$
DECLARE
  convo_record RECORD;
  ws_id UUID;
BEGIN
  FOR convo_record IN 
    SELECT c.id as convo_id, c.owner_id, p.workspace_id 
    FROM public.conversations c
    LEFT JOIN public.projects p ON c.project_id = p.id
    WHERE c.workspace_id IS NULL
  LOOP
    -- Get or create personal workspace for owner
    SELECT id INTO ws_id FROM public.workspaces 
    WHERE owner_id = convo_record.owner_id AND type = 'personal'
    LIMIT 1;
    
    IF ws_id IS NULL THEN
      -- Create personal workspace
      INSERT INTO public.workspaces (name, type, owner_id, description)
      VALUES ('My Workspace', 'personal', convo_record.owner_id, 'Your personal workspace')
      RETURNING id INTO ws_id;
      
      -- Create owner membership
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES (ws_id, convo_record.owner_id, 'owner');
    END IF;
    
    -- Update conversation with workspace_id
    UPDATE public.conversations 
    SET workspace_id = ws_id 
    WHERE id = convo_record.convo_id;
  END LOOP;
END $$;

-- Backfill workspace_id for existing messages
UPDATE public.messages m
SET workspace_id = c.workspace_id
FROM public.conversations c
WHERE m.conversation_id = c.id
AND m.workspace_id IS NULL
AND c.workspace_id IS NOT NULL;

-- ============================================================
-- 7. UPDATE EXISTING RLS POLICIES
-- ============================================================
-- Update conversations RLS to include workspace access
DROP POLICY IF EXISTS "Owner can select conversations" ON public.conversations;
DROP POLICY IF EXISTS "Owner can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Owner can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Owner can delete conversations" ON public.conversations;

CREATE POLICY "Workspace members can select conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can insert conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (workspace_id IS NULL OR workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    ))
  );

CREATE POLICY "Workspace editors can update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can delete conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- Update messages RLS to include workspace access
DROP POLICY IF EXISTS "Owner can select messages" ON public.messages;
DROP POLICY IF EXISTS "Owner can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Owner can update messages" ON public.messages;
DROP POLICY IF EXISTS "Owner can delete messages" ON public.messages;

CREATE POLICY "Workspace members can select messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (workspace_id IS NULL OR workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    ))
  );

CREATE POLICY "Workspace editors can update messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  )
  WITH CHECK (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can delete messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- ============================================================
-- 8. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.generation_traces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_model_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_presets TO authenticated;

-- ============================================================
-- NOTES:
-- - All new tables use RLS with workspace membership checks
-- - Existing conversations/messages backfilled with workspace_id
-- - Generation traces track AI request/response metadata
-- - Model preferences track user favorites and usage
-- - AI presets allow saved configuration templates
-- - Branching supported via parent_conversation_id and forked_from_message_id
-- - Message versioning supported via parent_message_id
