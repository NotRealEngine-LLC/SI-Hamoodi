# HAMOODI SyntheTech Intelligence

**SI — Synthetic Intelligence**  
Founded by BhaiSazzaD

---

## Phase 03: Secure Authentication & Cloud Database

This phase implements the secure identity and persistence infrastructure for HAMOODI SI, transforming the application into a cloud-connected platform with real user accounts and persistent data.

### Features Implemented

#### Authentication
- ✅ Email/password sign up and sign in
- ✅ Email verification flow
- ✅ Password recovery (forgot/reset)
- ✅ Secure session management with token refresh
- ✅ Google OAuth support (when configured)
- ✅ Authentication state management (guest/authenticated)

#### Database
- ✅ PostgreSQL schema with proper relationships
- ✅ Row Level Security on all tables
- ✅ Cross-user data isolation via ownership constraints
- ✅ Database migrations (reproducible)
- ✅ Typed database integration

#### Workspace
- ✅ Local guest mode (data stored in browser)
- ✅ Cloud workspace mode (Supabase-backed)
- ✅ Projects CRUD with cloud persistence
- ✅ Conversations with messages
- ✅ Activity tracking
- ✅ User preferences (synced across devices)

#### Data Migration
- ✅ Local-to-cloud import wizard
- ✅ ID mapping for relationship preservation
- ✅ Idempotent import with fingerprinting
- ✅ Partial failure handling

#### Security
- ✅ RLS policies prevent cross-user data access
- ✅ No hardcoded credentials
- ✅ Service role keys never exposed to browser
- ✅ CHECK constraints prevent invalid ownership
- ✅ Secure redirect handling

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
   - Copy your project URL and anon/publishable key
   - Create `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_APP_URL=http://localhost:3000
   ```

4. **Run database migrations**
   - Open the Supabase SQL Editor
   - Run the contents of `supabase/migrations/001_initial_schema.sql`
   - Or use Supabase CLI:
   ```bash
   npx supabase db push
   ```

5. **Configure Auth Providers (optional)**
   - In Supabase Dashboard → Authentication → Providers
   - Enable Email provider (enabled by default)
   - Configure Google OAuth if desired
   - Set redirect URLs to include `http://localhost:3000/auth/callback`

6. **Start development**
   ```bash
   npm run dev
   ```

### Architecture

```
src/
├── App.tsx                    # Application router
├── main.tsx                   # Entry point
├── index.css                  # Global styles
├── vite-env.d.ts             # Vite type declarations
├── contexts/
│   ├── AuthContext.tsx        # Authentication state & actions
│   └── WorkspaceContext.tsx   # Data management (local/cloud)
├── lib/
│   └── supabase/
│       ├── client.ts          # Supabase client instance
│       ├── config.ts          # Configuration & validation
│       └── types.ts           # Database TypeScript types
└── pages/
    ├── AuthPages.tsx          # Sign in, sign up, forgot password
    └── WorkspacePage.tsx      # Main workspace UI
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User display name, avatar |
| `user_preferences` | Theme, motion, view settings |
| `projects` | User projects with metadata |
| `conversations` | AI conversations, optionally linked to projects |
| `messages` | Individual messages within conversations |
| `activity_events` | Workspace activity history |
| `local_import_batches` | Track local-to-cloud migrations |

### Security Model

- **Row Level Security** enabled on all tables
- **Ownership predicates** ensure users can only access their own data
- **CHECK constraints** prevent invalid cross-user relationships
- **No SECURITY DEFINER functions** used
- **Publishable key** safe for browser exposure
- **Service role key** never used in client code

### Workspace Modes

| Mode | Data Storage | Features |
|------|-------------|----------|
| **Local Guest** | Browser localStorage | Projects, conversations, preferences |
| **Cloud** | Supabase PostgreSQL | All local features + cross-device sync |

### HAMOODI vs Puter Authentication

These are separate systems:
- **HAMOODI Account** (Supabase): User identity, cloud data, workspace
- **AI Provider** (Puter.js): AI generation authorization

They are displayed independently in settings.

### Building for Production

```bash
npm run build
```

Output is in `dist/` directory.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes (for cloud) | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes (for cloud) | Anon/publishable key |
| `VITE_APP_URL` | No | Application URL for callbacks |

Without Supabase credentials, the app runs in local guest mode.

---

**HAMOODI SyntheTech Intelligence** — Phase 03 / 12  
*Building the future of unified intelligence*
