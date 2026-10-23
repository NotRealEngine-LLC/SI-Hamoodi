// HAMOODI SyntheTech Intelligence — Core Intelligence Service
// Phase 05: Central orchestration service

import { v4 as uuidv4 } from 'uuid';
import { puterProvider } from './providers/puter';
import { modelRegistry } from './model-registry';
import { contextAssembler } from './context-assembler';
import { getSupabaseClient } from '../supabase/client';
import {
  GenerationRequest,
  GenerationResult,
  GenerationEvent,
  ContextScope,
  AIPreset,
  RoutingPolicy,
  SIError,
  AuthenticationError,
  ModelNotFoundError,
} from './types';

export class SIIntelligenceService {
  private activeGenerations: Map<string, AbortController> = new Map();

  async initialize(): Promise<void> {
    await modelRegistry.initialize();
  }

  async generate(
    scope: ContextScope,
    userId: string,
    userMessage: string,
    modelId: string,
    preset?: AIPreset,
    signal?: AbortSignal
  ): Promise<GenerationResult> {
    const generationId = uuidv4();
    const abortController = new AbortController();
    
    // Link external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => abortController.abort());
    }

    this.activeGenerations.set(generationId, abortController);

    try {
      // Check authentication
      if (!(await puterProvider.isAuthenticated())) {
        throw new AuthenticationError();
      }

      // Validate model
      const model = modelRegistry.getModel(modelId);
      if (!model) {
        throw new ModelNotFoundError(modelId);
      }

      // Assemble context
      const context = await contextAssembler.assemble(scope, userId);

      // Build system prompt
      const systemPrompt = contextAssembler.buildSystemPrompt(context, preset);

      // Get conversation history
      const messages = await this.getConversationMessages(scope.conversationId);

      // Add user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Create generation request
      const request: GenerationRequest = {
        conversationId: scope.conversationId || '',
        messages,
        modelId,
        systemPrompt,
        hubInstructions: context.hub?.instructions || undefined,
        projectInstructions: context.project?.instructions || undefined,
        stream: false,
        signal: abortController.signal,
      };

      // Execute generation
      const result = await puterProvider.generate(request);

      // Record trace
      await this.recordTrace({
        conversationId: scope.conversationId || '',
        messageId: result.messageId,
        workspaceId: scope.workspaceId,
        providerAdapter: result.providerAdapter,
        modelId: result.modelId,
        requestMetadata: {
          systemPrompt,
          messageCount: messages.length,
          preset,
        },
        responseMetadata: result.metadata || {},
        tokenUsage: result.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs: result.durationMs || 0,
        status: result.status,
      });

      // Save assistant message
      if (scope.conversationId) {
        await this.saveAssistantMessage(scope.conversationId, result);
      }

      return result;
    } catch (error) {
      if (error instanceof SIError) {
        throw error;
      }
      throw new SIError(
        'GENERATION_FAILED',
        error instanceof Error ? error.message : 'Unknown error',
        true,
        error
      );
    } finally {
      this.activeGenerations.delete(generationId);
    }
  }

  async *stream(
    scope: ContextScope,
    userId: string,
    userMessage: string,
    modelId: string,
    preset?: AIPreset,
    signal?: AbortSignal
  ): AsyncIterable<GenerationEvent> {
    const generationId = uuidv4();
    const abortController = new AbortController();
    
    if (signal) {
      signal.addEventListener('abort', () => abortController.abort());
    }

    this.activeGenerations.set(generationId, abortController);

    try {
      // Check authentication
      if (!(await puterProvider.isAuthenticated())) {
        throw new AuthenticationError();
      }

      // Validate model
      const model = modelRegistry.getModel(modelId);
      if (!model) {
        throw new ModelNotFoundError(modelId);
      }

      // Assemble context
      const context = await contextAssembler.assemble(scope, userId);

      // Build system prompt
      const systemPrompt = contextAssembler.buildSystemPrompt(context, preset);

      // Get conversation history
      const messages = await this.getConversationMessages(scope.conversationId);

      // Add user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Create generation request
      const request: GenerationRequest = {
        conversationId: scope.conversationId || '',
        messages,
        modelId,
        systemPrompt,
        hubInstructions: context.hub?.instructions || undefined,
        projectInstructions: context.project?.instructions || undefined,
        stream: true,
        signal: abortController.signal,
      };

      // Stream generation
      let fullContent = '';
      for await (const event of puterProvider.stream(request)) {
        if (event.type === 'generation.text_delta') {
          fullContent += event.delta;
        }
        yield event;
      }

      // Record trace after streaming completes
      const startTime = Date.now();
      await this.recordTrace({
        conversationId: scope.conversationId || '',
        messageId: '',
        workspaceId: scope.workspaceId,
        providerAdapter: 'puter',
        modelId,
        requestMetadata: {
          systemPrompt,
          messageCount: messages.length,
          preset,
        },
        responseMetadata: {},
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        durationMs: Date.now() - startTime,
        status: 'completed',
      });

    } catch (error) {
      if (error instanceof SIError) {
        yield {
          type: 'generation.failed',
          generationId,
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
          },
        };
      } else {
        yield {
          type: 'generation.failed',
          generationId,
          error: {
            code: 'GENERATION_FAILED',
            message: error instanceof Error ? error.message : 'Unknown error',
            retryable: true,
          },
        };
      }
    } finally {
      this.activeGenerations.delete(generationId);
    }
  }

  async cancelGeneration(generationId: string): Promise<void> {
    const controller = this.activeGenerations.get(generationId);
    if (controller) {
      controller.abort();
      this.activeGenerations.delete(generationId);
    }
  }

  private async getConversationMessages(conversationId?: string): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> {
    if (!conversationId) {
      return [];
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return [];
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return (messages || []).map(m => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
  }

  private async saveAssistantMessage(conversationId: string, result: GenerationResult): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: result.content,
      status: 'completed',
      model_id: result.modelId,
      metadata: {
        generation_id: result.id,
        provider_adapter: result.providerAdapter,
        token_usage: result.tokenUsage,
        duration_ms: result.durationMs,
      },
    });
  }

  private async recordTrace(trace: {
    conversationId: string;
    messageId: string;
    workspaceId: string;
    providerAdapter: string;
    modelId: string;
    requestMetadata: Record<string, unknown>;
    responseMetadata: Record<string, unknown>;
    tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
    durationMs: number;
    status: 'completed' | 'failed' | 'cancelled';
    errorCode?: string;
    errorMessage?: string;
  }): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('generation_traces').insert({
      conversation_id: trace.conversationId,
      message_id: trace.messageId,
      workspace_id: trace.workspaceId,
      provider_adapter: trace.providerAdapter,
      model_id: trace.modelId,
      request_metadata: trace.requestMetadata,
      response_metadata: trace.responseMetadata,
      token_usage: trace.tokenUsage,
      duration_ms: trace.durationMs,
      status: trace.status,
      error_code: trace.errorCode,
      error_message: trace.errorMessage,
    });
  }
}

// Export singleton instance
export const siIntelligenceService = new SIIntelligenceService();
