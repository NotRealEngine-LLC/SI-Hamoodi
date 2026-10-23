# HAMOODI SI — File Storage Architecture

## Overview

HAMOODI SI implements secure cloud file storage using Supabase Storage with metadata tracked in PostgreSQL. Files can be organized into workspaces, hubs, projects, and folders with fine-grained access control.

## Storage Backend

### Supabase Storage
- **Bucket name:** `si-workspace-files`
- **Access:** Private (no public access)
- **File size limit:** 25 MB per file (configurable)
- **Supported types:** PDF, TXT, MD, CSV, DOCX, XLSX, PPTX, PNG, JPG, JPEG, WEBP, JSON, and more

### Storage Path Structure
```
si-workspace-files/
└── workspaces/{workspaceId}/
    └── objects/{fileId}/
        └── {originalFilename}
```

**Why this structure:**
- Workspace isolation at the path level
- File ID prevents filename collisions
- Original filename preserved for display
- Easy cleanup when workspace is deleted

## Database Schema

### workspace_files
```sql
- id (UUID, PK)
- workspace_id (UUID, FK → workspaces)
- hub_id (UUID, FK → hubs, nullable)
- project_id (UUID, FK → projects, nullable)
- folder_id (UUID, FK → file_folders, nullable)
- uploaded_by (UUID, FK → auth.users)
- display_name (TEXT, NOT NULL)
- original_name (TEXT, NOT NULL)
- storage_bucket (TEXT, NOT NULL)
- storage_path (TEXT, NOT NULL)
- mime_type (TEXT, NOT NULL)
- size_bytes (BIGINT, NOT NULL)
- upload_status (ENUM: 'pending' | 'uploading' | 'ready' | 'failed' | 'deleted')
- checksum (TEXT, nullable)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### file_folders
```sql
- id (UUID, PK)
- workspace_id (UUID, FK → workspaces)
- hub_id (UUID, FK → hubs, nullable)
- project_id (UUID, FK → projects, nullable)
- parent_folder_id (UUID, FK → file_folders, nullable)
- name (TEXT, NOT NULL)
- created_by (UUID, FK → auth.users)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

## Upload Flow

### Standard Upload (< 6 MB)
1. **Validate permissions** — User must be workspace editor+
2. **Validate file** — Size, type, name length
3. **Create metadata record** — Status: 'pending'
4. **Generate storage path** — `workspaces/{wsId}/objects/{fileId}/{name}`
5. **Upload to storage** — Supabase Storage API
6. **Update status** — 'ready' on success, 'failed' on error
7. **Display in UI** — File appears in browser

### Failure Recovery
- If metadata creation fails: No storage upload attempted
- If storage upload fails: Metadata marked as 'failed', can retry
- If status update fails: Orphaned file in storage, cleanup task needed
- User sees clear error messages and retry options

### Idempotency
- Each file gets a unique UUID
- Repeated uploads create separate records
- No accidental duplicates from retry

## Download & Access

### Signed URLs
- Generated on-demand for private files
- 1-hour expiration (configurable)
- Only generated after permission verification
- Never stored as permanent identifiers

### Access Flow
1. User requests file download
2. Verify workspace membership
3. Verify file access (hub/project permissions)
4. Generate signed URL
5. Return URL to client
6. Client downloads directly from storage

### Security
- Signed URLs expire after 1 hour
- Revoked members cannot generate new URLs
- Previously issued URLs remain valid until expiration
- No public access to storage bucket

## File Organization

### Folders
- Virtual folders (metadata only, not physical paths)
- Can be nested (parent_folder_id)
- Belong to workspace, optionally hub/project
- Renaming doesn't move files in storage
- Deletion requires empty folder (safety)

### Organization Hierarchy
```
Workspace
├── Root files (no folder)
├── Folder A
│   ├── File 1
│   └── Subfolder A1
│       └── File 2
└── Folder B
    └── File 3
```

### Hub/Project Association
- Files can be associated with a hub
- Files can be associated with a project
- Files can be both (hub + project)
- Files can be workspace-level (no hub/project)

## File Preview

### Supported Previews
- **Images** (PNG, JPG, WEBP) — Direct display with signed URL
- **Text files** (TXT, MD, JSON, CSV) — Text preview with syntax highlighting
- **PDF** — Browser native viewer with signed URL
- **Office documents** — Metadata only (download required)

### Security
- Previews use signed URLs (1-hour expiry)
- No direct public access
- HTML files not rendered (security risk)
- Executable files blocked

## File Management

### Operations
- **Upload** — Drag-and-drop or click-to-select
- **Download** — Signed URL generation
- **Preview** — In-browser viewing
- **Rename** — Update display_name only
- **Move** — Change folder_id, hub_id, or project_id
- **Delete** — Remove from storage and metadata

### Constraints
- Cannot delete folder with files (safety)
- Cannot move file to different workspace
- Cannot change file content after upload
- Display name can be changed anytime

## Search & Filter

### Search Scope
- Current workspace only
- Respects RLS (only authorized files)
- Searches display_name and original_name
- Does NOT search file content (future feature)

### Filters
- File type (images, documents, etc.)
- Upload date range
- Hub/project association
- Folder location
- Uploader (when viewing team workspace)

### Sorting
- Name (alphabetical)
- Date (newest/oldest)
- Size (largest/smallest)
- Type (grouped by mime_type)

## Security Model

### Row Level Security
- Workspace members can view files
- Editors+ can upload files
- Editors+ can modify file metadata
- Editors+ can delete files
- Viewers can only download (via signed URL)

### Storage RLS
- Private bucket (no public access)
- Upload requires authentication
- Download requires signed URL
- Delete requires authentication + ownership

### Access Control
1. Verify workspace membership
2. Check hub/project permissions (if applicable)
3. Verify file exists and is 'ready'
4. Generate signed URL with appropriate expiry

## Performance

### Optimization
- Metadata queries use indexes
- File lists paginated (50 per page)
- Signed URLs cached briefly (client-side)
- Thumbnails generated for images (future)
- Lazy loading for large file lists

### Limits
- 25 MB per file (configurable)
- 1000 files per folder (recommended)
- 10,000 files per workspace (recommended)
- Signed URL expiry: 1 hour

## Future Extensions

### Planned Features
- File versioning (keep history)
- File sharing (external links)
- File comments and annotations
- Optical character recognition (OCR)
- Automatic file tagging
- File templates
- Bulk operations

### Synthetic Memory Integration (Part 05)
- Document parsing (PDF, DOCX, images)
- Content chunking for embeddings
- Vector search across file content
- Entity extraction from documents
- Citation grounding to source files
- Automatic summarization
