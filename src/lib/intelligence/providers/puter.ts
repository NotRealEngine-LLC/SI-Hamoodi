// HAMOODI SyntheTech Intelligence — Puter AI Provider
// Phase 05: Real Puter-backed model gateway

import {
  AIProvider,
  AIModel,
  GenerationRequest,
  GenerationResult,
  GenerationEvent,
  ModelCapability,
  CapabilitySupport,
  TokenUsage,
  SIError,
  AuthenticationError,
  ModelNotFoundError,
  CapabilityNotSupportedError,
  GenerationCancelledError,
} from '../types';

// Puter.js is already declared in src/lib/puter/ai.ts
// We extend it here for additional capabilities

export class PuterAIProvider implements AIProvider {
  id = 'puter';
  name = 'Puter.js';
  
  private modelCache: AIModel[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.puter?.auth) {
      return false;
    }
    try {
      return await window.puter.auth.isSignedIn();
    } catch {
      return false;
    }
  }

  async authenticate(): Promise<void> {
    if (typeof window === 'undefined' || !window.puter?.auth) {
      throw new AuthenticationError('Puter.js is not available');
    }
    try {
      await window.puter.auth.signIn();
    } catch (error) {
      throw new AuthenticationError(`Puter authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listModels(): Promise<AIModel[]> {
    // Check cache
    if (this.modelCache && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.modelCache;
    }

    // Try to fetch from Puter API
    if (typeof window !== 'undefined' && window.puter?.ai?.listModels) {
      try {
        const puterModels = await window.puter.ai.listModels();
        this.modelCache = puterModels.map(this.normalizePuterModel.bind(this));
        this.cacheTimestamp = Date.now();
        return this.modelCache;
      } catch (error) {
        console.warn('Failed to fetch models from Puter API, using fallback list:', error);
      }
    }

    // Fallback to known models
    this.modelCache = this.getFallbackModels();
    this.cacheTimestamp = Date.now();
    return this.modelCache;
  }

  private normalizePuterModel(puterModel: any): AIModel {
    return {
      id: puterModel.id,
      providerAdapter: this.id,
      providerName: puterModel.provider || 'Unknown',
      displayName: puterModel.name || puterModel.id,
      description: puterModel.description,
      contextWindow: puterModel.context_window,
      maxOutputTokens: puterModel.max_output_tokens,
      inputCost: puterModel.input_cost,
      outputCost: puterModel.output_cost,
      currency: puterModel.currency || 'USD',
      capabilities: {
        streaming: puterModel.supports_streaming ? 'supported' : 'unknown',
        tool_calling: puterModel.supports_tools ? 'supported' : 'unknown',
        image_input: puterModel.supports_images ? 'supported' : 'unknown',
        reasoning: puterModel.supports_reasoning ? 'supported' : 'unknown',
        system_instructions: 'supported',
        structured_output: 'unknown',
        extended_context: 'unknown',
      },
      availability: 'available',
      lastVerifiedAt: new Date().toISOString(),
    };
  }

  private getFallbackModels(): AIModel[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'gpt-4o-mini',
        providerAdapter: this.id,
        providerName: 'OpenAI',
        displayName: 'GPT-4o Mini',
        description: 'Fast and affordable small model',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        capabilities: {
          streaming: 'supported',
          tool_calling: 'supported',
          image_input: 'supported',
          reasoning: 'unsupported',
          system_instructions: 'supported',
          structured_output: 'supported',
          extended_context: 'supported',
        },
        availability: 'available',
        lastVerifiedAt: now,
      },
      {
        id: 'gpt-4o',
        providerAdapter: this.id,
        providerName: 'OpenAI',
        displayName: 'GPT-4o',
        description: 'Most capable OpenAI model',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        capabilities: {
          streaming: 'supported',
          tool_calling: 'supported',
          image_input: 'supported',
          reasoning: 'supported',
          system_instructions: 'supported',
          structured_output: 'supported',
          extended_context: 'supported',
        },
        availability: 'available',
        lastVerifiedAt: now,
      },
      {
        id: 'claude-3-5-sonnet',
        providerAdapter: this.id,
        providerName: 'Anthropic',
        displayName: 'Claude 3.5 Sonnet',
        description: 'Balanced performance and intelligence',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        capabilities: {
          streaming: 'supported',
          tool_calling: 'supported',
          image_input: 'supported',
          reasoning: 'supported',
          system_instructions: 'supported',
          structured_output: 'supported',
          extended_context: 'supported',
        },
        availability: 'available',
        lastVerifiedAt: now,
      },
      {
        id: 'claude-3-5-haiku',
        providerAdapter: this.id,
        providerName: 'Anthropic',
        displayName: 'Claude 3.5 Haiku',
        description: 'Fast and efficient',
        contextWindow: 200000,
        maxOutputTokens: 8192,
        capabilities: {
          streaming: 'supported',
          tool_calling: 'supported',
          image_input: 'supported',
          reasoning: 'unsupported',
          system_instructions: 'supported',
          structured_output: 'supported',
          extended_context: 'supported',
        },
        availability: 'available',
        lastVerifiedAt: now,
      },
      {
        id: 'deepseek-chat',
        providerAdapter: this.id,
        providerName: 'DeepSeek',
        displayName: 'DeepSeek Chat',
        description: 'Open-source conversational model',
        contextWindow: 64000,
        maxOutputTokens: 8192,
        capabilities: {
          streaming: 'supported',
          tool_calling: 'unknown',
          image_input: 'unsupported',
          reasoning: 'unsupported',
          system_instructions: 'supported',
          structured_output: 'unknown',
          extended_context: 'unknown',
        },
        availability: 'available',
        lastVerifiedAt: now,
      },
      {
        id: 'gemini-2.0-flash',
        providerAdapter: this.id,
        providerName: 'Google',
        displayName: 'Gemini 2.0 Flash',
        description: 'Fast multimodal model',
        contextWindow: 1000000,
        maxOutputTokens: 8192,
        capabilities: {
          streaming: 'supported',
          tool_calling: 'supported',
          image_input: 'supported',
          reasoning: 'unsupported',
          system_instructions: 'supported',
          structured_output: 'supported',
          extended_context: 'supported',
        },
        availability: 'available',
        lastVerifiedAt: now,
      },
    ];
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check authentication
      if (!(await this.isAuthenticated())) {
        throw new AuthenticationError();
      }

      // Validate model exists
      const models = await this.listModels();
      const model = models.find(m => m.id === request.modelId);
      if (!model) {
        throw new ModelNotFoundError(request.modelId);
      }

      // Check streaming capability
      if (request.stream && model.capabilities.streaming === 'unsupported') {
        throw new CapabilityNotSupportedError('streaming', request.modelId);
      }

      // Prepare messages
      const messages = this.prepareMessages(request);

      // Make request
      const response = await window.puter!.ai.chat(messages, {
        model: request.modelId,
        stream: request.stream || false,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      });

      // Handle response
      let content: string;
      let tokenUsage: TokenUsage | undefined;

      if (typeof response === 'string') {
        content = response;
      } else if (response instanceof ReadableStream) {
        // Handle streaming response
        const reader = response.getReader();
        let fullText = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            if (request.signal?.aborted) {
              throw new GenerationCancelledError();
            }
            
            const chunk = new TextDecoder().decode(value);
            fullText += chunk;
          }
        } catch (error) {
          if (error instanceof GenerationCancelledError) {
            throw error;
          }
          throw new SIError('STREAM_ERROR', `Stream reading failed: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
        }
        
        content = fullText;
      } else {
        content = String(response);
      }

      // Estimate token usage (rough approximation)
      tokenUsage = this.estimateTokenUsage(messages, content);

      const durationMs = Date.now() - startTime;

      return {
        id: generationId,
        conversationId: request.conversationId,
        messageId: '', // Will be set by caller
        content,
        modelId: request.modelId,
        providerAdapter: this.id,
        status: 'completed',
        tokenUsage,
        durationMs,
        metadata: {
          model: model.displayName,
          provider: model.providerName,
        },
      };
    } catch (error) {
      if (error instanceof SIError) {
        throw error;
      }

      // Normalize unknown errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new SIError('GENERATION_FAILED', `Generation failed: ${errorMessage}`, true, error);
    }
  }

  async *stream(request: GenerationRequest): AsyncIterable<GenerationEvent> {
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Check authentication
      if (!(await this.isAuthenticated())) {
        throw new AuthenticationError();
      }

      // Validate model exists
      const models = await this.listModels();
      const model = models.find(m => m.id === request.modelId);
      if (!model) {
        throw new ModelNotFoundError(request.modelId);
      }

      // Emit started event
      yield {
        type: 'generation.started',
        generationId,
        modelId: request.modelId,
      };

      // Prepare messages
      const messages = this.prepareMessages(request);

      // Make streaming request
      const response = await window.puter!.ai.chat(messages, {
        model: request.modelId,
        stream: true,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      });

      let fullText = '';

      if (!(response instanceof ReadableStream)) {
        // Non-streaming response, emit as single delta
        const content = String(response);
        fullText = content;
        yield {
          type: 'generation.text_delta',
          generationId,
          delta: content,
        };
      } else {
        // Handle streaming response
        const reader = response.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            if (request.signal?.aborted) {
              yield {
                type: 'generation.cancelled',
                generationId,
              };
              return;
            }
            
            const chunk = new TextDecoder().decode(value);
            fullText += chunk;
            
            yield {
              type: 'generation.text_delta',
              generationId,
              delta: chunk,
            };
          }
        } catch (error) {
          if (request.signal?.aborted) {
            yield {
              type: 'generation.cancelled',
              generationId,
            };
            return;
          }
          
          yield {
            type: 'generation.failed',
            generationId,
            error: {
              code: 'STREAM_ERROR',
              message: `Stream reading failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              retryable: true,
            },
          };
          return;
        }
      }

      // Estimate token usage
      const tokenUsage = this.estimateTokenUsage(messages, fullText);

      yield {
        type: 'generation.usage',
        generationId,
        usage: tokenUsage,
      };

      // Emit completed event
      yield {
        type: 'generation.completed',
        generationId,
        result: {
          id: generationId,
          conversationId: request.conversationId,
          messageId: '',
          content: fullText,
          modelId: request.modelId,
          providerAdapter: this.id,
          status: 'completed',
          tokenUsage,
          metadata: {
            model: model.displayName,
            provider: model.providerName,
          },
        },
      };
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
            message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            retryable: true,
          },
        };
      }
    }
  }

  async supports(capability: ModelCapability, modelId: string): Promise<CapabilitySupport> {
    const models = await this.listModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      return 'unknown';
    }
    
    return model.capabilities[capability] || 'unknown';
  }

  private prepareMessages(request: GenerationRequest): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    // Add conversation messages
    for (const msg of request.messages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  private estimateTokenUsage(messages: Array<{ role: string; content: string }>, response: string): TokenUsage {
    // Rough estimation: ~4 characters per token
    const promptTokens = Math.ceil(messages.reduce((sum, msg) => sum + msg.content.length, 0) / 4);
    const completionTokens = Math.ceil(response.length / 4);
    const totalTokens = promptTokens + completionTokens;

    return {
      promptTokens,
      completionTokens,
      totalTokens,
    };
  }
}

// Export singleton instance
export const puterProvider = new PuterAIProvider();
