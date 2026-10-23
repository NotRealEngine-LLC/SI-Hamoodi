// HAMOODI SyntheTech Intelligence — Super Agent Types
// Phase 06: Autonomous Planning & Multi-Agent Orchestration

export type RunStatus = 
  | 'draft'
  | 'planning'
  | 'awaiting_plan_approval'
  | 'queued'
  | 'running'
  | 'paused'
  | 'awaiting_approval'
  | 'awaiting_client'
  | 'cancelling'
  | 'cancelled'
  | 'completed'
  | 'partially_completed'
  | 'failed';

export type TaskStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'awaiting_approval'
  | 'blocked'
  | 'retrying'
  | 'completed'
  | 'skipped'
  | 'cancelled'
  | 'failed';

export type AgentRole = 'planner' | 'research' | 'analyst' | 'creator' | 'reviewer' | 'coordinator';

export type ExecutionMode = 'interactive' | 'durable' | 'hybrid';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type VerificationStatus = 'verified' | 'reviewed' | 'unverified' | 'failed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

// ============================================================
// GOAL & PLANNING TYPES
// ============================================================

export interface AgentGoal {
  objective: string;
  desiredOutcome: string;
  constraints: string[];
  acceptanceCriteria: string[];
  requestedCapabilities: string[];
  missingInformation: string[];
  riskLevel: RiskLevel;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  expectedOutput: string;
  dependencies: string[];
  assignedRole: AgentRole;
  requiredCapabilities: string[];
  riskLevel: RiskLevel;
  verificationCriteria: string[];
  status: TaskStatus;
}

export interface ExecutionPlan {
  version: number;
  tasks: AgentTask[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  estimatedDuration: string;
  totalTasks: number;
  parallelizableTasks: number;
}

// ============================================================
// RUN TYPES
// ============================================================

export interface AgentRun {
  id: string;
  workspace_id: string;
  hub_id?: string;
  project_id?: string;
  conversation_id?: string;
  initiated_by: string;
  
  // Goal & Plan
  objective: string;
  plan: ExecutionPlan | null;
  plan_version: number;
  plan_approved_at?: string;
  plan_approved_by?: string;
  
  // Execution State
  status: RunStatus;
  
  // Configuration
  execution_mode: ExecutionMode;
  model_policy: string;
  budget: RunBudget;
  
  // Execution Metadata
  started_at?: string;
  completed_at?: string;
  total_model_calls: number;
  total_tool_calls: number;
  total_tokens_used: number;
  
  // Results
  final_result?: any;
  execution_report?: ExecutionReport;
  error_message?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface RunBudget {
  maxTasks: number;
  maxModelCalls: number;
  maxToolCalls: number;
  maxRetries: number;
  maxConcurrentAgents: number;
  maxRunDurationMs: number;
  maxTaskDurationMs: number;
  estimatedTokenBudget?: number;
}

export interface ExecutionReport {
  summary: string;
  tasksCompleted: number;
  tasksFailed: number;
  tasksSkipped: number;
  totalDuration: number;
  modelCalls: number;
  toolCalls: number;
  tokensUsed: number;
  warnings: string[];
  limitations: string[];
  recommendations: string[];
}

// ============================================================
// TASK TYPES
// ============================================================

export interface AgentTaskRecord {
  id: string;
  run_id: string;
  
  // Task Definition
  title: string;
  description?: string;
  expected_output?: string;
  assigned_role: AgentRole;
  
  // Dependencies
  dependencies: string[];
  
  // Execution State
  status: TaskStatus;
  
  // Execution Metadata
  started_at?: string;
  completed_at?: string;
  model_id?: string;
  model_calls: number;
  tool_calls: number;
  tokens_used: number;
  retry_count: number;
  
  // Results
  output?: any;
  verification_status?: VerificationStatus;
  error_message?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ============================================================
// CHECKPOINT TYPES
// ============================================================

export interface AgentCheckpoint {
  id: string;
  run_id: string;
  checkpoint_version: number;
  graph_state: any;
  completed_tasks: string[];
  pending_tasks: string[];
  task_outputs: Record<string, any>;
  outstanding_approvals: string[];
  created_at: string;
}

// ============================================================
// APPROVAL TYPES
// ============================================================

export interface AgentApproval {
  id: string;
  run_id: string;
  task_id?: string;
  
