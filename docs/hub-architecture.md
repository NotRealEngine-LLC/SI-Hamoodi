# HAMOODI SI — Hub Architecture

## Overview

Hubs are contextual organizational containers within workspaces that group related projects, files, and AI instructions. They provide semantic boundaries for organizing work around themes, clients, products, or workflows.

## Purpose

Hubs solve the problem of flat project lists by providing:
- **Contextual grouping** — Related projects organized together
- **Shared instructions** — AI context specific to the hub's domain
- **Visibility control** — Restrict access to sensitive work
- **File organization** — Hub-level file storage
- **Activity isolation** — Track work within specific contexts

## Database Schema

### hubs
```sql
- id (UUID, PK)
- workspace_id (UUID, FK → workspaces)
- name (TEXT, NOT NULL)
- description (TEXT)
- icon (TEXT)
- color (TEXT)
- visibility (ENUM: 'workspace' | 'restricted')
- created_by (UUID, FK → auth.users)
- archived_at (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### hub_members
```sql
- id (UUID, PK)
- hub_id (UUID, FK → hubs)
- user_id (UUID, FK → auth.users)
- role (ENUM: 'manager' | 'editor' | 'viewer')
- created_at (TIMESTAMPTZ)
- UNIQUE(hub_id, user_id)
```

### hub_instructions
```sql
- id (UUID, PK)
- hub_id (UUID, FK → hubs)
- content (TEXT, NOT NULL)
- version (INTEGER, NOT NULL)
- updated_by (UUID, FK → auth.users)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## Hub Visibility

### Workspace Visibility
- All workspace members can see the hub
- All workspace members can access hub projects (based on their role)
- Default visibility for new hubs
- Suitable for general-purpose organization

### Restricted Visibility
- Only hub members can see the hub
- Workspace owners/admins can still access (administrative override)
- Requires explicit membership to access
- Suitable for sensitive projects, client work, confidential topics

## Hub Instructions

Custom instructions provide AI context specific to the hub's domain:

### Examples
- "Use professional business language for all responses"
- "Follow our brand terminology and style guide"
- "Prioritize verified sources and cite references"
- "Use our approved product names and abbreviations"
- "Present recommendations with risk assessments"

### Implementation
- Instructions stored in `hub_instructions` table
- Versioned (each update creates new version)
- Retrieved when building AI context
- Passed to AI provider as system context
- Respects authorization (only authorized users see instructions)

### Future Integration (Part 05)
- Instructions will be automatically included in AI context
- Semantic search across instruction history
- Instruction templates for common use cases
- Instruction sharing between hubs

## Hub Membership

### Roles
- **Manager** — Full control over hub settings, members, and content
- **Editor** — Can create and modify projects, files, and instructions
- **Viewer** — Read-only access to hub content

### Membership Rules
- Hub members must also be workspace members
- Hub role cannot exceed workspace role
- Removing workspace membership removes hub access
- Hub creators automatically become managers

## Project-Hub Relationships

### Assignment
- Projects can belong to zero or one hub
- Projects must belong to the same workspace as their hub
- Moving projects between hubs is allowed within the same workspace
- Cross-workspace project moves require special workflow (not yet implemented)

### Constraints
```sql
CHECK (
  hub_id IS NULL OR
  workspace_id IS NULL OR
  EXISTS (
    SELECT 1 FROM hubs h
    WHERE h.id = projects.hub_id 
    AND h.workspace_id = projects.workspace_id
  )
)
```

## Hub Dashboard

The hub dashboard provides:
- Hub overview (name, description, visibility)
- Project list with counts
- File browser for hub files
- Instructions editor
- Member management (for managers)
- Activity feed

## Security Model

### Row Level Security
- Workspace members can read workspace-visible hubs
- Hub members can read restricted hubs
- Hub managers can modify hub settings
- Workspace owners/admins have administrative override

### Access Control
1. Verify workspace membership
2. Check hub visibility
3. If restricted, verify hub membership
4. Apply role-based permissions

### Data Isolation
- Hub data cannot leak to other workspaces
- Restricted hubs hidden from non-members
- Instructions only visible to authorized users
- File access follows hub permissions

## Use Cases

### Client Work
- Restricted hub per client
- Client-specific instructions
- Separate file storage
- Limited team access

### Product Development
- Workspace-visible hub
- Product-specific AI context
- Shared across team
- Centralized documentation

### Research Projects
- Restricted hub for sensitive research
- Research methodology instructions
- Controlled access
- Citation management

### Personal Organization
- Workspace-visible hubs
- Topic-based organization
- Personal instructions
- Easy switching between contexts

## Future Extensions

### Planned Features
- Hub templates for common patterns
- Hub analytics and insights
- Cross-hub search
- Hub-level AI models
- Hub sharing between workspaces
- Hub versioning and history

### Synthetic Memory Integration (Part 05)
- Automatic context extraction from hub content
- Semantic search within hub scope
- Knowledge graph per hub
- Long-term memory per hub
- Citation grounding to hub files
