// HAMOODI SyntheTech Intelligence — Core Intelligence Types
// Phase 05: SI Core Intelligence Engine

export type GenerationStatus = 'idle' | 'preparing' | 'auth_required' | 'queued' | 'streaming' | 'finalizing' | 'completed' | 'failed' | 'cancelled';

export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

export type MessageStatus = 'pending' | 'streaming' | 'completed' | 'failed' | 'cancelled';

export type ModelCapability = 
  | 'streaming'
  | 'tool_calling'
  | 'image_input'
  | 'reasoning'
  | 'system_instructions'
  | 'structured_output'
  | 'extended_context';

export type CapabilitySupport = 'supported' | 'unsupported' | 'unknown';

export type RoutingPolicy = 'manual' | 'auto' | 'fast' | 'balanced' | 'advanced';

export type AIPreset = 'general' | 'concise' | 'detailed' | 'creative' | 'technical' | 'research';

// ============================================================
// MODEL TYPES
// ============================================================

export interface AIModel {
  id: string;
  providerAdapter: string;
  providerName: string;
  displayName: string;
  description?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  inputCost?: number;
  outputCost?: number;
  currency?: string;
  capabilities: Record<ModelCapability, CapabilitySupport>;
  availability: 'available' | 'unavailable' | 'deprecated';
  lastVerifiedAt: string;
}

export interface ModelRegistry {
  models: AIModel[];
  lastUpdated: string;
  refresh: () => Promise<void>;
  getModel: (id: string) => AIModel | undefined;
  searchModels: (query: string) => AIModel[];
  filterByCapability: (capability: ModelCapability) => AIModel[];
}

// ============================================================
// GENERATION TYPES
// ============================================================

export interface GenerationRequest {
  conversationId: string;
  messages: GenerationMessage[];
  modelId: string;
  systemPrompt?: string;
  hubInstructions?: string;
  projectInstructions?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  signal?: AbortSignal;
}

export interface GenerationMessage {
  role: MessageRole;
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface GenerationResult {
  id: string;
  conversationId: string;
  messageId: string;
  content: string;
  modelId: string;
  providerAdapter: string;
  status: 'completed' | 'failed' | 'cancelled';
  tokenUsage?: TokenUsage;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: GenerationError;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost?: number;
  currency?: string;
}

export interface GenerationError {
  code: string;
  message: string;
  retryable: boolean;
  providerError?: unknown;
}

// ============================================================
// STREAMING TYPES
// ============================================================

export type GenerationEvent =
  | { type: 'generation.started'; generationId: string; modelId: string }
  | { type: 'generation.text_delta'; generationId: string; delta: string }
  | { type: 'generation.reasoning_delta'; generationId: string; delta: string }
  | { type: 'generation.tool_call_requested'; generationId: string; toolCall: ToolCall }
  | { type: 'generation.usage'; generationId: string; usage: TokenUsage }
  | { type: 'generation.completed'; generationId: string; result: GenerationResult }
  | { type: 'generation.failed'; generationId: string; error: GenerationError }
  | { type: 'generation.cancelled'; generationId: string }
  | { type: 'generation.metadata'; generationId: string; metadata: Record<string, unknown> };

export interface StreamNormalizer {
  normalize(providerStream: AsyncIterable<unknown>): AsyncIterable<GenerationEvent>;
}

// ============================================================
// PROVIDER TYPES
// ============================================================

export interface AIProvider {
  id: string;
  name: string;
  
  listModels(): Promise<AIModel[]>;
  
  generate(request: GenerationRequest): Promise<GenerationResult>;
  
  stream(request: GenerationRequest): AsyncIterable<GenerationEvent>;
  
  supports(capability: ModelCapability, modelId: string): Promise<CapabilitySupport>;
  
  isAuthenticated(): Promise<boolean>;
  
