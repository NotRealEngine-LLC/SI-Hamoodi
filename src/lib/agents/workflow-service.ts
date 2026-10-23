// HAMOODI SyntheTech Intelligence — Workflow Service
// Phase 10: Workflow Management & Execution

import { getSupabaseClient } from '../supabase/client';
import {
  WorkflowDefinition,
  WorkflowVersion,
  WorkflowRun,
  WorkflowTrigger,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  CreateTriggerInput,
  WorkflowError,
  WorkflowNotFoundError,
  WorkflowValidationError,
} from './types';

export class WorkflowService {
  /**
   * Create a new workflow
   */
  async createWorkflow(userId: string, input: CreateWorkflowInput): Promise<WorkflowDefinition> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    // Validate input
    this.validateWorkflowInput(input);

    const { data, error } = await supabase
      .from('workflow_definitions')
      .insert({
        workspace_id: input.workspace_id,
        owner_id: userId,
        name: input.name,
        description: input.description || null,
        nodes: input.nodes || [],
        edges: input.edges || [],
        status: 'draft',
        current_version: 1,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw new WorkflowError('CREATE_FAILED', `Failed to create workflow: ${error.message}`);

    const workflow = data as WorkflowDefinition;

    // Create initial version
    await this.createVersion(userId, workflow.id, 1, workflow, 'Initial version');

    return workflow;
  }

  /**
   * Get a workflow by ID
   */
  async getWorkflow(userId: string, workflowId: string): Promise<WorkflowDefinition | null> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new WorkflowError('GET_FAILED', `Failed to get workflow: ${error.message}`);
    }

