// HAMOODI SyntheTech Intelligence — Task Planner
// Phase 06: Generate executable task plans from goals

import { v4 as uuidv4 } from 'uuid';
import { siIntelligenceService } from '../intelligence/service';
import { AgentGoal, AgentTask, ExecutionPlan, AgentRole } from './types';

export class SITaskPlanner {
  /**
   * Generate an execution plan from a validated goal
   */
  async plan(
    goal: AgentGoal,
    context: {
      workspaceId: string;
      userId: string;
      availableTools: string[];
      modelPolicy: string;
    }
  ): Promise<ExecutionPlan> {
    const prompt = this.buildPlanningPrompt(goal, context);
    
    try {
      const response = await siIntelligenceService.generate(
        {
          workspaceId: context.workspaceId,
        },
        context.userId,
        prompt,
        'gpt-4o', // Use a capable model for planning
        'technical'
      );

      const tasks = this.parsePlanResponse(response.content);
      
      // Validate the plan
      this.validatePlan(tasks);
      
      // Calculate complexity metrics
      const parallelizableTasks = this.countParallelizableTasks(tasks);
      
      return {
        version: 1,
        tasks,
        estimatedComplexity: this.estimateComplexity(tasks),
        estimatedDuration: this.estimateDuration(tasks),
        totalTasks: tasks.length,
        parallelizableTasks,
      };
    } catch (error) {
      throw new Error(`Failed to generate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPlanningPrompt(goal: AgentGoal, context: any): string {
    return `You are a task planning specialist for HAMOODI SI Super Agent.

Generate an executable task plan for the following goal.

GOAL:
Objective: ${goal.objective}
Desired Outcome: ${goal.desiredOutcome}
Constraints: ${goal.constraints.join(', ')}
Acceptance Criteria: ${goal.acceptanceCriteria.join(', ')}
Required Capabilities: ${goal.requestedCapabilities.join(', ')}

AVAILABLE AGENT ROLES:
- planner: Goal analysis, task decomposition, strategy
- research: Analyze materials, organize evidence, summarize information
- analyst: Compare alternatives, structure findings, identify risks
- creator: Draft deliverables, create content, generate outputs
- reviewer: Evaluate outputs, check criteria, request revisions

AVAILABLE TOOLS:
${context.availableTools.join(', ')}

INSTRUCTIONS:
1. Break down the goal into concrete, executable tasks
2. Each task should be atomic and verifiable
3. Define clear dependencies between tasks
4. Assign appropriate agent roles
5. Specify expected outputs for each task
6. Include verification criteria
7. Assess risk level for each task
8. Ensure all acceptance criteria are covered

Respond with a JSON array of tasks in this exact format:
[
  {
    "id": "task_1",
    "title": "Clear task title",
    "description": "Detailed description of what to do",
    "expectedOutput": "What this task should produce",
    "dependencies": [],
    "assignedRole": "planner|research|analyst|creator|reviewer",
    "requiredCapabilities": ["capability1", "capability2"],
    "riskLevel": "low|medium|high",
    "verificationCriteria": ["How to verify this task is complete"]
  }
]

Guidelines:
- Maximum 12 tasks
- Maximum dependency depth of 6
- Tasks without dependencies can run in parallel
- Each task should be completable in a single agent execution
- Include at least one reviewer task for quality assurance
- Be realistic about what can be accomplished`;
  }

  private parsePlanResponse(response: string): AgentTask[] {
    try {
      // Try to extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.map((task: any, index: number) => this.normalizeTask(task, index));
    } catch (error) {
      throw new Error(`Failed to parse plan response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private normalizeTask(task: any, index: number): AgentTask {
    return {
      id: task.id || `task_${index + 1}`,
      title: task.title || `Task ${index + 1}`,
      description: task.description || '',
      expectedOutput: task.expectedOutput || '',
      dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
      assignedRole: this.validateRole(task.assignedRole),
      requiredCapabilities: Array.isArray(task.requiredCapabilities) ? task.requiredCapabilities : [],
      riskLevel: this.validateRiskLevel(task.riskLevel),
      verificationCriteria: Array.isArray(task.verificationCriteria) ? task.verificationCriteria : [],
      status: 'pending',
    };
  }

  private validateRole(role: any): AgentRole {
    const validRoles: AgentRole[] = ['planner', 'research', 'analyst', 'creator', 'reviewer', 'coordinator'];
    if (validRoles.includes(role)) {
      return role;
    }
    return 'creator'; // Default to creator if invalid
  }

  private validateRiskLevel(level: any): 'low' | 'medium' | 'high' {
    if (level === 'low' || level === 'medium' || level === 'high') {
      return level;
    }
    return 'medium';
  }

  private validatePlan(tasks: AgentTask[]): void {
    if (tasks.length === 0) {
      throw new Error('Plan must have at least one task');
    }

    if (tasks.length > 12) {
      throw new Error('Plan cannot have more than 12 tasks');
    }

    // Check for duplicate IDs
    const ids = tasks.map(t => t.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      throw new Error('Plan contains duplicate task IDs');
    }

    // Check for valid dependencies
    const taskIds = new Set(ids);
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          throw new Error(`Task ${task.id} depends on non-existent task ${depId}`);
        }
      }
    }

    // Check for dependency cycles
    if (this.hasCycle(tasks)) {
      throw new Error('Plan contains dependency cycles');
    }

    // Check maximum dependency depth
    const maxDepth = this.calculateMaxDepth(tasks);
    if (maxDepth > 6) {
      throw new Error(`Plan dependency depth (${maxDepth}) exceeds maximum of 6`);
    }
  }

  private hasCycle(tasks: AgentTask[]): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycleUtil = (taskId: string): boolean => {
      if (recStack.has(taskId)) {
        return true;
      }
      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recStack.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task) {
        for (const depId of task.dependencies) {
          if (hasCycleUtil(depId)) {
            return true;
          }
        }
      }

      recStack.delete(taskId);
      return false;
    };

    for (const task of tasks) {
      if (hasCycleUtil(task.id)) {
        return true;
      }
    }

    return false;
  }

  private calculateMaxDepth(tasks: AgentTask[]): number {
    const depthCache = new Map<string, number>();

    const getDepth = (taskId: string): number => {
      if (depthCache.has(taskId)) {
        return depthCache.get(taskId)!;
      }

      const task = tasks.find(t => t.id === taskId);
      if (!task || task.dependencies.length === 0) {
        depthCache.set(taskId, 0);
        return 0;
      }

      let maxDepDepth = 0;
      for (const depId of task.dependencies) {
        maxDepDepth = Math.max(maxDepDepth, getDepth(depId));
      }

      const depth = maxDepDepth + 1;
      depthCache.set(taskId, depth);
      return depth;
    };

    let maxDepth = 0;
    for (const task of tasks) {
      maxDepth = Math.max(maxDepth, getDepth(task.id));
    }

    return maxDepth;
  }

  private countParallelizableTasks(tasks: AgentTask[]): number {
    return tasks.filter(t => t.dependencies.length === 0).length;
  }

  private estimateComplexity(tasks: AgentTask[]): 'low' | 'medium' | 'high' {
    if (tasks.length <= 3) return 'low';
    if (tasks.length <= 7) return 'medium';
    return 'high';
  }

  private estimateDuration(tasks: AgentTask[]): string {
    const taskCount = tasks.length;
    if (taskCount <= 3) return '5-10 minutes';
    if (taskCount <= 7) return '10-20 minutes';
    return '20-40 minutes';
  }
}

export const taskPlanner = new SITaskPlanner();
