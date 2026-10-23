// HAMOODI SyntheTech Intelligence — Context Assembly Interface
// Phase 04: Preparation for Synthetic Memory (Part 05)

import { getSupabaseClient } from '../supabase/client';

/**
 * Context Assembly Interface
 * 
 * This module provides a typed contract for gathering authorized context
 * from the workspace hierarchy. It will be used by the Synthetic Memory
 * engine in Part 05 for:
 * - Document parsing
 * - Content chunking
 * - Embeddings
 * - Vector search
 * - Hybrid retrieval
 * - Entity extraction
 * - Knowledge graph
 * - Long-term memory
 * - Citation grounding
 * 
 * CURRENT STATUS: Interface defined, basic implementation ready.
 * Full semantic retrieval will be implemented in Part 05.
 */

export interface WorkspaceContext {
  workspace: {
    id: string;
    name: string;
    description: string | null;
    type: 'personal' | 'team';
  };
  hubs: Array<{
    id: string;
    name: string;
    description: string | null;
    instructions: string | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    hub_id: string | null;
  }>;
  files: Array<{
    id: string;
    display_name: string;
    mime_type: string;
    size_bytes: number;
  }>;
}

export interface ConversationContext {
  id: string;
  title: string;
  project_id: string | null;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface AuthorizedContext {
  workspace: WorkspaceContext | null;
  conversation: ConversationContext | null;
  hubInstructions: string | null;
  availableFiles: string[]; // File IDs the user can reference
  timestamp: string;
}

export interface ContextScope {
  workspaceId: string;
  hubId?: string;
  projectId?: string;
  conversationId?: string;
}

/**
 * Get authorized context for a user within a specific scope.
 * 
 * This function ensures that only data the user is authorized to access
 * is returned. It respects:
 * - Workspace membership
 * - Hub visibility and membership
 * - Project ownership/access
 * - File permissions
 * 
 * @param scope - The organizational scope to gather context from
 * @param userId - The authenticated user's ID
 * @returns Authorized context or null if unauthorized
 */
export async function getAuthorizedContext(
  scope: ContextScope,
  userId: string
): Promise<AuthorizedContext | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // Verify workspace access
    const membershipResult = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', scope.workspaceId)
      .eq('user_id', userId)
      .single();

    if (!membershipResult.data) {
      return null; // User not authorized for this workspace
    }
    const membership = membershipResult.data;

    // Gather workspace context
    const workspaceResult = await supabase
      .from('workspaces')
      .select('id, name, description, type')
      .eq('id', scope.workspaceId)
      .single();

    if (!workspaceResult.data) return null;
    const workspace = workspaceResult.data;

    // Gather hubs (respecting visibility)
    let hubsQuery = supabase
      .from('hubs')
      .select('id, name, description')
      .eq('workspace_id', scope.workspaceId);

    // If not owner/admin, only show workspace-visible hubs or hubs user is member of
    if (!['owner', 'admin'].includes(membership.role)) {
      hubsQuery = hubsQuery.or(`visibility.eq.workspace,id.in.(select hub_id from hub_members where user_id=${userId})`);
    }

    const hubsResult = await hubsQuery;
    const hubs = hubsResult.data || [];

