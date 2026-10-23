# HAMOODI SI — Database Schema Documentation

## Overview

HAMOODI SI uses PostgreSQL via Supabase for cloud data persistence. All tables are protected by Row Level Security (RLS) with ownership-based access policies.

## Relationship Diagram

```
auth.users (Supabase Auth)
    │
    ├── profiles (1:1)
    ├── user_preferences (1:1)
    ├── projects (1:N)
    │       └── conversations (1:N, via project_id)
    ├── conversations (1:N)
    │       └── messages (1:N)
    ├── activity_events (1:N)
    └── local_import_batches (1:N)
```

---

## Tables

### 1. `profiles`

**Purpose:** User display information linked to auth.users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → auth.users(id) | Same as auth user ID |
| `display_name` | TEXT | Nullable | User's display name |
| `avatar_path` | TEXT | Nullable | Path to avatar in storage |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**RLS:**
- SELECT: `id = auth.uid()`
- INSERT: `id = auth.uid()`
- UPDATE: `id = auth.uid()` (both USING and WITH CHECK)

**Lifecycle:** Created on first login via upsert. Updated when user changes display name.

---

### 2. `user_preferences`

**Purpose:** Per-user workspace settings synced across devices.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | UUID | PK, FK → auth.users(id) | Auth user ID |
| `theme` | TEXT | NOT NULL, DEFAULT 'dark', CHECK IN ('dark','light','system') | UI theme |
| `reduced_motion` | BOOLEAN | NOT NULL, DEFAULT FALSE | Accessibility preference |
| `sidebar_collapsed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Sidebar state |
| `default_model_id` | TEXT | Nullable | Preferred AI model |
| `stream_responses` | BOOLEAN | NOT NULL, DEFAULT TRUE | AI streaming preference |
| `project_view` | TEXT | NOT NULL, DEFAULT 'grid', CHECK IN ('grid','list') | Project display mode |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**RLS:**
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`

**Lifecycle:** Created via upsert on first settings change. Updated on preference changes.

---

### 3. `projects`

