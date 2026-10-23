# HAMOODI SI — Workspace Architecture

## Overview

HAMOODI SI implements a multi-tenant workspace system that enables users to organize their work across personal and team contexts. Workspaces serve as the top-level organizational boundary for all data, permissions, and collaboration.

## Hierarchy

```
User Account
├── Personal Workspace (auto-created)
│   ├── Hubs (contextual groupings)
│   │   ├── Projects
│   │   ├── Files
│   │   └── Instructions
│   ├── Projects (unassigned)
│   ├── Files (workspace-level)
│   └── Activity
│
└── Team Workspaces (created/invited)
    ├── Members (with roles)
    ├── Hubs
    │   ├── Projects
    │   ├── Files
    │   └── Instructions
    ├── Projects
    ├── Files
    └── Activity
```

## Database Schema

### workspaces
```sql
- id (UUID, PK)
- name (TEXT, NOT NULL)
- description (TEXT)
- type (ENUM: 'personal' | 'team')
- owner_id (UUID, FK → auth.users)
- icon (TEXT)
- color (TEXT)
- archived_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### workspace_members
```sql
- id (UUID, PK)
- workspace_id (UUID, FK → workspaces)
- user_id (UUID, FK → auth.users)
- role (ENUM: 'owner' | 'admin' | 'editor' | 'viewer')
- joined_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- UNIQUE(workspace_id, user_id)
```

## Workspace Types

### Personal Workspace
- Automatically created for each user on first login
- Single owner (the user)
- Cannot be deleted without account deletion
- Default workspace for new users
- All Phase 03 data migrated here

### Team Workspace
- Created by users for collaboration
- Multiple members with different roles
- Owner can invite/remove members
- Can be archived or deleted by owner

## Roles & Permissions

| Role | Create | Read | Update | Delete | Invite | Manage Members |
|------|--------|------|--------|--------|--------|----------------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Admin | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ |
| Editor | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Viewer | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |

## Row Level Security

All workspace operations are protected by RLS policies that verify:
1. User is authenticated
2. User has membership in the workspace
3. User has appropriate role for the operation

### Key Policies
- **SELECT**: Members can read workspace data
- **INSERT**: Editors+ can create content
- **UPDATE**: Editors+ can modify content, Admins+ can manage settings
- **DELETE**: Only owners can delete workspaces

## Workspace Switching

Users can switch between workspaces they have access to. The workspace switcher:
- Shows all accessible workspaces
- Displays workspace type (personal/team)
- Updates all workspace-scoped data
- Clears stale selections
- Preserves user preferences

## Data Isolation

Each workspace is a complete tenant boundary:
- Projects belong to exactly one workspace
- Hubs belong to exactly one workspace
- Files belong to exactly one workspace
- Conversations inherit workspace from their project
- Activity events are workspace-scoped

## Migration from Phase 03

Existing users from Phase 03 are automatically migrated:
1. Personal workspace created (if not exists)
2. All existing projects assigned to personal workspace
3. All conversations inherit workspace from projects
4. All messages remain intact
5. No data loss or ID changes

## Future Extensions

### Planned Features
- Workspace templates
- Workspace analytics
- Cross-workspace search (admin only)
- Workspace billing (for teams)
- Workspace integrations
- Workspace-level AI settings

### Agent Access (Part 05+)
- Service accounts for AI agents
- Scoped permissions for agents
- Agent activity logging
- Agent resource quotas