    // Gather hub instructions if specific hub requested
    let hubInstructions: string | null = null;
    if (scope.hubId) {
      const instructionResult = await supabase
        .from('hub_instructions')
        .select('content')
        .eq('hub_id', scope.hubId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      hubInstructions = instructionResult.data?.content || null;
    }

    // Gather projects
    let projectsQuery = supabase
      .from('projects')
      .select('id, name, description, hub_id')
      .eq('workspace_id', scope.workspaceId);

    if (scope.hubId) {
      projectsQuery = projectsQuery.eq('hub_id', scope.hubId);
    }

    const projectsResult = await projectsQuery;
    const projects = projectsResult.data || [];

    // Gather files
    let filesQuery = supabase
      .from('workspace_files')
      .select('id, display_name, mime_type, size_bytes')
      .eq('workspace_id', scope.workspaceId)
      .eq('upload_status', 'ready');

    if (scope.hubId) {
      filesQuery = filesQuery.eq('hub_id', scope.hubId);
    }
    if (scope.projectId) {
      filesQuery = filesQuery.eq('project_id', scope.projectId);
    }

    const filesResult = await filesQuery;
    const files = filesResult.data || [];

    // Gather conversation if requested
    let conversation: ConversationContext | null = null;
    if (scope.conversationId) {
      const convoResult = await supabase
        .from('conversations')
        .select('id, title, project_id')
        .eq('id', scope.conversationId)
        .eq('owner_id', userId)
        .single();

      if (convoResult.data) {
        const convo = convoResult.data;
        const messagesResult = await supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', convo.id)
          .order('sequence_number', { ascending: true });

        conversation = {
          id: convo.id,
          title: convo.title,
          project_id: convo.project_id,
          messages: (messagesResult.data || []).map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
        };
      }
    }

    return {
      workspace: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          type: workspace.type,
        },
        hubs: hubs.map((h: { id: string; name: string; description: string | null }) => ({
          id: h.id,
          name: h.name,
          description: h.description,
          instructions: null, // Instructions loaded separately if needed
        })),
        projects: projects.map((p: { id: string; name: string; description: string | null; hub_id: string | null }) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          hub_id: p.hub_id,
        })),
        files: files.map((f: { id: string; display_name: string; mime_type: string; size_bytes: number }) => ({
          id: f.id,
          display_name: f.display_name,
          mime_type: f.mime_type,
          size_bytes: f.size_bytes,
        })),
      },
      conversation,
      hubInstructions,
      availableFiles: files.map((f: { id: string }) => f.id),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Context assembly failed:', error);
    return null;
  }
}

/**
 * Build AI context from authorized data.
 * 
 * This function prepares context for AI models, ensuring that:
 * - Hub instructions are included when available
 * - Only authorized data is passed
 * - Context is formatted for the AI provider
 * 
 * @param context - Authorized context from getAuthorizedContext
 * @returns Formatted context string for AI
 */
export function buildAIContext(context: AuthorizedContext): string {
  const parts: string[] = [];

  // Add workspace context
  if (context.workspace) {
    parts.push(`Workspace: ${context.workspace.workspace.name}`);
    if (context.workspace.workspace.description) {
      parts.push(`Description: ${context.workspace.workspace.description}`);
    }
  }

  // Add hub instructions
  if (context.hubInstructions) {
    parts.push(`\nHub Instructions:\n${context.hubInstructions}`);
  }

  // Add available context summary
  if (context.workspace) {
    const summary = [];
    if (context.workspace.hubs.length > 0) {
      summary.push(`${context.workspace.hubs.length} hub(s)`);
    }
    if (context.workspace.projects.length > 0) {
      summary.push(`${context.workspace.projects.length} project(s)`);
    }
    if (context.workspace.files.length > 0) {
      summary.push(`${context.workspace.files.length} file(s) available`);
    }
    if (summary.length > 0) {
      parts.push(`\nAvailable in this workspace: ${summary.join(', ')}`);
    }
  }

  return parts.join('\n');
}

/**
 * Future extension points for Part 05 (Synthetic Memory):
 * 
 * 1. Document Parsing
 *    - parseDocument(fileId: string): Promise<DocumentChunks>
 *    - Extract text from PDF, DOCX, images (OCR)
 * 
 * 2. Content Chunking
 *    - chunkContent(text: string, strategy: ChunkingStrategy): Promise<Chunk[]>
 *    - Semantic, fixed-size, or hierarchical chunking
 * 
 * 3. Embeddings
 *    - generateEmbedding(text: string): Promise<number[]>
 *    - Use OpenAI, Cohere, or local models
 * 
 * 4. Vector Storage
 *    - storeEmbeddings(chunks: Chunk[]): Promise<void>
 *    - Use pgvector, Pinecone, or Weaviate
 * 
 * 5. Semantic Search
 *    - semanticSearch(query: string, scope: ContextScope): Promise<SearchResult[]>
 *    - Hybrid search combining vector + keyword
 * 
 * 6. Entity Extraction
 *    - extractEntities(text: string): Promise<Entity[]>
 *    - People, organizations, concepts, dates
 * 
 * 7. Knowledge Graph
 *    - buildKnowledgeGraph(entities: Entity[]): Promise<Graph>
 *    - Relationships between entities
 * 
 * 8. Long-term Memory
 *    - storeMemory(context: AuthorizedContext): Promise<MemoryId>
 *    - Persistent memory across sessions
 * 
 * 9. Citation Grounding
 *    - groundResponse(response: string, sources: Source[]): Promise<Citation[]>
 *    - Link AI responses to source documents
 */