  authenticate(): Promise<void>;
}

// ============================================================
// CONTEXT TYPES
// ============================================================

export interface ContextScope {
  workspaceId: string;
  hubId?: string;
  projectId?: string;
  conversationId?: string;
}

export interface AuthorizedContext {
  workspace: {
    id: string;
    name: string;
    description: string | null;
    type: 'personal' | 'team';
  } | null;
  hub: {
    id: string;
    name: string;
    instructions: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    instructions: string | null;
  } | null;
  conversation: {
    id: string;
    title: string;
    messages: GenerationMessage[];
  } | null;
  availableFiles: string[];
  timestamp: string;
}

export interface ContextAssembler {
  assemble(scope: ContextScope, userId: string): Promise<AuthorizedContext>;
  buildSystemPrompt(context: AuthorizedContext, preset?: AIPreset): string;
}

// ============================================================
// CONVERSATION ENGINE TYPES
// ============================================================

export interface ConversationBranch {
  parentConversationId: string;
  forkedFromMessageId: string;
  branchLabel?: string;
}

export interface MessageEdit {
  messageId: string;
  newContent: string;
  createBranch?: boolean;
}

export interface RegenerationRequest {
  messageId: string;
  newModelId?: string;
  preserveOriginal?: boolean;
}

export interface ConversationEngine {
  createConversation(workspaceId: string, projectId?: string, title?: string): Promise<string>;
  
  branchConversation(branch: ConversationBranch): Promise<string>;
  
  editMessage(edit: MessageEdit): Promise<string>;
  
  regenerateResponse(request: RegenerationRequest): Promise<string>;
  
  cancelGeneration(generationId: string): Promise<void>;
  
  getConversationHistory(conversationId: string, limit?: number): Promise<GenerationMessage[]>;
}

// ============================================================
// ROUTING TYPES
// ============================================================

export interface RoutingDecision {
  modelId: string;
  reason: string;
  confidence: number;
  alternatives: string[];
}

export interface ModelRouter {
  route(policy: RoutingPolicy, requiredCapabilities: ModelCapability[], context: AuthorizedContext): Promise<RoutingDecision>;
  
  validateRequest(request: GenerationRequest, model: AIModel): { valid: boolean; errors: string[] };
}

// ============================================================
// USAGE TRACKING TYPES
// ============================================================

export interface GenerationTrace {
  id: string;
  conversationId: string;
  messageId: string;
  workspaceId: string;
  providerAdapter: string;
  modelId: string;
  requestMetadata: Record<string, unknown>;
  responseMetadata: Record<string, unknown>;
  tokenUsage: TokenUsage;
  durationMs: number;
  status: 'completed' | 'failed' | 'cancelled';
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
}

export interface UsageRecorder {
  recordTrace(trace: Omit<GenerationTrace, 'id' | 'createdAt'>): Promise<string>;
  
  getUsageSummary(workspaceId: string, period: 'day' | 'week' | 'month'): Promise<UsageSummary>;
}

export interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
  currency: string;
  byModel: Record<string, { requests: number; tokens: number; cost: number }>;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class SIError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
    public providerError?: unknown
  ) {
    super(message);
    this.name = 'SIError';
  }
}

export class AuthenticationError extends SIError {
  constructor(message: string = 'Authentication required') {
    super('AUTH_REQUIRED', message, false);
    this.name = 'AuthenticationError';
  }
}

export class ModelNotFoundError extends SIError {
  constructor(modelId: string) {
    super('MODEL_NOT_FOUND', `Model ${modelId} not found`, false);
    this.name = 'ModelNotFoundError';
  }
}

export class CapabilityNotSupportedError extends SIError {
  constructor(capability: ModelCapability, modelId: string) {
    super('CAPABILITY_NOT_SUPPORTED', `Model ${modelId} does not support ${capability}`, false);
    this.name = 'CapabilityNotSupportedError';
  }
}

export class ContextOverflowError extends SIError {
  constructor(limit: number, actual: number) {
    super('CONTEXT_OVERFLOW', `Context exceeds limit (${actual} > ${limit})`, false);
    this.name = 'ContextOverflowError';
  }
}

export class RateLimitError extends SIError {
  constructor(retryAfter?: number) {
    super('RATE_LIMITED', 'Rate limit exceeded', true);
    this.name = 'RateLimitError';
  }
}

export class GenerationCancelledError extends SIError {
  constructor() {
    super('GENERATION_CANCELLED', 'Generation was cancelled', false);
    this.name = 'GenerationCancelledError';
  }
}