    return data as WorkflowDefinition;
  }

  /**
   * List workflows with filters
   */
  async listWorkflows(
    userId: string,
    filters?: {
      workspace_id?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<WorkflowDefinition[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('workflow_definitions')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters?.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, error } = await query;

    if (error) throw new WorkflowError('LIST_FAILED', `Failed to list workflows: ${error.message}`);

    return (data || []) as WorkflowDefinition[];
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(
    userId: string,
    workflowId: string,
    updates: UpdateWorkflowInput
  ): Promise<WorkflowDefinition> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const current = await this.getWorkflow(userId, workflowId);
    if (!current) throw new WorkflowNotFoundError(workflowId);

    const newVersion = current.current_version + 1;

    // Update workflow
    const { data, error } = await supabase
      .from('workflow_definitions')
      .update({
        name: updates.name,
        description: updates.description,
        nodes: updates.nodes,
        edges: updates.edges,
        status: updates.status,
        current_version: newVersion,
        metadata: updates.metadata,
        updated_at: new Date().toISOString(),
        archived_at: updates.status === 'archived' ? new Date().toISOString() : null,
      })
      .eq('id', workflowId)
      .select()
      .single();

    if (error) throw new WorkflowError('UPDATE_FAILED', `Failed to update workflow: ${error.message}`);

    const workflow = data as WorkflowDefinition;

    // Create new version
    await this.createVersion(userId, workflowId, newVersion, workflow, updates.change_summary);

    return workflow;
  }

  /**
   * Delete a workflow (soft delete via archive)
   */
  async deleteWorkflow(userId: string, workflowId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { error } = await supabase
      .from('workflow_definitions')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', workflowId);

    if (error) throw new WorkflowError('DELETE_FAILED', `Failed to delete workflow: ${error.message}`);
  }

  /**
   * Get workflow versions
   */
  async getVersions(workflowId: string): Promise<WorkflowVersion[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_versions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('version_number', { ascending: false });

    if (error) throw new WorkflowError('VERSIONS_FAILED', `Failed to get versions: ${error.message}`);

    return (data || []) as WorkflowVersion[];
  }

  /**
   * Restore a workflow to a previous version
   */
  async restoreVersion(userId: string, workflowId: string, versionNumber: number): Promise<WorkflowDefinition> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data: version, error: versionError } = await supabase
      .from('workflow_versions')
      .select('*')
      .eq('workflow_id', workflowId)
      .eq('version_number', versionNumber)
      .single();

    if (versionError || !version) {
      throw new WorkflowError('VERSION_NOT_FOUND', `Version ${versionNumber} not found`);
    }

    const v = version as WorkflowVersion;

    return this.updateWorkflow(userId, workflowId, {
      nodes: v.nodes,
      edges: v.edges,
      change_summary: `Restored from version ${versionNumber}`,
    });
  }

  /**
   * Create a trigger for a workflow
   */
  async createTrigger(userId: string, input: CreateTriggerInput): Promise<WorkflowTrigger> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_triggers')
      .insert({
        workflow_id: input.workflow_id,
        trigger_type: input.trigger_type,
        configuration: input.configuration || {},
        enabled: input.enabled ?? true,
        webhook_secret: input.webhook_secret,
        schedule_timezone: input.schedule_timezone,
        schedule_expression: input.schedule_expression,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw new WorkflowError('TRIGGER_CREATE_FAILED', `Failed to create trigger: ${error.message}`);

    return data as WorkflowTrigger;
  }

  /**
   * Get triggers for a workflow
   */
  async getTriggers(workflowId: string): Promise<WorkflowTrigger[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_triggers')
      .select('*')
      .eq('workflow_id', workflowId);

    if (error) throw new WorkflowError('TRIGGERS_FAILED', `Failed to get triggers: ${error.message}`);

    return (data || []) as WorkflowTrigger[];
  }

  /**
   * Update a trigger
   */
  async updateTrigger(triggerId: string, updates: Partial<WorkflowTrigger>): Promise<WorkflowTrigger> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_triggers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', triggerId)
      .select()
      .single();

    if (error) throw new WorkflowError('TRIGGER_UPDATE_FAILED', `Failed to update trigger: ${error.message}`);

    return data as WorkflowTrigger;
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(triggerId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { error } = await supabase
      .from('workflow_triggers')
      .delete()
      .eq('id', triggerId);

    if (error) throw new WorkflowError('TRIGGER_DELETE_FAILED', `Failed to delete trigger: ${error.message}`);
  }

  /**
   * Create a workflow run
   */
  async createRun(
    userId: string,
    workflowId: string,
    triggerType: 'manual' | 'scheduled' | 'webhook' | 'event',
    triggerData?: Record<string, any>
  ): Promise<WorkflowRun> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const workflow = await this.getWorkflow(userId, workflowId);
    if (!workflow) throw new WorkflowNotFoundError(workflowId);

    const { data, error } = await supabase
      .from('workflow_runs')
      .insert({
        workflow_id: workflowId,
        workspace_id: workflow.workspace_id,
        workflow_version: workflow.current_version,
        trigger_type: triggerType,
        trigger_data: triggerData || {},
        status: 'queued',
        initiated_by: userId,
        node_results: {},
        metadata: {},
      })
      .select()
      .single();

    if (error) throw new WorkflowError('RUN_CREATE_FAILED', `Failed to create run: ${error.message}`);

    return data as WorkflowRun;
  }

  /**
   * Get workflow runs
   */
  async getRuns(
    userId: string,
    workflowId: string,
    limit: number = 50
  ): Promise<WorkflowRun[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new WorkflowError('RUNS_FAILED', `Failed to get runs: ${error.message}`);

    return (data || []) as WorkflowRun[];
  }

  /**
   * Update a workflow run
   */
  async updateRun(runId: string, updates: Partial<WorkflowRun>): Promise<WorkflowRun> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new WorkflowError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_runs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .select()
      .single();

    if (error) throw new WorkflowError('RUN_UPDATE_FAILED', `Failed to update run: ${error.message}`);

    return data as WorkflowRun;
  }

  /**
   * Validate workflow graph
   */
  validateWorkflow(workflow: WorkflowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for at least one trigger node
    const triggerNodes = workflow.nodes.filter(n => n.type === 'trigger');
    if (triggerNodes.length === 0) {
      errors.push('Workflow must have at least one trigger node');
    }

    // Check for cycles (simple DFS-based detection)
    if (this.hasCycle(workflow.nodes, workflow.edges)) {
      errors.push('Workflow contains cycles, which are not allowed');
    }

    // Check for unreachable nodes
    const reachableNodes = this.getReachableNodes(workflow.nodes, workflow.edges);
    const unreachableNodes = workflow.nodes.filter(n => !reachableNodes.has(n.id));
    if (unreachableNodes.length > 0) {
      errors.push(`Workflow has ${unreachableNodes.length} unreachable node(s)`);
    }

    // Validate node configurations
    for (const node of workflow.nodes) {
      if (!node.config) {
        errors.push(`Node ${node.id} is missing configuration`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if workflow graph has cycles
   */
  private hasCycle(nodes: any[], edges: any[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleUtil = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycleUtil(edge.target)) return true;
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (hasCycleUtil(node.id)) return true;
    }

    return false;
  }

  /**
   * Get reachable nodes from trigger nodes
   */
  private getReachableNodes(nodes: any[], edges: any[]): Set<string> {
    const reachable = new Set<string>();
    const triggerNodes = nodes.filter(n => n.type === 'trigger');

    const traverse = (nodeId: string) => {
      if (reachable.has(nodeId)) return;
      reachable.add(nodeId);

      const outgoingEdges = edges.filter(e => e.source === nodeId);
      for (const edge of outgoingEdges) {
        traverse(edge.target);
      }
    };

    for (const trigger of triggerNodes) {
      traverse(trigger.id);
    }

    return reachable;
  }

  /**
   * Create a version snapshot
   */
  private async createVersion(
    userId: string,
    workflowId: string,
    versionNumber: number,
    workflow: WorkflowDefinition,
    changeSummary?: string
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('workflow_versions').insert({
      workflow_id: workflowId,
      version_number: versionNumber,
      nodes: workflow.nodes,
      edges: workflow.edges,
      change_summary: changeSummary,
      created_by: userId,
    });
  }

  /**
   * Validate workflow input
   */
  private validateWorkflowInput(input: CreateWorkflowInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new WorkflowError('INVALID_NAME', 'Workflow name is required');
    }

    if (input.name.length > 200) {
      throw new WorkflowError('NAME_TOO_LONG', 'Workflow name must be 200 characters or less');
    }
  }
}

export const workflowService = new WorkflowService();
