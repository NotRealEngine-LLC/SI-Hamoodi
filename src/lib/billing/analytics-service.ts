// HAMOODI SyntheTech Intelligence — Analytics Service
// Phase 11: Product Analytics with PostHog Integration

import { getSupabaseClient } from '../supabase/client';
import {
  AnalyticsEvent,
  CreateAnalyticsEventInput,
  BillingError,
} from './types';

// PostHog configuration (would be loaded from environment)
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || '';
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

// PostHog client (lazy initialization)
let posthogClient: any = null;

/**
 * Initialize PostHog client
 */
async function getPostHogClient() {
  if (!POSTHOG_API_KEY) {
    console.warn('PostHog API key not configured');
    return null;
  }

  if (posthogClient) {
    return posthogClient;
  }

  try {
    // Dynamic import to avoid bundling if not configured
    const posthog = await import('posthog-js');
    posthog.default.init(POSTHOG_API_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'localStorage',
      capture_pageview: false, // We'll handle this manually
      disable_session_recording: true, // Privacy-first
    });
    posthogClient = posthog.default;
    return posthogClient;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    return null;
  }
}

/**
 * Analytics Service
 * Handles event tracking with PostHog and database persistence
 */
export class SIAnalyticsService {
  /**
   * Track an analytics event
   */
  async trackEvent(input: CreateAnalyticsEventInput): Promise<AnalyticsEvent> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    // Create event record
    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: input.event_name,
        event_version: input.event_version || 1,
        user_id: input.user_id || null,
        workspace_id: input.workspace_id || null,
        session_id: input.session_id || null,
        entity_type: input.entity_type || null,
        entity_id: input.entity_id || null,
        properties: input.properties || {},
        environment: input.environment || 'production',
        source: input.source || 'client',
      })
      .select()
      .single();

    if (error) throw new BillingError('TRACK_FAILED', `Failed to track event: ${error.message}`);

    const event = data as AnalyticsEvent;

    // Send to PostHog (non-blocking)
    this.sendToPostHog(event).catch(err => {
      console.error('Failed to send to PostHog:', err);
    });

    return event;
  }

  /**
   * Send event to PostHog
   */
  private async sendToPostHog(event: AnalyticsEvent): Promise<void> {
    const posthog = await getPostHogClient();
    if (!posthog) return;

    try {
      posthog.capture(event.event_name, {
        distinct_id: event.user_id || 'anonymous',
        properties: {
          ...event.properties,
          workspace_id: event.workspace_id,
          entity_type: event.entity_type,
          entity_id: event.entity_id,
          environment: event.environment,
          source: event.source,
        },
        timestamp: new Date(event.created_at),
      });
    } catch (error) {
      console.error('PostHog capture failed:', error);
    }
  }

  /**
   * Identify user in PostHog
   */
  async identifyUser(userId: string, properties?: Record<string, any>): Promise<void> {
    const posthog = await getPostHogClient();
    if (!posthog) return;

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('PostHog identify failed:', error);
    }
  }

  /**
   * Reset PostHog identity (on logout)
   */
  async resetIdentity(): Promise<void> {
    const posthog = await getPostHogClient();
    if (!posthog) return;

    try {
      posthog.reset();
    } catch (error) {
      console.error('PostHog reset failed:', error);
    }
  }

  /**
   * Track authentication event
   */
  async trackAuth(userId: string, method: string): Promise<void> {
    await this.trackEvent({
      event_name: 'auth_completed',
      user_id: userId,
      properties: { method },
      source: 'server',
    });
  }

  /**
   * Track workspace creation
   */
  async trackWorkspaceCreated(userId: string, workspaceId: string, type: string): Promise<void> {
    await this.trackEvent({
      event_name: 'workspace_created',
      user_id: userId,
      workspace_id: workspaceId,
      entity_type: 'workspace',
      entity_id: workspaceId,
      properties: { type },
      source: 'server',
    });
  }

  /**
   * Track AI generation
   */
  async trackAIGeneration(
    userId: string,
    workspaceId: string,
    modelId: string,
    durationMs: number,
    success: boolean,
    tokenUsage?: { prompt: number; completion: number; total: number }
  ): Promise<void> {
    await this.trackEvent({
      event_name: 'ai_generation_completed',
      user_id: userId,
      workspace_id: workspaceId,
      properties: {
        model_id: modelId,
        duration_ms: durationMs,
        success,
        prompt_tokens: tokenUsage?.prompt,
        completion_tokens: tokenUsage?.completion,
        total_tokens: tokenUsage?.total,
      },
      source: 'server',
    });
  }

  /**
   * Track agent run
   */
  async trackAgentRun(
    userId: string,
    workspaceId: string,
    agentId: string,
    status: string,
    taskCount: number,
    durationMs: number
  ): Promise<void> {
    await this.trackEvent({
      event_name: 'agent_run_completed',
      user_id: userId,
      workspace_id: workspaceId,
      entity_type: 'agent',
      entity_id: agentId,
      properties: {
        status,
        task_count: taskCount,
        duration_ms: durationMs,
      },
      source: 'server',
    });
  }

  /**
   * Track workflow execution
   */
  async trackWorkflowRun(
    userId: string,
    workspaceId: string,
    workflowId: string,
    status: string,
    nodeCount: number,
    durationMs: number
  ): Promise<void> {
    await this.trackEvent({
      event_name: 'workflow_completed',
      user_id: userId,
      workspace_id: workspaceId,
      entity_type: 'workflow',
      entity_id: workflowId,
      properties: {
        status,
        node_count: nodeCount,
        duration_ms: durationMs,
      },
      source: 'server',
    });
  }

  /**
   * Track subscription event
   */
  async trackSubscription(
    userId: string,
    workspaceId: string,
    eventType: 'created' | 'updated' | 'cancelled',
    planId: string,
    status: string
  ): Promise<void> {
    await this.trackEvent({
      event_name: `subscription_${eventType}`,
      user_id: userId,
      workspace_id: workspaceId,
      properties: {
        plan_id: planId,
        status,
      },
      source: 'server',
    });
  }

  /**
   * Get analytics events with filters
   */
  async getEvents(
    filters?: {
      user_id?: string;
      workspace_id?: string;
      event_name?: string;
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ): Promise<AnalyticsEvent[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.user_id) query = query.eq('user_id', filters.user_id);
    if (filters?.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
    if (filters?.event_name) query = query.eq('event_name', filters.event_name);
    if (filters?.start_date) query = query.gte('created_at', filters.start_date);
    if (filters?.end_date) query = query.lte('created_at', filters.end_date);
    if (filters?.limit) query = query.limit(filters.limit);

    const { data, error } = await query;

    if (error) throw new BillingError('QUERY_FAILED', `Failed to get events: ${error.message}`);

    return (data || []) as AnalyticsEvent[];
  }

  /**
   * Get event counts by name
   */
  async getEventCounts(
    workspaceId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, number>> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new BillingError('NO_SUPABASE', 'Supabase not configured');

    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_name')
      .eq('workspace_id', workspaceId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw new BillingError('QUERY_FAILED', `Failed to get event counts: ${error.message}`);

    const counts: Record<string, number> = {};
    (data || []).forEach((event: any) => {
      counts[event.event_name] = (counts[event.event_name] || 0) + 1;
    });

    return counts;
  }
}

export const analyticsService = new SIAnalyticsService();
