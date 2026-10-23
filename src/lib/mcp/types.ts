// HAMOODI SyntheTech Intelligence — MCP Types & Interfaces
// Phase 08: Model Context Protocol Ecosystem

export type ConnectionStatus = 
  | 'unconfigured'
  | 'connecting'
  | 'auth_required'
  | 'connected'
  | 'degraded'
  | 'disconnected'
  | 'expired'
  | 'failed'
  | 'disabled';

export type AuthType = 'none' | 'oauth2' | 'api_key' | 'bearer';
export type ProviderCategory = 'mcp' | 'oauth' | 'api_key' | 'builtin';
export type ToolRiskLevel = 'read' | 'write' | 'sensitive' | 'high_risk';
export type ToolExecutionStatus = 
  | 'pending'
  | 'validating'
  | 'awaiting_approval'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired';

export type TransportType = 'streamable_http' | 'stdio';

// ============================================================
// PROVIDER TYPES
// ============================================================

export interface IntegrationProvider {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  category: ProviderCategory;
  auth_type: AuthType;
  
  // OAuth Configuration
  oauth_authorize_url?: string;
  oauth_token_url?: string;
  oauth_client_id?: string;
  oauth_scopes?: string[];
  
  // MCP Configuration
  mcp_endpoint_template?: string;
  mcp_protocol_version?: string;
  
  // Metadata
  is_official: boolean;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CONNECTION TYPES
// ============================================================

export interface IntegrationConnection {
  id: string;
  user_id: string;
  workspace_id?: string;
  provider_id: string;
  
  // Connection Metadata
  name: string;
  description?: string;
  
  // Connection State
  status: ConnectionStatus;
  
  // MCP Server Info
  mcp_endpoint?: string;
  mcp_protocol_version?: string;
  mcp_capabilities?: Record<string, any>;
  
  // OAuth Info
  oauth_scopes?: string[];
  oauth_expires_at?: string;
  
  // Health
  last_health_check?: string;
  last_success_at?: string;
  last_error_code?: string;
  last_error_message?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Provider (joined)
  provider?: IntegrationProvider;
}

export interface CreateConnectionInput {
  provider_id: string;
  workspace_id?: string;
  name: string;
  description?: string;
  mcp_endpoint?: string;
}

export interface UpdateConnectionInput {
  name?: string;
  description?: string;
  status?: ConnectionStatus;
  mcp_endpoint?: string;
  mcp_capabilities?: Record<string, any>;
  oauth_scopes?: string[];
  oauth_expires_at?: string;
  last_health_check?: string;
  last_success_at?: string;
  last_error_code?: string;
  last_error_message?: string;
}

// ============================================================
// MCP SERVER TYPES
// ============================================================

export interface MCPServer {
  id: string;
  connection_id: string;
  
  // Server Identity
  server_name: string;
  server_version?: string;
  
  // Protocol
  protocol_version: string;
  transport_type: TransportType;
  
  // Capabilities
  capabilities: Record<string, any>;
  tools_count: number;
  resources_count: number;
  prompts_count: number;
  
  // Status
  is_connected: boolean;
  last_connected_at?: string;
  last_discovery_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================
// TOOL DEFINITION TYPES
// ============================================================

export interface MCPToolDefinition {
  id: string;
  server_id: string;
  
  // Tool Identity
  server_tool_name: string;
  namespaced_id: string; // Format: connectionId:toolName
  display_name: string;
  description: string;
  
  // Schemas
  input_schema: Record<string, any>;
  output_schema?: Record<string, any>;
  schema_hash: string;
  
  // Classification
  risk_level: ToolRiskLevel;
  is_enabled: boolean;
  
  // Discovery
  discovered_at: string;
  last_verified_at: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ToolPermission {
  id: string;
  user_id: string;
  workspace_id?: string;
  tool_namespaced_id: string;
  
  is_enabled: boolean;
  requires_approval: boolean;
  
  granted_at: string;
  granted_by: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================================
// EXECUTION TYPES
// ============================================================

export interface ToolExecutionEvent {
  id: string;
  user_id: string;
  workspace_id?: string;
  connection_id?: string;
  tool_namespaced_id: string;
  
  // Execution Context
  run_id?: string;
  task_id?: string;
  
  // Execution Details
  status: ToolExecutionStatus;
  risk_level: ToolRiskLevel;
  
  // Input/Output (Redacted)
  input_hash: string;
  input_redacted?: Record<string, any>;
  output_summary?: string;
  output_size_bytes?: number;
  
  // Timing
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  
  // Approval
  approval_id?: string;
  
  // Errors
  error_code?: string;
  error_message?: string;
  
  // Timestamp
  created_at: string;
}

export interface ToolInvocationRequest {
  toolNamespacedId: string;
  input: Record<string, any>;
  context: {
    userId: string;
    workspaceId?: string;
    runId?: string;
    taskId?: string;
  };
}

export interface ToolInvocationResult {
  success: boolean;
  output?: any;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  durationMs: number;
  executionId: string;
}

// ============================================================
// MCP PROTOCOL TYPES
// ============================================================

export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: {};
  experimental?: Record<string, any>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema?: Record<string, any>;
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  annotations?: {
    audience?: string[];
    priority?: number;
  };
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// ============================================================
// OAUTH TYPES
// ============================================================

export interface OAuthConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  scopes: string[];
  redirectUri: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scopes: string[];
}

export interface OAuthState {
  connectionId: string;
  userId: string;
  workspaceId?: string;
  pkceVerifier: string;
  redirectUri: string;
  createdAt: number;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
    public context?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export class ConnectionError extends MCPError {
  constructor(message: string, context?: any) {
    super('CONNECTION_FAILED', message, true, context);
    this.name = 'ConnectionError';
  }
}

export class AuthenticationError extends MCPError {
  constructor(message: string = 'Authentication required') {
    super('AUTH_REQUIRED', message, false);
    this.name = 'AuthenticationError';
  }
}

export class ToolNotFoundError extends MCPError {
  constructor(toolId: string) {
    super('TOOL_NOT_FOUND', `Tool not found: ${toolId}`, false);
    this.name = 'ToolNotFoundError';
  }
}

export class PermissionDeniedError extends MCPError {
  constructor(message: string = 'Permission denied') {
    super('PERMISSION_DENIED', message, false);
    this.name = 'PermissionDeniedError';
  }
}

export class ValidationError extends MCPError {
  constructor(message: string, context?: any) {
    super('VALIDATION_FAILED', message, false, context);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends MCPError {
  constructor(retryAfter?: number) {
    super('RATE_LIMITED', 'Rate limit exceeded', true, { retryAfter });
    this.name = 'RateLimitError';
  }
}