  // Approval Request
  requested_by_agent: string;
  requested_action: string;
  arguments_hash: string;
  display_arguments: any;
  risk_level: RiskLevel;
  
  // Approval State
  status: ApprovalStatus;
  decided_by?: string;
  decided_at?: string;
  decision_reason?: string;
  
  // Expiration
  expires_at: string;
  
  // Timestamps
  created_at: string;
}

// ============================================================
// TOOL EXECUTION TYPES
// ============================================================

export interface AgentToolExecution {
  id: string;
  run_id: string;
  task_id?: string;
  
  // Tool Execution
  tool_id: string;
  input: any;
  output?: any;
  
  // Execution Metadata
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  execution_time_ms?: number;
  error_message?: string;
  
  // Idempotency
  idempotency_key: string;
  
  // Timestamps
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// ============================================================
// EVENT TYPES
// ============================================================

export type AgentEventType =
  | 'run.started'
  | 'run.paused'
  | 'run.resumed'
  | 'run.cancelled'
  | 'run.completed'
  | 'run.failed'
  | 'plan.created'
  | 'plan.approved'
  | 'plan.rejected'
  | 'task.assigned'
  | 'task.started'
  | 'task.progress'
  | 'task.completed'
  | 'task.failed'
  | 'task.skipped'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'tool.executing'
  | 'tool.completed'
  | 'tool.failed'
  | 'checkpoint.saved'
  | 'budget.exceeded';

export interface AgentExecutionEvent {
  id: string;
  run_id: string;
  task_id?: string;
  event_type: AgentEventType;
  agent_role?: AgentRole;
  event_data: any;
  created_at: string;
}

// ============================================================
// AGENT REGISTRY TYPES
// ============================================================

export interface AgentConfiguration {
  id: string;
  name: string;
  description: string;
  specialization: AgentRole;
  systemInstructions: string;
  allowedCapabilities: string[];
  allowedTools: string[];
  preferredModelPolicy: string;
  maxIterations: number;
  maxExecutionTimeMs: number;
  riskProfile: RiskLevel;
  enabled: boolean;
}

// ============================================================
// TOOL REGISTRY TYPES
// ============================================================

export interface AgentTool {
  id: string;
  description: string;
  riskLevel: 'read' | 'write' | 'sensitive';
  inputSchema: any;
  outputSchema: any;
  execute: (input: any, context: ToolExecutionContext) => Promise<any>;
}

export interface ToolExecutionContext {
  runId: string;
  taskId: string;
  workspaceId: string;
  userId: string;
  hubId?: string;
  projectId?: string;
}

// ============================================================
// CONTEXT TYPES
// ============================================================

export interface ExecutionContext {
  runId: string;
  workspaceId: string;
  hubId?: string;
  projectId?: string;
  conversationId?: string;
  initiatedBy: string;
  planVersion: number;
  selectedModelPolicy: string;
  allowedTools: string[];
  approvedCapabilities: string[];
  executionMode: ExecutionMode;
  budget: RunBudget;
  startedAt: string;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class SuperAgentError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
    public context?: any
  ) {
    super(message);
    this.name = 'SuperAgentError';
  }
}

export class PlanValidationError extends SuperAgentError {
  constructor(message: string, public validationErrors: string[]) {
    super('PLAN_VALIDATION_FAILED', message, false, { validationErrors });
    this.name = 'PlanValidationError';
  }
}

export class BudgetExceededError extends SuperAgentError {
  constructor(message: string) {
    super('BUDGET_EXCEEDED', message, false);
    this.name = 'BudgetExceededError';
  }
}

export class ApprovalRequiredError extends SuperAgentError {
  constructor(public approvalId: string, message: string) {
    super('APPROVAL_REQUIRED', message, false, { approvalId });
    this.name = 'ApprovalRequiredError';
  }
}

export class TaskDependencyError extends SuperAgentError {
  constructor(message: string, public taskId: string, public dependencyIds: string[]) {
    super('TASK_DEPENDENCY_FAILED', message, false, { taskId, dependencyIds });
    this.name = 'TaskDependencyError';
  }
}
