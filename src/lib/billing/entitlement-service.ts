// HAMOODI SyntheTech Intelligence — Entitlement Service
// Phase 11: Feature Access Control & Quota Management

import { getSupabaseClient } from '../supabase/client';
import {
  Entitlement,
  EntitlementResolution,
  BillingSubscription,
  BillingPlan,
  WorkspaceQuota,
  BillingError,
  SubscriptionRequiredError,
  QuotaExceededError,
} from './types';

/**
 * Entitlement Service
 * Resolves feature access based on subscription status and quotas
 */
export class SIEntitlementService {
  /**
   * Resolve entitlements for a user/workspace
   */
  async resolveEntitlements(
    userId: string,
    workspaceId: string
  ): Promise<EntitlementResolution> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Get active subscription
    const subscription = await this.getActiveSubscription(userId, workspaceId);

    // Get plan details
    let plan: BillingPlan | null = null;
    if (subscription) {
      plan = await this.getPlan(subscription.plan_id);
    }

    // If no subscription, use free plan
    if (!plan) {
      plan = await this.getPlan('free');
    }

    if (!plan) {
      throw new BillingError('PLAN_NOT_FOUND', 'Default plan not found');
    }

    // Build entitlements from plan
    const entitlements = this.buildEntitlements(plan);

    // Get workspace quotas
    const quotas = await this.getWorkspaceQuotas(workspaceId);

    // Get credit balance if applicable
    let creditBalance: number | undefined;
    if (subscription) {
      const account = await this.getCreditAccount(userId, workspaceId);
      if (account) {
        creditBalance = account.available_balance;
      }
    }

    return {
      user_id: userId,
      workspace_id: workspaceId,
      plan_id: plan.plan_id,
      subscription_status: subscription?.status || 'none',
      entitlements,
      credit_balance: creditBalance,
      quotas,
    };
  }

  /**
   * Check if user has entitlement to a feature
   */
  async checkEntitlement(
    userId: string,
    workspaceId: string,
    feature: string
  ): Promise<{ allowed: boolean; limit?: number; current_usage?: number }> {
    const resolution = await this.resolveEntitlements(userId, workspaceId);

    const entitlement = resolution.entitlements.find(e => e.feature === feature);

    if (!entitlement) {
      return { allowed: false };
    }

    if (!entitlement.enabled) {
      return { allowed: false };
    }

    // Check quota if limit exists
    if (entitlement.limit !== undefined) {
      const quota = resolution.quotas.find(q => q.quota_type === feature);
      const currentUsage = quota?.current_usage || 0;

      if (currentUsage >= entitlement.limit) {
        return {
          allowed: false,
          limit: entitlement.limit,
          current_usage: currentUsage,
        };
      }

      return {
        allowed: true,
        limit: entitlement.limit,
        current_usage: currentUsage,
      };
    }

    return { allowed: true };
  }

  /**
   * Enforce entitlement (throws if not allowed)
   */
  async enforceEntitlement(
    userId: string,
    workspaceId: string,
    feature: string
  ): Promise<void> {
    const check = await this.checkEntitlement(userId, workspaceId, feature);

    if (!check.allowed) {
      if (check.limit !== undefined && check.current_usage !== undefined) {
        throw new QuotaExceededError(feature, check.limit, check.current_usage);
      }
      throw new SubscriptionRequiredError(feature);
    }
  }

  /**
   * Increment quota usage
   */
  async incrementQuotaUsage(
    workspaceId: string,
    quotaType: string,
    amount: number = 1
  ): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Get current quota
    const { data: quota, error } = await supabase
      .from('workspace_quotas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('quota_type', quotaType)
      .eq('status', 'active')
      .single();

    if (error || !quota) {
      // Quota not tracked, skip
      return;
    }

    // Update usage
    await supabase
      .from('workspace_quotas')
      .update({
        current_usage: quota.current_usage + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quota.id);
  }

  /**
   * Build entitlements from plan
   */
  private buildEntitlements(plan: BillingPlan): Entitlement[] {
    const entitlements: Entitlement[] = [];

    // Convert features to entitlements
    for (const [feature, enabled] of Object.entries(plan.features)) {
      entitlements.push({
        feature,
        enabled: enabled as boolean,
      });
    }

    // Convert usage limits to entitlements with limits
    for (const [feature, limit] of Object.entries(plan.usage_limits)) {
      entitlements.push({
        feature,
        enabled: true,
        limit: limit as number,
      });
    }

    // Convert workspace limits to entitlements with limits
    for (const [feature, limit] of Object.entries(plan.workspace_limits)) {
      entitlements.push({
        feature,
        enabled: true,
        limit: limit as number,
      });
    }

    return entitlements;
  }

  /**
   * Get active subscription for user/workspace
   */
  private async getActiveSubscription(
    userId: string,
    workspaceId: string
  ): Promise<BillingSubscription | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    // Try workspace subscription first
    const { data: workspaceSub } = await supabase
      .from('billing_subscriptions')
      .select('*, billing_customers!inner(*)')
      .eq('billing_customers.workspace_id', workspaceId)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (workspaceSub) {
      return workspaceSub as BillingSubscription;
    }

    // Fall back to personal subscription
    const { data: personalSub } = await supabase
      .from('billing_subscriptions')
      .select('*, billing_customers!inner(*)')
      .eq('billing_customers.user_id', userId)
      .eq('billing_customers.billing_owner_type', 'user')
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return personalSub as BillingSubscription | null;
  }

  /**
   * Get plan by ID
   */
  private async getPlan(planId: string): Promise<BillingPlan | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('plan_id', planId)
      .single();

    if (error || !data) return null;

    return data as BillingPlan;
  }

  /**
   * Get workspace quotas
   */
  private async getWorkspaceQuotas(workspaceId: string): Promise<WorkspaceQuota[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('workspace_quotas')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active');

    if (error || !data) return [];

    return data as WorkspaceQuota[];
  }

  /**
   * Get credit account
   */
  private async getCreditAccount(
    userId: string,
    workspaceId: string
  ): Promise<any | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    // Try workspace account first
    const { data: workspaceAccount } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('account_type', 'workspace')
      .single();

    if (workspaceAccount) {
      return workspaceAccount;
    }

    // Fall back to personal account
    const { data: personalAccount } = await supabase
      .from('credit_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('account_type', 'personal')
      .single();

    return personalAccount;
  }

  /**
   * Get all available plans
   */
  async getAvailablePlans(): Promise<BillingPlan[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('billing_plans')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) throw new BillingError('QUERY_FAILED', `Failed to get plans: ${error.message}`);

    return (data || []) as BillingPlan[];
  }
}

export const entitlementService = new SIEntitlementService();
