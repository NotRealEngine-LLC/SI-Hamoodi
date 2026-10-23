// HAMOODI SyntheTech Intelligence — Agent Knowledge Tool
// Phase 07: Super Agent integration with knowledge retrieval

import { retrievalService } from './retrieval-service';
import { memoryService } from './memory-service';
import type { AgentTool, ToolExecutionContext } from '../super-agent/types';

/**
 * Knowledge Search Tool for Super Agent
 * Allows agents to search workspace knowledge with proper authorization
 */
export const knowledgeSearchTool: AgentTool = {
  id: 'knowledge.search',
  description: 'Search workspace knowledge base for relevant information',
  riskLevel: 'read',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      workspaceId: { type: 'string', description: 'Workspace ID to search' },
      hubId: { type: 'string', description: 'Optional: Limit to specific hub' },
      projectId: { type: 'string', description: 'Optional: Limit to specific project' },
      maxResults: { type: 'number', description: 'Maximum results (default: 5)' },
      mode: { 
        type: 'string', 
        enum: ['keyword', 'semantic', 'hybrid'],
        description: 'Search mode (default: hybrid)'
      },
    },
    required: ['query', 'workspaceId'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sourceId: { type: 'string' },
            title: { type: 'string' },
            excerpt: { type: 'string' },
            reference: { type: 'string' },
            relevance: { type: 'number' },
          },
        },
      },
      totalCount: { type: 'number' },
      searchMode: { type: 'string' },
    },
  },
  execute: async (input: any, context: ToolExecutionContext) => {
    // Verify workspace access
    if (context.workspaceId !== input.workspaceId) {
      throw new Error('Unauthorized: Cannot search knowledge from different workspace');
    }

    try {
      const results = await retrievalService.search(context.userId, {
        query: input.query,
        workspaceId: input.workspaceId,
        hubId: input.hubId,
        projectId: input.projectId,
        maxResults: input.maxResults || 5,
        mode: input.mode || 'hybrid',
      });

      return {
        results: results.map((r: any) => ({
          sourceId: r.sourceId,
          title: r.title,
          excerpt: r.content.substring(0, 300) + (r.content.length > 300 ? '...' : ''),
          reference: r.reference,
          relevance: r.similarity || r.score || 0,
        })),
        totalCount: results.length,
        searchMode: input.mode || 'hybrid',
      };
    } catch (error) {
      throw new Error(`Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

/**
 * Memory Save Tool for Super Agent
 * Allows agents to save meaningful outcomes as memories (with approval)
 */
export const memorySaveTool: AgentTool = {
  id: 'memory.save',
  description: 'Save a meaningful outcome or decision as a memory (requires approval)',
  riskLevel: 'write',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Memory title' },
      content: { type: 'string', description: 'Memory content' },
      scope: { 
        type: 'string',
        enum: ['personal', 'workspace', 'hub', 'project'],
        description: 'Memory scope'
      },
      memoryType: {
        type: 'string',
        enum: ['episodic', 'semantic', 'procedural'],
        description: 'Memory type'
      },
      workspaceId: { type: 'string', description: 'Workspace ID' },
      hubId: { type: 'string', description: 'Optional: Hub ID' },
      projectId: { type: 'string', description: 'Optional: Project ID' },
    },
    required: ['title', 'content', 'scope', 'memoryType', 'workspaceId'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      memoryId: { type: 'string' },
      status: { type: 'string' },
      message: { type: 'string' },
    },
  },
  execute: async (input: any, context: ToolExecutionContext) => {
    // This tool requires approval - return pending status
    // The actual memory creation will happen after user approval
    return {
      memoryId: null,
      status: 'pending_approval',
      message: 'Memory save requires user approval. Please review and approve the suggested memory.',
      suggestedMemory: {
        title: input.title,
        content: input.content,
        scope: input.scope,
        memoryType: input.memoryType,
      },
    };
  },
};

/**
 * Memory Retrieve Tool for Super Agent
 * Allows agents to retrieve relevant memories for context
 */
export const memoryRetrieveTool: AgentTool = {
  id: 'memory.retrieve',
  description: 'Retrieve relevant memories for context',
  riskLevel: 'read',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      scope: { 
        type: 'string',
        enum: ['personal', 'workspace', 'hub', 'project', 'all'],
        description: 'Memory scope to search'
      },
      memoryType: {
        type: 'string',
        enum: ['working', 'episodic', 'semantic', 'preference', 'procedural', 'all'],
        description: 'Memory type to filter'
      },
      workspaceId: { type: 'string', description: 'Workspace ID' },
      limit: { type: 'number', description: 'Maximum results (default: 5)' },
    },
    required: ['query', 'workspaceId'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      memories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            scope: { type: 'string' },
            memoryType: { type: 'string' },
            lastUsed: { type: 'string' },
          },
        },
      },
      totalCount: { type: 'number' },
    },
  },
  execute: async (input: any, context: ToolExecutionContext) => {
    try {
      const memories = await memoryService.searchMemories(context.userId, input.query, {
        scope: input.scope === 'all' ? undefined : input.scope,
        memory_type: input.memoryType === 'all' ? undefined : input.memoryType,
        workspace_id: input.workspaceId,
        limit: input.limit || 5,
      });

      return {
        memories: memories.map((m: any) => ({
          id: m.id,
          title: m.title,
          content: m.content,
          scope: m.scope,
          memoryType: m.memory_type,
          lastUsed: m.last_used_at,
        })),
        totalCount: memories.length,
      };
    } catch (error) {
      throw new Error(`Memory retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
