// HAMOODI SyntheTech Intelligence — Phase 10 Types
// Custom Agents, Skills & Workflow Automation

// ============================================================
// CUSTOM AGENT TYPES
// ============================================================

export type AgentStatus = 'draft' | 'active' | 'archived';

export interface ModelPolicy {
  mode: 'manual' | 'auto';
  modelId?: string;
  capabilities?: string[];
}

export interface CustomAgent {
  id: string;
  workspace_id: string;
  owner_id: string;
  
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  
  instructions: string;
  model_policy: ModelPolicy;
  skill_ids: string[];
  allowed_tool_ids: string[];
  knowledge_scope: string[];
  
  max_iterations: number;
  max_model_calls: number;
  max_tool_calls: number;
  
  requires_approval_for_writes: boolean;
  
  status: AgentStatus;
  current_version: number;
  
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface AgentVersion {
  id: string;
  agent_id: string;
  version_number: number;
  
  configuration: Partial<CustomAgent>;
  instructions: string;
  model_policy: ModelPolicy;
  skill_ids: string[];
  allowed_tool_ids: string[];
  
  change_summary?: string;
  created_by: string;
  
  created_at: string;
}

export interface CreateAgentInput {
  workspace_id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  instructions: string;
  model_policy?: ModelPolicy;
  skill_ids?: string[];
  allowed_tool_ids?: string[];
  knowledge_scope?: string[];
  max_iterations?: number;
  max_model_calls?: number;
  max_tool_calls?: number;
  requires_approval_for_writes?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  instructions?: string;
  model_policy?: ModelPolicy;
  skill_ids?: string[];
  allowed_tool_ids?: string[];
  knowledge_scope?: string[];
  max_iterations?: number;
  max_model_calls?: number;
  max_tool_calls?: number;
  requires_approval_for_writes?: boolean;
  status?: AgentStatus;
  metadata?: Record<string, any>;
  change_summary?: string;
}

// ============================================================
// AGENT SKILL TYPES
// ============================================================

export type SkillStatus = 'draft' | 'validated' | 'published' | 'deprecated' | 'archived';

export interface SkillManifest {
  name: string;
  description: string;
  version: string;
  author?: string;
  license?: string;
  dependencies?: string[];
  requested_capabilities?: string[];
  metadata?: Record<string, any>;
}

export interface AgentSkill {
  id: string;
  workspace_id?: string;
  owner_id: string;
  
  name: string;
  description?: string;
  category?: string;
  
  instructions: string;
  manifest: SkillManifest;
  
  resource_files: string[];
  requested_capabilities: string[];
  
  status: SkillStatus;
  current_version: number;
  
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface SkillVersion {
  id: string;
  skill_id: string;
  version_number: number;
  
  instructions: string;
  manifest: SkillManifest;
  resource_files: string[];
  
  change_summary?: string;
  created_by: string;
  
  created_at: string;
}

export interface CreateSkillInput {
  workspace_id?: string;
  name: string;
  description?: string;
  category?: string;
  instructions: string;
  manifest: SkillManifest;
  resource_files?: string[];
  requested_capabilities?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateSkillInput {
  name?: string;
  description?: string;
  category?: string;
  instructions?: string;
  manifest?: SkillManifest;
  resource_files?: string[];
  requested_capabilities?: string[];
  status?: SkillStatus;
  metadata?: Record<string, any>;
  change_summary?: string;
}

// ============================================================
// MARKETPLACE TYPES
// ============================================================

export type MarketplaceItemType = 'agent' | 'skill' | 'workflow_template';
export type MarketplaceVisibility = 'private' | 'workspace' | 'curated_public';
export type MarketplaceStatus = 'pending' | 'approved' | 'rejected' | 'archived';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type InstallationStatus = 'active' | 'uninstalled' | 'outdated';

export interface MarketplaceListing {
  id: string;
  publisher_id: string;
  workspace_id?: string;
  
  item_type: MarketplaceItemType;
  item_id: string;
  item_version: number;
  
  title: string;
  description?: string;
  category?: string;
  
