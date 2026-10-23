# HAMOODI SI — Permissions & Security Model

## Overview

HAMOODI SI implements a comprehensive role-based access control (RBAC) system with Row Level Security (RLS) enforced at the database level. Permissions are hierarchical, context-aware, and designed to prevent cross-tenant data leaks.

## Permission Layers

### 1. Authentication Layer
- Supabase Auth verifies user identity
- JWT tokens issued on login
- Tokens refreshed automatically
- Sessions persist across page reloads

### 2. Workspace Membership Layer
- User must be member of workspace to access data
- Membership verified on every operation
- Roles determine allowed actions
- RLS enforces membership checks

### 3. Resource-Level Layer
- Hubs have visibility modes (workspace/restricted)
- Hub membership required for restricted hubs
- Projects inherit workspace permissions
- Files inherit workspace/hub/project permissions

### 4. Operation-Level Layer
- CRUD operations checked against roles
- Write operations require editor+ role
- Admin operations require admin+ role
- Owner operations require owner role

## Workspace Roles

### Owner
**Capabilities:**
- Full workspace administration
- Create/delete workspaces
- Manage all members and roles
- Access all hubs (including restricted)
- Delete any content
- Transfer ownership (future)

**Restrictions:**
- Cannot delete personal workspace without account deletion
- Cannot remove themselves if last owner

### Admin
**Capabilities:**
- Manage workspace settings
- Invite and remove members
- Assign roles (except owner)
- Access all hubs (including restricted)
- Create/edit/delete content
- Manage hub instructions

**Restrictions:**
- Cannot delete workspace
- Cannot promote to owner
- Cannot remove owner

### Editor
**Capabilities:**
- Create projects, hubs, files
- Edit own content
- Edit shared content (based on hub visibility)
- Upload and manage files
- Start conversations
- Edit hub instructions (if hub member)

**Restrictions:**
- Cannot manage members
- Cannot delete workspace
- Cannot access restricted hubs without membership
- Cannot change workspace settings

### Viewer
**Capabilities:**
- Read all workspace-visible content
- Download files (via signed URLs)
- View conversations
- Read hub instructions

**Restrictions:**
- Cannot create content
- Cannot edit content
- Cannot upload files
- Cannot delete anything
- Cannot access restricted hubs without membership

## Hub Visibility

### Workspace Visibility
- All workspace members can see the hub
- Access follows workspace role permissions
- Default for new hubs
- Suitable for general organization

### Restricted Visibility
- Only hub members can see the hub
- Workspace owners/admins have administrative override
- Requires explicit hub membership
- Suitable for sensitive work

## Hub Roles

### Manager
- Full control over hub
- Manage hub members
- Edit hub instructions
- Create/edit/delete hub content
- Override visibility for members

### Editor
- Create and edit hub content
- Edit hub instructions
- Upload files to hub
- Cannot manage hub members

### Viewer
- Read-only access to hub
- Download hub files
- View hub instructions
- Cannot modify anything

## Permission Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| **Workspace** |
| Create workspace | ✓ | ✓ | ✗ | ✗ |
| Edit workspace settings | ✓ | ✓ | ✗ | ✗ |
| Delete workspace | ✓ | ✗ | ✗ | ✗ |
| Invite members | ✓ | ✓ | ✗ | ✗ |
| Remove members | ✓ | ✓ | ✗ | ✗ |
| Change member roles | ✓ | ✓* | ✗ | ✗ |
| **Hubs** |
| Create hub | ✓ | ✓ | ✓ | ✗ |
| Edit hub (any) | ✓ | ✓ | ✓** | ✗ |
| Delete hub | ✓ | ✓ | ✗ | ✗ |
| Edit hub instructions | ✓ | ✓ | ✓** | ✗ |
| Access restricted hub | ✓ | ✓ | ✓*** | ✗ |
| **Projects** |
| Create project | ✓ | ✓ | ✓ | ✗ |
| Edit project (own) | ✓ | ✓ | ✓ | ✗ |
| Edit project (others) | ✓ | ✓ | ✓** | ✗ |
| Delete project | ✓ | ✓ | ✗ | ✗ |
| Move project to hub | ✓ | ✓ | ✓ | ✗ |
| **Files** |
| Upload file | ✓ | ✓ | ✓ | ✗ |
| Download file | ✓ | ✓ | ✓ | ✓ |
| Delete file | ✓ | ✓ | ✓ | ✗ |
| Rename file | ✓ | ✓ | ✓ | ✗ |
| Move file | ✓ | ✓ | ✓ | ✗ |
| **Conversations** |
| Create conversation | ✓ | ✓ | ✓ | ✗ |
| View conversation | ✓ | ✓ | ✓ | ✓ |
| Delete conversation | ✓ | ✓ | ✗ | ✗ |

