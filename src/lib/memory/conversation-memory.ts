// HAMOODI SyntheTech Intelligence — Conversation Memory Integration
// Phase 07: Integrate knowledge retrieval with conversation engine

import { retrievalService } from './retrieval-service';
import { memoryService } from './memory-service';
import type { KnowledgeResult, MemoryItem } from './types';

export interface ConversationContext {
  conversationId: string;
  workspaceId: string;
  hubId?: string;
  projectId?: string;
  userId: string;
}

export interface RetrievedContext {
  knowledge: KnowledgeResult[];
  memories: MemoryItem[];
  totalTokens: number;
}

/**
 * Conversation Memory Service
 * Integrates knowledge retrieval with conversation context
 */
export class ConversationMemoryService {
  /**
   * Retrieve relevant context for a conversation
   */
  async retrieveContext(
    context: ConversationContext,
    userMessage: string,
    options: {
      useKnowledge?: boolean;
      useMemories?: boolean;
      maxKnowledgeResults?: number;
      maxMemories?: number;
      searchMode?: 'keyword' | 'semantic' | 'hybrid';
    } = {}
  ): Promise<RetrievedContext> {
    const {
      useKnowledge = true,
      useMemories = true,
      maxKnowledgeResults = 5,
      maxMemories = 3,
      searchMode = 'hybrid',
    } = options;

    const retrievedContext: RetrievedContext = {
      knowledge: [],
      memories: [],
      totalTokens: 0,
    };

    // Retrieve knowledge if enabled
    if (useKnowledge) {
      try {
        const knowledgeResults = await retrievalService.search(context.userId, {
          query: userMessage,
          workspaceId: context.workspaceId,
          hubId: context.hubId,
          projectId: context.projectId,
          maxResults: maxKnowledgeResults,
          mode: searchMode,
        });

        retrievedContext.knowledge = knowledgeResults;
        retrievedContext.totalTokens += this.estimateTokens(
          knowledgeResults.map(k => k.content).join(' ')
        );
      } catch (error) {
        console.error('Failed to retrieve knowledge:', error);
        // Continue without knowledge if retrieval fails
      }
    }

    // Retrieve relevant memories if enabled
    if (useMemories) {
      try {
        const memories = await memoryService.searchMemories(
          context.userId,
          userMessage,
          {
            workspace_id: context.workspaceId,
            limit: maxMemories,
          }
        );

        retrievedContext.memories = memories;
        retrievedContext.totalTokens += this.estimateTokens(
          memories.map(m => m.content).join(' ')
        );
      } catch (error) {
        console.error('Failed to retrieve memories:', error);
        // Continue without memories if retrieval fails
      }
    }

    return retrievedContext;
  }

  /**
   * Build context prompt from retrieved knowledge and memories
   */
  buildContextPrompt(context: RetrievedContext): string {
    const parts: string[] = [];

    // Add knowledge context
    if (context.knowledge.length > 0) {
      parts.push('## Relevant Knowledge');
      parts.push('');
      context.knowledge.forEach((k, i) => {
        parts.push(`### Source ${i + 1}: ${k.title}`);
        if (k.reference) {
          parts.push(`*Reference: ${k.reference}*`);
        }
        parts.push('');
        parts.push(k.content);
        parts.push('');
      });
    }

    // Add memory context
    if (context.memories.length > 0) {
      parts.push('## Relevant Memories');
      parts.push('');
      context.memories.forEach((m, i) => {
        parts.push(`### ${m.title}`);
        parts.push(`*Scope: ${m.scope} | Type: ${m.memory_type}*`);
        parts.push('');
        parts.push(m.content);
        parts.push('');
      });
    }

    return parts.join('\n');
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if context should be used based on user preferences
   */
  async shouldUseContext(
    userId: string,
    workspaceId: string
  ): Promise<{ useKnowledge: boolean; useMemories: boolean }> {
    // In production, this would check user preferences from database
    // For now, default to using both
    return {
      useKnowledge: true,
      useMemories: true,
    };
  }

  /**
   * Format citations for display
   */
  formatCitations(context: RetrievedContext): Array<{
    id: string;
    type: 'knowledge' | 'memory';
    title: string;
    reference?: string;
    excerpt: string;
  }> {
    const citations: Array<{
      id: string;
      type: 'knowledge' | 'memory';
      title: string;
      reference?: string;
      excerpt: string;
    }> = [];

    // Add knowledge citations
    context.knowledge.forEach((k, i) => {
      citations.push({
        id: `k-${i}`,
        type: 'knowledge',
        title: k.title,
        reference: k.reference,
        excerpt: k.content.substring(0, 200) + (k.content.length > 200 ? '...' : ''),
      });
    });

    // Add memory citations
    context.memories.forEach((m, i) => {
      citations.push({
        id: `m-${i}`,
        type: 'memory',
        title: m.title,
        reference: `${m.scope} ${m.memory_type}`,
        excerpt: m.content.substring(0, 200) + (m.content.length > 200 ? '...' : ''),
      });
    });

    return citations;
  }
}

export const conversationMemoryService = new ConversationMemoryService();
