# HAMOODI SyntheTech Intelligence

**SI — Synthetic Intelligence**  
Founded by BhaiSazzaD

---

## Phase 04: Advanced Workspaces, Hubs & Cloud File Management

This phase transforms HAMOODI SI into a multi-tenant, organized intelligence operating environment with workspaces, hubs, file management, and collaboration infrastructure.

### Features

#### Workspace System
- Personal and team workspaces
- Workspace switcher with premium UI
- Role-based access control (owner/admin/editor/viewer)
- Automatic personal workspace creation
- Safe migration from Phase 03

#### Hub System
- Contextual project organization
- Hub visibility modes (workspace-wide vs restricted)
- Hub membership and access control
- Custom instructions for AI context
- Hub dashboard with project/file counts

#### File Management
- Cloud file storage via Supabase Storage
- Drag-and-drop file upload
- File browsing with grid/list views
- Folder organization
- File search and filtering
- Secure signed URLs for private files
- 25 MB file size limit

#### Database
- 8 new tables with Row Level Security
- Extended projects table with workspace/hub relationships
- Proper indexes and constraints
- Safe migration for existing data

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hamoodi-si
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_APP_URL=http://localhost:3000
   ```

4. **Run database migrations**
   - Open the Supabase SQL Editor
   - Run `supabase/migrations/001_initial_schema.sql` (Phase 03)
   - Run `supabase/migrations/002_workspaces_hubs_files.sql` (Phase 04)
   - Or use Supabase CLI:
   ```bash
   npx supabase db push
   ```

5. **Configure Storage**
   - In Supabase Dashboard → Storage
   - Create a new bucket named `si-workspace-files`
   - Set it to **private**
   - Configure file size limits (recommended: 25 MB)
   - Add storage policies for authenticated users

6. **Configure Auth Providers (optional)**
   - Enable Email provider (enabled by default)
   - Configure Google OAuth if desired
   - Set redirect URLs to include `http://localhost:3000/auth/callback`

7. **Start development**
   ```bash
   npm run dev
   ```

### Architecture

```
src/
├── contexts/
│   ├── AuthContext.tsx                    # Authentication
│   ├── WorkspaceContext.tsx               # Local/Cloud data
│   ├── WorkspaceManagementContext.tsx     # Workspaces & Hubs
│   └── FileContext.tsx                    # File management
├── components/
│   ├── CloudStatus.tsx                    # Sync indicator
│   └── WorkspaceSwitcher.tsx              # Workspace selection
├── pages/
│   ├── AuthPages.tsx                      # Auth UI
│   ├── WorkspacePage.tsx                  # Main workspace
│   ├── HubsPage.tsx                       # Hub management
│   └── FilesPage.tsx                      # File browser
└── lib/
    ├── supabase/
    │   ├── client.ts
    │   ├── config.ts
    │   └── types.ts
    └── puter/
        └── ai.ts
```

### Database Schema

#### Core Tables
- `profiles` — User display information
- `user_preferences` — Synced workspace settings
- `workspaces` — Top-level organizational containers
- `workspace_members` — User membership with roles
- `hubs` — Contextual project groupings
- `hub_members` — Hub-specific access control
- `hub_instructions` — AI context instructions
- `projects` — Work units (extended with workspace_id, hub_id)
- `conversations` — AI conversation threads
- `messages` — Individual messages
- `file_folders` — Virtual folder organization
- `workspace_files` — File metadata
- `workspace_invitations` — Collaboration invitations
- `activity_events` — Workspace activity history

### Security Model

- **Row Level Security** on all tables
- **Role-based access** (owner/admin/editor/viewer)
- **Workspace membership** verified at database level
- **Private file storage** with signed URLs
- **No cross-tenant data access**
- **CHECK constraints** prevent invalid relationships

### Workspace Modes

| Mode | Description |
|------|-------------|
| **Local Guest** | Browser localStorage, no account required |
| **Cloud Personal** | Single-user cloud workspace |
| **Cloud Team** | Multi-user collaborative workspace |

### File Management

#### Upload Limits
- Maximum file size: 25 MB
- Supported types: PDF, TXT, MD, CSV, DOCX, XLSX, PNG, JPG, WEBP, JSON, and more

#### Storage Structure
```
si-workspace-files/
└── workspaces/{workspaceId}/
    └── objects/{fileId}/
        └── {filename}
```

#### Security
- Private bucket (no public access)
- Signed URLs with 1-hour expiration
- Access verified through workspace membership

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes (for cloud) | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes (for cloud) | Anon/publishable key |
| `VITE_APP_URL` | No | Application URL for callbacks |

### Building for Production

```bash
npm run build
```

Output is in `dist/` directory.

### Documentation

- [Phase 03 Handoff](docs/part-03-handoff.md) — Authentication & Cloud Database
- [Phase 04 Handoff](docs/part-04-handoff.md) — Workspaces, Hubs & Files
- [Database Schema](docs/database-schema.md) — Complete schema documentation
- [Auth Architecture](docs/auth-architecture.md) — Authentication system
- [RLS Security](docs/rls-security.md) — Row Level Security policies
- [Migration Strategy](docs/migration-strategy.md) — Local-to-cloud migration

### Known Limitations

1. Hub instructions not yet integrated with AI context
2. File preview limited for PDF/Office documents
3. Invitation email delivery not configured
4. Cross-workspace project moves not supported
5. Real-time collaboration not implemented
6. Advanced semantic search not implemented

### Next Phase (05)

Phase 05 will focus on:
- AI context integration with Hub instructions
- Advanced file preview and editing
- Invitation email delivery
- Real-time collaboration
- Workspace analytics

---

**HAMOODI SyntheTech Intelligence** — Phase 04 / 12  
*Advanced Workspaces • Intelligent Hubs • Cloud File Management*  
*Founded by BhaiSazzaD*