**Purpose:** User-owned project containers for organizing conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique project ID |
| `owner_id` | UUID | NOT NULL, FK → auth.users(id) | Project owner |
| `name` | TEXT | NOT NULL, CHECK (length > 0 AND ≤ 255) | Project name |
| `description` | TEXT | CHECK (length ≤ 2000) | Optional description |
| `icon` | TEXT | CHECK (length ≤ 50) | Optional icon identifier |
| `color` | TEXT | CHECK (length ≤ 50) | Optional color value |
| `is_pinned` | BOOLEAN | NOT NULL, DEFAULT FALSE | Pin status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_projects_owner_id` — owner_id
- `idx_projects_owner_updated` — (owner_id, updated_at DESC)

**RLS:**
- SELECT: `owner_id = auth.uid()`
- INSERT: `owner_id = auth.uid()`
- UPDATE: `owner_id = auth.uid()` (both USING and WITH CHECK)
- DELETE: `owner_id = auth.uid()`

**Deletion behavior:** Conversations linked to this project have their `project_id` set to NULL (ON DELETE SET NULL). Messages are NOT deleted.

---

### 4. `conversations`

**Purpose:** AI conversation threads, optionally linked to a project.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique conversation ID |
| `owner_id` | UUID | NOT NULL, FK → auth.users(id) | Conversation owner |
| `project_id` | UUID | FK → projects(id), Nullable, ON DELETE SET NULL | Optional project link |
| `title` | TEXT | NOT NULL, CHECK (length > 0 AND ≤ 500) | Conversation title |
| `selected_model_id` | TEXT | Nullable | AI model used |
| `is_pinned` | BOOLEAN | NOT NULL, DEFAULT FALSE | Pin status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**CHECK constraint:** `chk_conversation_project_owner` — Ensures the linked project belongs to the same owner.

**Indexes:**
- `idx_conversations_owner_id` — owner_id
- `idx_conversations_owner_updated` — (owner_id, updated_at DESC)
- `idx_conversations_project_id` — project_id

**RLS:**
- SELECT: `owner_id = auth.uid()`
- INSERT: `owner_id = auth.uid()`
- UPDATE: `owner_id = auth.uid()` (both USING and WITH CHECK)
- DELETE: `owner_id = auth.uid()`

**Deletion behavior:** All messages in this conversation are CASCADE deleted.

---

### 5. `messages`

**Purpose:** Individual messages within conversations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique message ID |
| `owner_id` | UUID | NOT NULL, FK → auth.users(id) | Message owner |
| `conversation_id` | UUID | NOT NULL, FK → conversations(id), ON DELETE CASCADE | Parent conversation |
| `role` | TEXT | NOT NULL, CHECK IN ('user','assistant','system') | Message role |
| `content` | TEXT | NOT NULL | Message content |
| `status` | TEXT | NOT NULL, DEFAULT 'completed', CHECK IN ('pending','streaming','completed','failed','cancelled') | Delivery status |
| `model_id` | TEXT | Nullable | AI model used |
| `error_code` | TEXT | Nullable | Error identifier if failed |
| `sequence_number` | INTEGER | NOT NULL, DEFAULT 0 | Ordering within conversation |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last update timestamp |

**CHECK constraint:** `chk_message_conversation_owner` — Ensures the conversation belongs to the same owner.

**Indexes:**
- `idx_messages_conversation_seq` — (conversation_id, sequence_number)
- `idx_messages_owner_id` — owner_id

**RLS:**
- SELECT: `owner_id = auth.uid()`
- INSERT: `owner_id = auth.uid()`
- UPDATE: `owner_id = auth.uid()` (both USING and WITH CHECK)
- DELETE: `owner_id = auth.uid()`

---

### 6. `activity_events`

**Purpose:** Workspace activity history for the user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique event ID |
| `owner_id` | UUID | NOT NULL, FK → auth.users(id) | Event owner |
| `event_type` | TEXT | NOT NULL, CHECK (length ≤ 100) | Type of event |
| `subject_type` | TEXT | NOT NULL, CHECK IN ('project','conversation','message','system') | Subject category |
| `subject_id` | UUID | Nullable | Referenced entity ID |
| `summary` | TEXT | NOT NULL, CHECK (length ≤ 500) | Human-readable summary |
| `metadata` | JSONB | NOT NULL, DEFAULT '{}' | Additional data |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Event timestamp |

**Indexes:**
- `idx_activity_owner_created` — (owner_id, created_at DESC)

**RLS:**
- SELECT: `owner_id = auth.uid()`
- INSERT: `owner_id = auth.uid()`
- UPDATE: `owner_id = auth.uid()`

**Note:** These are user-visible activity records, NOT tamper-proof audit logs.

---

### 7. `local_import_batches`

**Purpose:** Track local-to-cloud data migrations for idempotency.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique batch ID |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) | Import user |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK IN ('pending','completed','failed') | Import status |
| `projects_count` | INTEGER | NOT NULL, DEFAULT 0 | Projects imported |
| `conversations_count` | INTEGER | NOT NULL, DEFAULT 0 | Conversations imported |
| `messages_count` | INTEGER | NOT NULL, DEFAULT 0 | Messages imported |
| `fingerprint` | TEXT | NOT NULL | Unique import identifier |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Batch creation time |
| `completed_at` | TIMESTAMPTZ | Nullable | Completion time |

**Indexes:**
- `idx_import_batches_user` — user_id
- `idx_import_batches_fingerprint` — UNIQUE (user_id, fingerprint)

**RLS:**
- SELECT: `user_id = auth.uid()`
- INSERT: `user_id = auth.uid()`
- UPDATE: `user_id = auth.uid()`

---

## Security Model

### Row Level Security

Every application table has RLS enabled. Policies enforce:

1. **Ownership:** Users can only access rows where they are the owner
2. **No cross-user access:** Even authenticated users cannot see other users' data
3. **No ownership reassignment:** UPDATE policies check both old and new owner_id
4. **No invalid relationships:** CHECK constraints prevent cross-user parent-child links

### What RLS Does NOT Protect Against

- Compromised Supabase admin keys
- SQL injection in application code (mitigated by parameterized queries)
- Client-side data manipulation (mitigated by server-side validation)

### Future Extension Points

- **Shared projects:** Add `project_members` table with role-based access
- **Organizations:** Add `organizations` table with membership
- **Public projects:** Add `is_public` boolean with anonymous read policy
- **Audit logs:** Separate server-controlled table with INSERT-only policy