*Admins cannot promote to owner or remove owner  
**Editors can only edit if they have hub membership for restricted hubs  
***Editors need hub membership for restricted hubs

## Row Level Security (RLS)

### Workspace Policies
```sql
-- Members can view workspace
SELECT: workspace_id IN (
  SELECT id FROM workspaces 
  WHERE owner_id = auth.uid() 
  OR id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
)

-- Editors+ can create content
INSERT: workspace_id IN (
  SELECT id FROM workspaces 
  WHERE owner_id = auth.uid() 
  OR id IN (SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor'))
)

-- Owners can delete workspace
DELETE: owner_id = auth.uid()
```

### Hub Policies
```sql
-- Workspace members can view workspace-visible hubs
SELECT: workspace_id IN (member workspaces)
  AND (visibility = 'workspace' OR hub_id IN (hub_members))

-- Hub managers can edit
UPDATE: hub_id IN (
  SELECT id FROM hubs WHERE created_by = auth.uid()
  OR id IN (SELECT hub_id FROM hub_members WHERE user_id = auth.uid() AND role = 'manager')
)
```

### File Policies
```sql
-- Workspace members can view files
SELECT: workspace_id IN (member workspaces)

-- Editors+ can upload
INSERT: uploaded_by = auth.uid() 
  AND workspace_id IN (editor+ workspaces)
```

## Security Invariants

### Data Isolation
1. **No cross-workspace access** — Users cannot access data from workspaces they're not members of
2. **No role escalation** — Users cannot promote themselves beyond their current role
3. **No ownership bypass** — RLS prevents unauthorized access even with direct API calls
4. **No restricted hub leak** — Restricted hubs hidden from non-members

### Enforcement Points
1. **Database RLS** — All queries filtered by membership
2. **Application checks** — UI hides unauthorized actions
3. **API validation** — Server verifies permissions before operations
4. **Storage policies** — Supabase Storage enforces access

### What RLS Does NOT Protect
- Compromised Supabase admin keys
- SQL injection in application code (mitigated by parameterized queries)
- Client-side data manipulation (mitigated by server validation)
- Brute force attacks (mitigated by rate limiting)

## Invitation Security

### Token Generation
- Cryptographically secure random tokens
- Tokens hashed before storage (never stored in plaintext)
- Unique per invitation
- Time-limited (24 hours default)

### Acceptance Flow
1. User receives invitation (email or link)
2. User signs in (or creates account)
3. System verifies:
   - Invitation exists
   - Invitation not expired
   - Invitation not already accepted
   - Invitation not revoked
   - User email matches (if email-specific)
4. Membership created atomically
5. Invitation marked as accepted
6. Token invalidated (cannot replay)

### Security Measures
- Token replay prevented (one-time use)
- Expired invitations rejected
- Revoked invitations rejected
- Wrong recipient rejected
- Role escalation prevented (cannot invite as owner)

## Future Agent Permissions (Part 05+)

### Service Accounts
- AI agents will use service accounts
- Scoped permissions (never full access)
- Activity logging for all agent actions
- Resource quotas and rate limiting

### Permission Model
- Agents inherit permissions from granting user
- Agents cannot exceed grantor's permissions
- Human authorization remains the security boundary
- Agent actions logged separately from user actions

### Planned Features
- Agent-specific roles
- Tool-level permissions
- Execution history
- Resource usage tracking
- Automatic permission review

## Testing Security

### Required Tests
1. **Cross-tenant isolation** — User A cannot access User B's workspace
2. **Role enforcement** — Viewer cannot create content
3. **Restricted hub access** — Non-members cannot see restricted hubs
4. **File access** — Signed URLs only for authorized users
5. **Invitation security** — Expired/revoked invitations rejected
6. **Role escalation** — Users cannot promote themselves

### Test Approach
- Direct database queries (bypass UI)
- Multiple test users with different roles
- Verify RLS policies block unauthorized access
- Test invitation flow end-to-end
- Verify storage policies prevent unauthorized access

## Security Best Practices

### For Developers
1. Always verify permissions in backend code
2. Never trust client-side permission checks alone
3. Use parameterized queries to prevent SQL injection
4. Log all permission denials for audit
5. Test with multiple user roles

### For Users
1. Use strong, unique passwords
2. Enable 2FA when available
3. Review workspace members regularly
4. Use restricted hubs for sensitive work
5. Revoke access when team members leave

### For Administrators
1. Regular permission audits
2. Monitor for unusual access patterns
3. Review invitation logs
4. Rotate service account keys
5. Update security policies as needed
