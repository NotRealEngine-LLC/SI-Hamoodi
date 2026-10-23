// HAMOODI SyntheTech Intelligence — Progress Calculator
// Phase 06: Deterministic progress reporting

import type { AgentTaskRecord, ExecutionPlan } from './types';

export interface ProgressMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  skippedTasks: number;
  pendingTasks: number;
  runningTasks: number;
  blockedTasks: number;
  progressPercentage: number;
  currentTask?: AgentTaskRecord;
  estimatedTimeRemaining?: string;
}

export class SIProgressCalculator {
  /**
   * Calculate progress metrics from tasks
   */
  calculate(tasks: AgentTaskRecord[], plan?: ExecutionPlan): ProgressMetrics {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const skippedTasks = tasks.filter(t => t.status === 'skipped').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'ready').length;
    const runningTasks = tasks.filter(t => t.status === 'running').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked' || t.status === 'awaiting_approval').length;

    // Calculate progress percentage based on completed tasks
    const progressPercentage = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;

    // Find current task (first running task)
    const currentTask = tasks.find(t => t.status === 'running');

    // Estimate time remaining (very rough estimate)
    const estimatedTimeRemaining = this.estimateTimeRemaining(tasks, plan);

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      skippedTasks,
      pendingTasks,
      runningTasks,
      blockedTasks,
      progressPercentage,
      currentTask,
      estimatedTimeRemaining,
    };
  }

  /**
   * Estimate time remaining based on task completion rate
   */
  private estimateTimeRemaining(tasks: AgentTaskRecord[], plan?: ExecutionPlan): string | undefined {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'ready' || t.status === 'running');

    if (completedTasks.length === 0 || pendingTasks.length === 0) {
      return undefined;
    }

    // Calculate average task duration
    const completedWithTime = completedTasks.filter(t => t.started_at && t.completed_at);
    if (completedWithTime.length === 0) {
      return 'In progress';
    }

    const totalDuration = completedWithTime.reduce((sum, task) => {
      const start = new Date(task.started_at!).getTime();
      const end = new Date(task.completed_at!).getTime();
      return sum + (end - start);
    }, 0);

    const avgDuration = totalDuration / completedWithTime.length;
    const estimatedRemaining = avgDuration * pendingTasks.length;

    // Format as human-readable time
    if (estimatedRemaining < 60000) {
      return '< 1 minute';
    } else if (estimatedRemaining < 3600000) {
      const minutes = Math.round(estimatedRemaining / 60000);
      return `~${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.round(estimatedRemaining / 3600000);
      return `~${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Get task status color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-emerald-400';
      case 'failed':
        return 'text-red-400';
      case 'running':
        return 'text-violet-400';
      case 'pending':
      case 'ready':
        return 'text-zinc-400';
      case 'blocked':
      case 'awaiting_approval':
        return 'text-amber-400';
      case 'skipped':
        return 'text-zinc-500';
      case 'cancelled':
        return 'text-zinc-500';
      default:
        return 'text-zinc-400';
    }
  }

  /**
   * Get task status background color
   */
  getStatusBgColor(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10';
      case 'failed':
        return 'bg-red-500/10';
      case 'running':
        return 'bg-violet-500/10';
      case 'pending':
      case 'ready':
        return 'bg-zinc-700/30';
      case 'blocked':
      case 'awaiting_approval':
        return 'bg-amber-500/10';
      case 'skipped':
        return 'bg-zinc-700/30';
      case 'cancelled':
        return 'bg-zinc-700/30';
      default:
        return 'bg-zinc-700/30';
    }
  }
}

export const progressCalculator = new SIProgressCalculator();
