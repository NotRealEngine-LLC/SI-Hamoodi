// HAMOODI SyntheTech Intelligence — Super Agent Engine
// Phase 06: Main orchestration service for autonomous task execution

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from '../supabase/client';
import { siIntelligenceService } from '../intelligence/service';
import { goalInterpreter } from './goal-interpreter';
import { taskPlanner } from './task-planner';
import { agentRegistry } from './agent-registry';
import { toolRegistry } from './tool-registry';
import {
  AgentRun,
  AgentTaskRecord,
  ExecutionPlan,
  AgentGoal,
  RunStatus,
  TaskStatus,
  AgentRole,
  ExecutionContext,
  RunBudget,
  ExecutionReport,
} from './types';

export class SISuperAgentEngine {
  private activeRuns: Map<string, AbortController> = new Map();

  /**
   * Create a new agent run from a user objective
   */
  async createRun(
    objective: string,
    context: {
      workspaceId: string;
      hubId?: string;
      projectId?: string;
      conversationId?: string;
      userId: string;
      executionMode?: 'interactive' | 'durable' | 'hybrid';
      modelPolicy?: string;
    }
  ): Promise<AgentRun> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const runId = uuidv4();
    const now = new Date().toISOString();

    // Create run record
    const { data: run, error } = await supabase
      .from('agent_runs')
      .insert({
        id: runId,
        workspace_id: context.workspaceId,
        hub_id: context.hubId || null,
        project_id: context.projectId || null,
        conversation_id: context.conversationId || null,
        initiated_by: context.userId,
        objective,
        status: 'draft',
        execution_mode: context.executionMode || 'interactive',
        model_policy: context.modelPolicy || 'balanced',
        budget: this.getDefaultBudget(),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create run: ${error.message}`);

    return run as AgentRun;
  }

  /**
   * Generate and validate an execution plan
   */
  async generatePlan(
    runId: string,
    userId: string
  ): Promise<ExecutionPlan> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    // Get run
    const { data: run, error: runError } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runError || !run) throw new Error('Run not found');

    // Update status to planning
    await supabase
      .from('agent_runs')
      .update({ status: 'planning', updated_at: new Date().toISOString() })
      .eq('id', runId);

    try {
      // Interpret goal
      const goal = await goalInterpreter.interpret(run.objective, {
        workspaceId: run.workspace_id,
        hubId: run.hub_id,
        projectId: run.project_id,
        userId,
      });

      // Generate plan
      const plan = await taskPlanner.plan(goal, {
        workspaceId: run.workspace_id,
        userId,
        availableTools: toolRegistry.list().map(t => t.id),
        modelPolicy: run.model_policy,
      });

      // Save plan
      await supabase
        .from('agent_runs')
        .update({
          plan,
          plan_version: 1,
          status: 'awaiting_plan_approval',
          updated_at: new Date().toISOString(),
        })
        .eq('id', runId);

      // Create task records
      for (const task of plan.tasks) {
        await supabase.from('agent_tasks').insert({
          run_id: runId,
          title: task.title,
          description: task.description,
          expected_output: task.expectedOutput,
          assigned_role: task.assignedRole,
          dependencies: task.dependencies,
          status: 'pending',
        });
      }

      // Record event
      await this.recordEvent(runId, null, 'plan.created', null, { plan });

      return plan;
    } catch (error) {
      // Update status to failed
      await supabase
        .from('agent_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', runId);

      throw error;
    }
  }

  /**
   * Approve a plan and start execution
   */
  async approvePlan(runId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    await supabase
      .from('agent_runs')
      .update({
        status: 'queued',
        plan_approved_at: new Date().toISOString(),
        plan_approved_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    await this.recordEvent(runId, null, 'plan.approved', null, { approvedBy: userId });
  }

  /**
   * Execute a run (foreground execution for interactive mode)
   */
  async executeRun(runId: string, userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const abortController = new AbortController();
    this.activeRuns.set(runId, abortController);

    try {
      // Update status to running
      await supabase
        .from('agent_runs')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', runId);

      await this.recordEvent(runId, null, 'run.started', null, {});

      // Get run and tasks
      const { data: run } = await supabase
        .from('agent_runs')
        .select('*')
        .eq('id', runId)
        .single();

      const { data: tasks } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true });

      if (!run || !tasks) throw new Error('Run or tasks not found');

      // Execute tasks in dependency order
      const executionContext: ExecutionContext = {
        runId,
        workspaceId: run.workspace_id,
        hubId: run.hub_id,
        projectId: run.project_id,
        conversationId: run.conversation_id,
        initiatedBy: userId,
        planVersion: run.plan_version,
        selectedModelPolicy: run.model_policy,
        allowedTools: toolRegistry.list().map(t => t.id),
        approvedCapabilities: [],
        executionMode: run.execution_mode,
        budget: run.budget,
        startedAt: run.started_at || new Date().toISOString(),
      };

      await this.executeTasks(tasks as AgentTaskRecord[], executionContext, abortController.signal);

      // Check if all tasks completed
      const { data: finalTasks } = await supabase
        .from('agent_tasks')
        .select('status')
        .eq('run_id', runId);

      const completedCount = finalTasks?.filter(t => t.status === 'completed').length || 0;
      const failedCount = finalTasks?.filter(t => t.status === 'failed').length || 0;
      const totalCount = finalTasks?.length || 0;

      let finalStatus: RunStatus = 'completed';
      if (failedCount > 0 && completedCount > 0) {
        finalStatus = 'partially_completed';
      } else if (failedCount === totalCount) {
        finalStatus = 'failed';
      }

      // Generate execution report
      const report = await this.generateExecutionReport(runId);

      // Update run status
      await supabase
        .from('agent_runs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          execution_report: report,
          updated_at: new Date().toISOString(),
        })
        .eq('id', runId);

      await this.recordEvent(runId, null, 'run.completed', null, { report });
    } catch (error) {
      // Update status to failed
      await supabase
        .from('agent_runs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', runId);

      await this.recordEvent(runId, null, 'run.failed', null, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    } finally {
      this.activeRuns.delete(runId);
    }
  }

  /**
   * Execute tasks in dependency order
   */
  private async executeTasks(
    tasks: AgentTaskRecord[],
    context: ExecutionContext,
    signal: AbortSignal
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const completedTasks = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Execute tasks in topological order
    while (completedTasks.size < tasks.length) {
      if (signal.aborted) {
        throw new Error('Execution cancelled');
      }

      // Find ready tasks (all dependencies completed)
      const readyTasks = tasks.filter(task => {
        if (completedTasks.has(task.id)) return false;
        if (task.status !== 'pending' && task.status !== 'ready') return false;
        return task.dependencies.every(dep => completedTasks.has(dep));
      });

      if (readyTasks.length === 0) {
        // No more tasks can be executed
        break;
      }

      // Execute ready tasks (sequentially for now, can be parallelized later)
      for (const task of readyTasks) {
        if (signal.aborted) break;

        await this.executeTask(task, context, signal);
        completedTasks.add(task.id);
      }
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(
    task: AgentTaskRecord,
    context: ExecutionContext,
    signal: AbortSignal
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    // Update task status to running
    await supabase
      .from('agent_tasks')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);

    await this.recordEvent(context.runId, task.id, 'task.started', task.assigned_role, {
      title: task.title,
    });

    try {
      // Get agent configuration
      const agent = agentRegistry.getByRole(task.assigned_role);
      if (!agent) {
        throw new Error(`No agent available for role: ${task.assigned_role}`);
      }

      // Build task prompt
      const prompt = this.buildTaskPrompt(task, context);

      // Execute with AI
      const response = await siIntelligenceService.generate(
        {
          workspaceId: context.workspaceId,
          hubId: context.hubId,
          projectId: context.projectId,
        },
        context.initiatedBy,
        prompt,
        'gpt-4o-mini', // Use appropriate model based on agent
        'technical',
        signal
      );

      // Update task with results
      await supabase
        .from('agent_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          model_id: response.modelId,
          model_calls: 1,
          tokens_used: response.tokenUsage?.totalTokens || 0,
          output: { content: response.content },
          verification_status: 'unverified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      // Update run metadata
      await supabase
        .from('agent_runs')
        .update({
          total_model_calls: context.budget.maxModelCalls, // Simplified
          total_tokens_used: context.budget.maxModelCalls * 1000, // Simplified
          updated_at: new Date().toISOString(),
        })
        .eq('id', context.runId);

      await this.recordEvent(context.runId, task.id, 'task.completed', task.assigned_role, {
        output: response.content,
      });
    } catch (error) {
      // Update task status to failed
      await supabase
        .from('agent_tasks')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      await this.recordEvent(context.runId, task.id, 'task.failed', task.assigned_role, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  private buildTaskPrompt(task: AgentTaskRecord, context: ExecutionContext): string {
    const agent = agentRegistry.getByRole(task.assigned_role);
    
    return `${agent?.systemInstructions || ''}

TASK:
Title: ${task.title}
Description: ${task.description || 'No description'}
Expected Output: ${task.expected_output || 'Not specified'}

WORKSPACE CONTEXT:
- Workspace ID: ${context.workspaceId}
${context.hubId ? `- Hub ID: ${context.hubId}` : ''}
${context.projectId ? `- Project ID: ${context.projectId}` : ''}

INSTRUCTIONS:
Complete this task according to the description and expected output.
Be thorough and actionable.
Provide clear, structured results.`;
  }

  /**
   * Cancel an active run
   */
  async cancelRun(runId: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const controller = this.activeRuns.get(runId);
    if (controller) {
      controller.abort();
      this.activeRuns.delete(runId);
    }

    await supabase
      .from('agent_runs')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', runId);

    await this.recordEvent(runId, null, 'run.cancelled', null, {});
  }

  /**
   * Generate an execution report
   */
  private async generateExecutionReport(runId: string): Promise<ExecutionReport> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase not configured');

    const { data: tasks } = await supabase
      .from('agent_tasks')
      .select('status')
      .eq('run_id', runId);

    const { data: run } = await supabase
      .from('agent_runs')
      .select('started_at, completed_at, total_model_calls, total_tool_calls, total_tokens_used')
      .eq('id', runId)
      .single();

    const completedCount = tasks?.filter(t => t.status === 'completed').length || 0;
    const failedCount = tasks?.filter(t => t.status === 'failed').length || 0;
    const skippedCount = tasks?.filter(t => t.status === 'skipped').length || 0;

    const totalDuration = run?.started_at && run?.completed_at
      ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
      : 0;

    return {
      summary: `Completed ${completedCount} tasks, ${failedCount} failed, ${skippedCount} skipped`,
      tasksCompleted: completedCount,
      tasksFailed: failedCount,
      tasksSkipped: skippedCount,
      totalDuration,
      modelCalls: run?.total_model_calls || 0,
      toolCalls: run?.total_tool_calls || 0,
      tokensUsed: run?.total_tokens_used || 0,
      warnings: [],
      limitations: [],
      recommendations: [],
    };
  }

  /**
   * Record an execution event
   */
  private async recordEvent(
    runId: string,
    taskId: string | null,
    eventType: string,
    agentRole: AgentRole | null,
    eventData: any
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('agent_execution_events').insert({
      run_id: runId,
      task_id: taskId,
      event_type: eventType,
      agent_role: agentRole,
      event_data: eventData,
    });
  }

  private getDefaultBudget(): RunBudget {
    return {
      maxTasks: 12,
      maxModelCalls: 20,
      maxToolCalls: 25,
      maxRetries: 2,
      maxConcurrentAgents: 2,
      maxRunDurationMs: 30 * 60 * 1000, // 30 minutes
      maxTaskDurationMs: 5 * 60 * 1000, // 5 minutes
    };
  }
}

export const superAgentEngine = new SISuperAgentEngine();
