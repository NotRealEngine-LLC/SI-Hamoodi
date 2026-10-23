# HAMOODI SI — Migration Strategy

## Overview

HAMOODI SI supports migration of local workspace data (stored in browser localStorage) to the user's cloud account. This ensures existing users don't lose their work when they create an account.

## Migration Principles

1. **Explicit consent:** Never auto-import without user confirmation
2. **Data preservation:** Local originals are never deleted automatically
3. **Idempotency:** Repeated imports don't create duplicates
4. **Relationship integrity:** Project-conversation links are preserved
5. **Partial failure recovery:** Failed imports can be retried safely
6. **Cross-account protection:** One user's local data never imports to another's account

## Migration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User signs in to HAMOODI                                  │
│ 2. App detects local data in localStorage                    │
│ 3. Migration wizard shows counts:                            │
│    - X projects                                              │
│    - Y conversations                                         │
│    - Z messages                                              │
│ 4. User reviews and confirms import                          │
│ 5. Import process:                                           │
│    a. Generate fingerprint for idempotency                   │
│    b. Import projects (map local IDs → cloud IDs)            │
│    c. Import conversations (update project_id references)    │
│    d. Import messages (maintain sequence order)              │
│    e. Record import batch in local_import_batches            │
│ 6. Show success with counts                                  │
│ 7. Local data preserved (user can clean up separately)       │
└─────────────────────────────────────────────────────────────┘
```

## ID Mapping Strategy

Local IDs cannot be reused directly in cloud because:
- UUIDs may conflict with existing cloud records
- Different devices may have different local IDs

**Solution:** Generate new UUIDs for cloud records, maintain a mapping:

```typescript
const idMap: Record<string, string> = {};
// local_project_id → cloud_project_id
// local_conversation_id → cloud_conversation_id
```

When importing conversations, update `project_id` using the map:
```typescript
const cloudProjectId = idMap[localConversation.project_id] || null;
```

## Fingerprinting for Idempotency

Each import batch gets a unique fingerprint based on:
- Number of projects
- Number of conversations
- Number of messages
- Timestamp hash

```typescript
const fingerprint = `${projects.length}:${conversations.length}:${messages.length}:${Date.now()}`;
```

The `local_import_batches` table has a UNIQUE constraint on `(user_id, fingerprint)`, preventing duplicate imports.

## Partial Failure Handling

If import fails midway:

1. **Projects imported:** Remain in cloud (not rolled back)
2. **Conversations partially imported:** Each is independent
3. **Messages partially imported:** Each conversation's messages are independent
4. **Batch status:** Marked as 'failed' in local_import_batches
5. **Retry:** User can retry; fingerprint prevents exact duplicate

## Data Safety

### What is preserved:
- Local data in localStorage (never auto-deleted)
- Cloud data already in account
- All relationships (via ID mapping)

### What is NOT preserved:
- Exact local UUIDs (new UUIDs generated for cloud)
- Exact timestamps (cloud uses server timestamps)

### Cleanup:
After successful import, user can manually clear local data via settings.

## Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Import to empty account | All data imported, batch marked completed |
| Import to account with existing data | New data added alongside existing |
| Cancel import | No data imported, local data preserved |
| Retry after failure | Only missing records imported |
| Import twice | Second import skipped (fingerprint match) |
| Malformed local record | Skipped, import continues |
| Interrupted import | Partial data preserved, can retry |
| Different user signs in | Their local data (if any) imports to their account |

## Implementation

### Detection
```typescript
const localProjects = loadLocal<Project[]>(LS_PROJECTS, []);
const localConversations = loadLocal<Conversation[]>(LS_CONVERSATIONS, []);
const hasLocalData = localProjects.length > 0 || localConversations.length > 0;
```

### Import Function
```typescript
async function importLocalData(): Promise<ImportResult> {
  // 1. Check for existing fingerprint (idempotency)
  // 2. Create import batch record
  // 3. Import projects with ID mapping
  // 4. Import conversations with project_id remapping
  // 5. Import messages with sequence ordering
  // 6. Mark batch as completed
  // 7. Return counts
}
```

## Future Enhancements

- **Selective import:** Let user choose which projects/conversations to import
- **Merge conflicts:** Detect and handle name collisions
- **Incremental sync:** Track changes since last import
- **Export to file:** Allow users to download local data as JSON
- **Cross-device merge:** Combine data from multiple devices
