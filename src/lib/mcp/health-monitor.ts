// HAMOODI SyntheTech Intelligence — Connection Health Monitor
// Phase 08: Monitor and track MCP connection health

import { getSupabaseClient } from '../supabase/client';
import { mcpClientManager } from './client-manager';
import type { IntegrationConnection, ConnectionStatus } from './types';

export type HealthStatus = 'healthy' | 'degraded' | 'unauthorized' | 'unavailable' | 'disabled' | 'unknown';

export interface HealthCheck {
  connectionId: string;
  status: HealthStatus;
  latencyMs?: number;
  lastChecked: string;
  error?: string;
  toolsAvailable: number;
  resourcesAvailable: number;
  promptsAvailable: number;
}

export class SIConnectionHealthMonitor {
  private healthCache: Map<string, HealthCheck> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Perform health check on a connection
   */
  async checkHealth(connectionId: string): Promise<HealthCheck> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return this.createHealthCheck(connectionId, 'unknown', 'Supabase not configured');
    }

    const startTime = Date.now();

    try {
      // Get connection details
      const { data: connection, error } = await supabase
        .from('integration_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error || !connection) {
        return this.createHealthCheck(connectionId, 'unavailable', 'Connection not found');
      }

      // Check if connection is disabled
      if (connection.status === 'disabled') {
        return this.createHealthCheck(connectionId, 'disabled');
      }

      // Check if connected
      if (!mcpClientManager.isConnected(connectionId)) {
        return this.createHealthCheck(connectionId, 'unavailable', 'Not connected');
      }

      // Try to discover tools to verify connection is working
      const tools = await mcpClientManager.discoverTools(connectionId);
      const resources = await mcpClientManager.discoverResources(connectionId);
      const prompts = await mcpClientManager.discoverPrompts(connectionId);

      const latencyMs = Date.now() - startTime;

      // Determine health status
      let status: HealthStatus = 'healthy';
      let errorMessage: string | undefined;

      if (tools.length === 0 && resources.length === 0 && prompts.length === 0) {
        status = 'degraded';
        errorMessage = 'No capabilities discovered';
      }

      const healthCheck: HealthCheck = {
        connectionId,
        status,
        latencyMs,
        lastChecked: new Date().toISOString(),
        error: errorMessage,
        toolsAvailable: tools.length,
        resourcesAvailable: resources.length,
        promptsAvailable: prompts.length,
      };

      // Cache the result
      this.healthCache.set(connectionId, healthCheck);

      // Update database
      await supabase
        .from('integration_connections')
        .update({
          last_health_check: healthCheck.lastChecked,
          last_success_at: status === 'healthy' ? healthCheck.lastChecked : undefined,
          status: status === 'healthy' ? 'connected' : 'degraded',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      return healthCheck;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check for authentication errors
      if (errorMessage.includes('auth') || errorMessage.includes('401') || errorMessage.includes('403')) {
        return this.createHealthCheck(connectionId, 'unauthorized', errorMessage);
      }

      return this.createHealthCheck(connectionId, 'unavailable', errorMessage);
    }
  }

  /**
   * Check health of all connections
   */
  async checkAllConnections(userId: string): Promise<HealthCheck[]> {
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data: connections } = await supabase
      .from('integration_connections')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'connected');

    if (!connections) return [];

    const healthChecks = await Promise.all(
      connections.map(conn => this.checkHealth(conn.id))
    );

    return healthChecks;
  }

  /**
   * Get cached health check
   */
  getCachedHealth(connectionId: string): HealthCheck | null {
    return this.healthCache.get(connectionId) || null;
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(userId: string, intervalMs: number = 300000): void {
    // 5 minutes default
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      await this.checkAllConnections(userId);
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Create a health check object
   */
  private createHealthCheck(
    connectionId: string,
    status: HealthStatus,
    error?: string
  ): HealthCheck {
    return {
      connectionId,
      status,
      lastChecked: new Date().toISOString(),
      error,
      toolsAvailable: 0,
      resourcesAvailable: 0,
      promptsAvailable: 0,
    };
  }

  /**
   * Get health summary for dashboard
   */
  getHealthSummary(): {
    total: number;
    healthy: number;
    degraded: number;
    unavailable: number;
    unauthorized: number;
  } {
    const checks = Array.from(this.healthCache.values());

    return {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unavailable: checks.filter(c => c.status === 'unavailable').length,
      unauthorized: checks.filter(c => c.status === 'unauthorized').length,
    };
  }
}

export const connectionHealthMonitor = new SIConnectionHealthMonitor();
