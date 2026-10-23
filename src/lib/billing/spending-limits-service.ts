// HAMOODI SyntheTech Intelligence — Workspace Spending Limits Service
// Phase 11: Spending controls and alerts for workspaces

import { getSupabaseClient } from '../supabase/client';
import {
  BillingError,
  QuotaExceededError,
} from './types';

export interface SpendingLimit {
  id: string;
  workspace_id: string;
  quota_type: string;
  hard_limit: number;
  soft_limit?: number;
  current_usage: number;
  period_type: string;
  period_start: string;
  period_end?: string;
  status: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Workspace Spending Limits Service
 * Manages spending controls and alerts for workspaces
 */
export class SISpendingLimitsService {
  /**
   * Get spending limits for a workspace
   */
  async getLimits(workspaceId: string): Promise<SpendingLimit[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('workspace_quotas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (error) throw new BillingError('QUERY_FAILED', `Failed to get limits: ${error.message}`);

    return (data || []) as SpendingLimit[];
  }

  /**
   * Check if spending is allowed
   */
  async checkSpendingAllowed(
    workspaceId: string,
    limitType: string,
    amount: number
  ): Promise<{ allowed: boolean; remaining: number; limit: number; usage: number }> {
    const limits = await this.getLimits(workspaceId);
    const limit = limits.find(l => l.quota_type === limitType);

    if (!limit) {
      // No limit set, allow spending
      return { allowed: true, remaining: Infinity, limit: Infinity, usage: 0 };
    }

    const remaining = limit.hard_limit - limit.current_usage;
    const allowed = remaining >= amount;

    return {
      allowed,
      remaining,
      limit: limit.hard_limit,
      usage: limit.current_usage,
    };
  }

  /**
   * Enforce spending limit (throws if exceeded)
   */
  async enforceSpendingLimit(
    workspaceId: string,
    limitType: string,
    amount: number
  ): Promise<void> {
    const check = await this.checkSpendingAllowed(workspaceId, limitType, amount);

    if (!check.allowed) {
      throw new QuotaExceededError(limitType, check.limit, check.usage + amount);
    }
  }

  /**
   * Record spending against a limit
   */
  async recordSpending(
    workspaceId: string,
    limitType: string,
    amount: number
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Get current limit
    const { data: limit, error } = await supabase
      .from('workspace_quotas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('quota_type', limitType)
      .eq('status', 'active')
      .single();

    if (error || !limit) return; // No limit set

    // Update usage
    await supabase
      .from('workspace_quotas')
      .update({
        current_usage: limit.current_usage + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', limit.id);
  }

  /**
   * Get spending summary for workspace
   */
  async getSpendingSummary(workspaceId: string): Promise<{
    limits: SpendingLimit[];
    total_usage: number;
    total_budget: number;
  }> {
    const limits = await this.getLimits(workspaceId);

    let totalUsage = 0;
    let totalBudget = 0;

    for (const limit of limits) {
      totalUsage += limit.current_usage;
      totalBudget += limit.hard_limit;
    }

    return {
      limits,
      total_usage: totalUsage,
      total_budget: totalBudget,
    };
  }
}

export const spendingLimitsService = new SISpendingLimitsService();
