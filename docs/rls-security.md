# HAMOODI SI — RLS Security Documentation

## Overview

Row Level Security (RLS) is the primary mechanism for data isolation in HAMOODI SI. Every application table has RLS enabled with ownership-based policies.

## Security Principles

1. **Default deny:** Without a matching policy, all access is denied
2. **Ownership-based:** Users can only access their own rows
3. **No cross-user access:** Even authenticated users cannot see others' data
4. **Server-authoritative:** Client-side checks are for UX, not security
5. **No SECURITY DEFINER:** All access uses standard policies

## Policy Design

### Pattern: Ownership Check

Every policy follows this pattern:

```sql
-- For SELECT/DELETE (read-side)
USING (owner_id = auth.uid())

-- For INSERT (write-side)
WITH CHECK (owner_id = auth.uid())

-- For UPDATE (both read and write)
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid())
```

### Why Both USING and WITH CHECK?

- **USING:** Determines which existing rows can be seen/modified
- **WITH CHECK:** Determines what values are allowed in new/updated rows

For UPDATE, both are needed to prevent:
1. Reading another user's row (USING)
2. Reassigning ownership to another user (WITH CHECK)

## Table Policies

### profiles
| Operation | Policy |
|-----------|--------|
| SELECT | `id = auth.uid()` |
| INSERT | `id = auth.uid()` |
| UPDATE | USING: `id = auth.uid()`, CHECK: `id = auth.uid()` |

### user_preferences
| Operation | Policy |
|-----------|--------|
| SELECT | `user_id = auth.uid()` |
| INSERT | `user_id = auth.uid()` |
| UPDATE | USING: `user_id = auth.uid()`, CHECK: `user_id = auth.uid()` |

### projects
| Operation | Policy |
|-----------|--------|
| SELECT | `owner_id = auth.uid()` |
| INSERT | `owner_id = auth.uid()` |
| UPDATE | USING: `owner_id = auth.uid()`, CHECK: `owner_id = auth.uid()` |
| DELETE | `owner_id = auth.uid()` |

### conversations
| Operation | Policy |
|-----------|--------|
| SELECT | `owner_id = auth.uid()` |
| INSERT | `owner_id = auth.uid()` |
| UPDATE | USING: `owner_id = auth.uid()`, CHECK: `owner_id = auth.uid()` |
| DELETE | `owner_id = auth.uid()` |

### messages
| Operation | Policy |
|-----------|--------|
| SELECT | `owner_id = auth.uid()` |
| INSERT | `owner_id = auth.uid()` |
| UPDATE | USING: `owner_id = auth.uid()`, CHECK: `owner_id = auth.uid()` |
| DELETE | `owner_id = auth.uid()` |

### activity_events
| Operation | Policy |
|-----------|--------|
| SELECT | `owner_id = auth.uid()` |
| INSERT | `owner_id = auth.uid()` |
| UPDATE | USING: `owner_id = auth.uid()`, CHECK: `owner_id = auth.uid()` |

### local_import_batches
| Operation | Policy |
|-----------|--------|
| SELECT | `user_id = auth.uid()` |
| INSERT | `user_id = auth.uid()` |
| UPDATE | USING: `user_id = auth.uid()`, CHECK: `user_id = auth.uid()` |

## Cross-User Relationship Prevention

RLS alone cannot prevent all invalid relationships. CHECK constraints provide additional protection:

### conversations.chk_conversation_project_owner
```sql
CHECK (
  project_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = conversations.project_id AND p.owner_id = conversations.owner_id
  )
)
```
Prevents: User A attaching their conversation to User B's project.

### messages.chk_message_conversation_owner
```sql
CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND c.owner_id = messages.owner_id
  )
)
```
Prevents: User A inserting a message into User B's conversation.

## Testing Cross-User Isolation

### Test Matrix

| Test | User A Action | Expected Result |
|------|--------------|-----------------|
| Read other's project | SELECT projects WHERE owner_id = B | 0 rows |
| Update other's project | UPDATE projects SET name = 'x' WHERE owner_id = B | 0 rows affected |
| Delete other's project | DELETE FROM projects WHERE owner_id = B | 0 rows affected |
| Insert as other user | INSERT INTO projects (owner_id = B, ...) | Permission denied |
| Attach to other's project | INSERT INTO conversations (project_id = B's project) | CHECK constraint violation |
| Message in other's convo | INSERT INTO messages (conversation_id = B's convo) | CHECK constraint violation |

### Verification Steps

1. Create two test users (A and B)
2. User A creates project, conversation, messages
3. User B creates project, conversation, messages
4. Verify A cannot read B's data
5. Verify B cannot read A's data
6. Verify A cannot modify B's data
7. Verify B cannot modify A's data
8. Verify unauthenticated requests get no data

## What RLS Does NOT Protect

1. **Supabase admin keys:** Full database access
2. **SQL injection:** Mitigated by parameterized queries in client
3. **Client-side manipulation:** Mitigated by server-side validation
4. **Brute force attacks:** Mitigated by rate limiting
5. **Token theft:** Mitigated by short expiry + refresh tokens

## Monitoring

Recommended Supabase dashboard checks:
- Failed authentication attempts
- Unusual query patterns
- RLS policy violations in logs
- Connection pool usage

## Future Enhancements

- **Shared access:** Add `project_members` with role-based policies
- **Public data:** Add `is_public` flag with anonymous SELECT policy
- **Audit trail:** Server-only table with INSERT-only policy
- **Time-based access:** Policies that expire after a date
