-- HAMOODI SyntheTech Intelligence — Database Migration
-- Phase 03: Core Schema, RLS Policies, Indexes
-- Command ID: HAMOODI-SI-MP-03

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- RLS: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- RLS: Users can insert their own profile (first login)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================
-- 2. USER PREFERENCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  default_model_id TEXT,
  stream_responses BOOLEAN NOT NULL DEFAULT TRUE,
  project_view TEXT NOT NULL DEFAULT 'grid' CHECK (project_view IN ('grid', 'list')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can upsert own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. PROJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  description TEXT CHECK (char_length(description) <= 2000),
  icon TEXT CHECK (char_length(icon) <= 50),
  color TEXT CHECK (char_length(color) <= 50),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner_updated ON public.projects(owner_id, updated_at DESC);

-- RLS: Users can only access their own projects
CREATE POLICY "Owner can select projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- 4. CONVERSATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) > 0 AND char_length(title) <= 500),
  selected_model_id TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure project belongs to same owner
  CONSTRAINT chk_conversation_project_owner CHECK (
    project_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = conversations.project_id AND p.owner_id = conversations.owner_id
    )
  )
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_owner_id ON public.conversations(owner_id);
CREATE INDEX IF NOT EXISTS idx_conversations_owner_updated ON public.conversations(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON public.conversations(project_id);

-- RLS: Users can only access their own conversations
CREATE POLICY "Owner can select conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can insert conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete conversations"
  ON public.conversations FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- 5. MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'streaming', 'completed', 'failed', 'cancelled')),
  model_id TEXT,
  error_code TEXT,
  sequence_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure conversation belongs to same owner
  CONSTRAINT chk_message_conversation_owner CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.owner_id = messages.owner_id
    )
  )
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_seq ON public.messages(conversation_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_messages_owner_id ON public.messages(owner_id);

-- RLS: Users can only access messages in their own conversations
CREATE POLICY "Owner can select messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can delete messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- 6. ACTIVITY EVENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (char_length(event_type) <= 100),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('project', 'conversation', 'message', 'system')),
  subject_id UUID,
  summary TEXT NOT NULL CHECK (char_length(summary) <= 500),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_owner_created ON public.activity_events(owner_id, created_at DESC);

-- RLS: Users can only access their own activity
CREATE POLICY "Owner can select activity"
  ON public.activity_events FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owner can insert activity"
  ON public.activity_events FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owner can update activity"
  ON public.activity_events FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ============================================================
-- 7. LOCAL IMPORT BATCHES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.local_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  projects_count INTEGER NOT NULL DEFAULT 0,
  conversations_count INTEGER NOT NULL DEFAULT 0,
  messages_count INTEGER NOT NULL DEFAULT 0,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.local_import_batches ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_import_batches_user ON public.local_import_batches(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_import_batches_fingerprint ON public.local_import_batches(user_id, fingerprint);

-- RLS
CREATE POLICY "Owner can select import batches"
  ON public.local_import_batches FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can insert import batches"
  ON public.local_import_batches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update import batches"
  ON public.local_import_batches FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.activity_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.local_import_batches TO authenticated;

-- ============================================================
-- NOTES:
-- - All tables use RLS with ownership predicates
-- - No SECURITY DEFINER functions used
-- - Cross-user relationships prevented via CHECK constraints
-- - Project deletion detaches conversations (ON DELETE SET NULL)
-- - Message deletion cascades with conversation deletion
-- - Import batches use fingerprints for idempotency