  visibility: MarketplaceVisibility;
  status: MarketplaceStatus;
  review_status: ReviewStatus;
  
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface MarketplaceInstallation {
  id: string;
  listing_id: string;
  workspace_id: string;
  installed_by: string;
  
  installed_version: number;
  installed_item_id: string;
  
  status: InstallationStatus;
  
  metadata: Record<string, any>;
  
  installed_at: string;
  updated_at: string;
}

export interface CreateListingInput {
  workspace_id?: string;
  item_type: MarketplaceItemType;
  item_id: string;
  item_version: number;
  title: string;
  description?: string;
  category?: string;
  visibility?: MarketplaceVisibility;
  metadata?: Record<string, any>;
}

// ============================================================
// WORKFLOW TYPES
// ============================================================

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type WorkflowRunStatus = 
  | 'queued' 
  | 'running' 
  | 'awaiting_approval' 
  | 'awaiting_client'
  | 'paused' 
  | 'completed' 
  | 'partially_completed' 
  | 'failed' 
  | 'cancelled';

export type WorkflowNodeType = 
  | 'trigger'
  | 'agent'
  | 'tool'
  | 'condition'
  | 'transform'
  | 'approval'
  | 'delay'
  | 'output';

export type TriggerType = 'manual' | 'scheduled' | 'webhook' | 'event';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  config: Record<string, any>;
  input_schema?: Record<string, any>;
  output_schema?: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowDefinition {
  id: string;
  workspace_id: string;
  owner_id: string;
  
  name: string;
  description?: string;
  
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  status: WorkflowStatus;
  current_version: number;
  
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface WorkflowVersion {
  id: string;
  workflow_id: string;
  version_number: number;
  
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  change_summary?: string;
  created_by: string;
  
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  workspace_id: string;
  
  workflow_version: number;
  trigger_type: TriggerType;
  trigger_data: Record<string, any>;
  
  status: WorkflowRunStatus;
  
  started_at?: string;
  completed_at?: string;
  
  node_results: Record<string, any>;
  final_output?: any;
  error_message?: string;
  
  initiated_by: string;
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  
  trigger_type: TriggerType;
  configuration: Record<string, any>;
  
  enabled: boolean;
  
  webhook_secret?: string;
  webhook_url?: string;
  
  schedule_timezone?: string;
  schedule_expression?: string;
  next_run_at?: string;
  
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowInput {
  workspace_id: string;
  name: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  metadata?: Record<string, any>;
}

export interface UpdateWorkflowInput {
  name?: string;
  description?: string;
  nodes?: WorkflowNode[];
  edges?: WorkflowEdge[];
  status?: WorkflowStatus;
  metadata?: Record<string, any>;
  change_summary?: string;
}

export interface CreateTriggerInput {
  workflow_id: string;
  trigger_type: TriggerType;
  configuration?: Record<string, any>;
  enabled?: boolean;
  webhook_secret?: string;
  schedule_timezone?: string;
  schedule_expression?: string;
  metadata?: Record<string, any>;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class AgentError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class AgentNotFoundError extends AgentError {
  constructor(agentId: string) {
    super('AGENT_NOT_FOUND', `Agent not found: ${agentId}`);
    this.name = 'AgentNotFoundError';
  }
}

export class SkillError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'SkillError';
  }
}

export class SkillNotFoundError extends SkillError {
  constructor(skillId: string) {
    super('SKILL_NOT_FOUND', `Skill not found: ${skillId}`);
    this.name = 'SkillNotFoundError';
  }
}

export class WorkflowError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class WorkflowNotFoundError extends WorkflowError {
  constructor(workflowId: string) {
    super('WORKFLOW_NOT_FOUND', `Workflow not found: ${workflowId}`);
    this.name = 'WorkflowNotFoundError';
  }
}

export class WorkflowValidationError extends WorkflowError {
  constructor(message: string, public validationErrors: string[]) {
    super('WORKFLOW_VALIDATION_FAILED', message, { validationErrors });
    this.name = 'WorkflowValidationError';
  }
}
