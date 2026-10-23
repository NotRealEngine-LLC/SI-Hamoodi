-- HAMOODI SyntheTech Intelligence — Phase 04 Migration
-- Workspaces, Hubs, Files, Collaboration Foundation

-- ============================================================
-- 1. WORKSPACES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  description TEXT CHECK (char_length(description) <= 2000),
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'team')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  icon TEXT CHECK (char_length(icon) <= 50),
  color TEXT CHECK (char_length(color) <= 50),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_type ON public.workspaces(type);

-- RLS: Users can access workspaces they own or are members of
CREATE POLICY "Users can view owned workspaces"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update workspaces"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  )
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete workspaces"
  ON public.workspaces FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ============================================================
-- 2. WORKSPACE MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);

-- RLS: Members can view their workspace memberships
CREATE POLICY "Members can view workspace memberships"
  ON public.workspace_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners and admins can manage members"
  ON public.workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON public.workspace_members FOR UPDATE
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

CREATE POLICY "Owners and admins can delete members"
  ON public.workspace_members FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- ============================================================
-- 3. HUBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  description TEXT CHECK (char_length(description) <= 2000),
  icon TEXT CHECK (char_length(icon) <= 50),
  color TEXT CHECK (char_length(color) <= 50),
  visibility TEXT NOT NULL DEFAULT 'workspace' CHECK (visibility IN ('workspace', 'restricted')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hubs_workspace ON public.hubs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_hubs_visibility ON public.hubs(visibility);

-- RLS: Workspace members can view workspace-visible hubs
CREATE POLICY "Workspace members can view hubs"
  ON public.hubs FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
    AND (
      visibility = 'workspace' 
      OR id IN (SELECT hub_id FROM public.hub_members WHERE user_id = auth.uid())
      OR workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can create hubs"
  ON public.hubs FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Hub managers can update hubs"
  ON public.hubs FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
    OR id IN (SELECT hub_id FROM public.hub_members WHERE user_id = auth.uid() AND role = 'manager')
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "Workspace owners/admins can delete hubs"
  ON public.hubs FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

-- ============================================================
-- 4. HUB MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hub_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('manager', 'editor', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(hub_id, user_id)
);

ALTER TABLE public.hub_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hub_members_hub ON public.hub_members(hub_id);
CREATE INDEX IF NOT EXISTS idx_hub_members_user ON public.hub_members(user_id);

-- RLS: Hub managers and workspace admins can manage hub members
CREATE POLICY "Hub managers can view hub members"
  ON public.hub_members FOR SELECT
  TO authenticated
  USING (
    hub_id IN (
      SELECT id FROM public.hubs 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Hub managers can manage members"
  ON public.hub_members FOR ALL
  TO authenticated
  USING (
    hub_id IN (
      SELECT id FROM public.hubs 
      WHERE created_by = auth.uid()
      OR id IN (SELECT hub_id FROM public.hub_members WHERE user_id = auth.uid() AND role = 'manager')
      OR workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
  )
  WITH CHECK (
    hub_id IN (
      SELECT id FROM public.hubs 
      WHERE created_by = auth.uid()
      OR id IN (SELECT hub_id FROM public.hub_members WHERE user_id = auth.uid() AND role = 'manager')
      OR workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
  );

-- ============================================================
-- 5. HUB INSTRUCTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hub_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_id UUID NOT NULL REFERENCES public.hubs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hub_instructions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_hub_instructions_hub ON public.hub_instructions(hub_id);

-- RLS: Hub members can view instructions
CREATE POLICY "Hub members can view instructions"
  ON public.hub_instructions FOR SELECT
  TO authenticated
  USING (
    hub_id IN (
      SELECT id FROM public.hubs 
      WHERE visibility = 'workspace' AND workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
      )
      OR id IN (SELECT hub_id FROM public.hub_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Hub editors can manage instructions"
  ON public.hub_instructions FOR ALL
  TO authenticated
  USING (
    hub_id IN (
      SELECT id FROM public.hubs 
      WHERE created_by = auth.uid()
      OR id IN (SELECT hub_id FROM public.hub_members WHERE user_id = auth.uid() AND role IN ('manager', 'editor'))
      OR workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
  )
  WITH CHECK (
    hub_id IN (
      SELECT id FROM public.hubs 
      WHERE created_by = auth.uid()
      OR id IN (SELECT hub_id FROM public.hub_members WHERE user_id = auth.uid() AND role IN ('manager', 'editor'))
      OR workspace_id IN (
        SELECT id FROM public.workspaces 
        WHERE owner_id = auth.uid() 
        OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
      )
    )
    AND updated_by = auth.uid()
  );

-- ============================================================
-- 6. EXTEND PROJECTS TABLE
-- ============================================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS hub_id UUID REFERENCES public.hubs(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_projects_workspace ON public.projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_hub ON public.projects(hub_id);

-- Add constraint: project's hub must belong to same workspace
ALTER TABLE public.projects ADD CONSTRAINT chk_project_hub_workspace CHECK (
  hub_id IS NULL OR
  workspace_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.hubs h
    WHERE h.id = projects.hub_id AND h.workspace_id = projects.workspace_id
  )
);

-- Update RLS for projects to include workspace access
DROP POLICY IF EXISTS "Owner can select projects" ON public.projects;
DROP POLICY IF EXISTS "Owner can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Owner can update projects" ON public.projects;
DROP POLICY IF EXISTS "Owner can delete projects" ON public.projects;

CREATE POLICY "Workspace members can select projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (workspace_id IS NULL OR workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    ))
  );

CREATE POLICY "Workspace editors can update projects"
  ON public.projects FOR UPDATE
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

CREATE POLICY "Workspace editors can delete projects"
  ON public.projects FOR DELETE
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
-- 7. FILE FOLDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_file_folders_workspace ON public.file_folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_hub ON public.file_folders(hub_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_project ON public.file_folders(project_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_parent ON public.file_folders(parent_folder_id);

-- RLS: Workspace members can access folders
CREATE POLICY "Workspace members can view folders"
  ON public.file_folders FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can manage folders"
  ON public.file_folders FOR ALL
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
    AND created_by = auth.uid()
  );

-- ============================================================
-- 8. WORKSPACE FILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  hub_id UUID REFERENCES public.hubs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL CHECK (char_length(display_name) > 0 AND char_length(display_name) <= 500),
  original_name TEXT NOT NULL CHECK (char_length(original_name) > 0 AND char_length(original_name) <= 500),
  storage_bucket TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'ready', 'failed', 'deleted')),
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspace_files_workspace ON public.workspace_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_hub ON public.workspace_files(hub_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_project ON public.workspace_files(project_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_folder ON public.workspace_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_workspace_files_uploaded_by ON public.workspace_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_workspace_files_status ON public.workspace_files(upload_status);

-- RLS: Workspace members can access files
CREATE POLICY "Workspace members can view files"
  ON public.workspace_files FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Workspace editors can upload files"
  ON public.workspace_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

CREATE POLICY "Workspace editors can update files"
  ON public.workspace_files FOR UPDATE
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

CREATE POLICY "Workspace editors can delete files"
  ON public.workspace_files FOR DELETE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
    )
  );

-- ============================================================
-- 9. WORKSPACE INVITATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_role TEXT NOT NULL DEFAULT 'viewer' CHECK (invited_role IN ('admin', 'editor', 'viewer')),
  token_hash TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_workspace_invitations_workspace ON public.workspace_invitations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON public.workspace_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON public.workspace_invitations(token_hash);

-- RLS: Workspace admins can manage invitations
CREATE POLICY "Workspace admins can view invitations"
  ON public.workspace_invitations FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "Workspace admins can create invitations"
  ON public.workspace_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND
    workspace_id IN (
      SELECT id FROM public.workspaces 
      WHERE owner_id = auth.uid() 
      OR id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "Workspace admins can update invitations"
  ON public.workspace_invitations FOR UPDATE
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
-- 10. BACKFILL EXISTING USERS
-- ============================================================
-- Create personal workspaces for existing users with projects
DO $$
DECLARE
  user_record RECORD;
  workspace_id UUID;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT owner_id FROM public.projects WHERE owner_id IS NOT NULL
  LOOP
    -- Check if user already has a personal workspace
    IF NOT EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE owner_id = user_record.owner_id AND type = 'personal'
    ) THEN
      -- Create personal workspace
      INSERT INTO public.workspaces (name, type, owner_id, description)
      VALUES ('My Workspace', 'personal', user_record.owner_id, 'Your personal workspace')
      RETURNING id INTO workspace_id;
      
      -- Create owner membership
      INSERT INTO public.workspace_members (workspace_id, user_id, role)
      VALUES (workspace_id, user_record.owner_id, 'owner');
      
      -- Update existing projects to belong to this workspace
      UPDATE public.projects 
      SET workspace_id = workspace_id 
      WHERE owner_id = user_record.owner_id AND workspace_id IS NULL;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 11. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hubs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hub_instructions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_invitations TO authenticated;

-- ============================================================
-- NOTES:
-- - All new tables use RLS with workspace membership checks
-- - Existing projects are backfilled into personal workspaces
-- - Hub visibility supports 'workspace' and 'restricted' modes
-- - File storage uses Supabase Storage with metadata in database
-- - Invitation system uses secure token hashes
-- - Role-based access control enforced at database level
