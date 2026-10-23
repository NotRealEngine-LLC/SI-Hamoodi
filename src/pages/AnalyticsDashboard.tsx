// HAMOODI SyntheTech Intelligence — Analytics Dashboard
// Phase 11: Product Analytics & Usage Monitoring

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, TrendingUp, Activity, Zap, Bot, Workflow,
  Loader2, AlertCircle, Calendar
} from 'lucide-react';
import { analyticsService } from '../lib/billing/analytics-service';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import type { AnalyticsEvent } from '../lib/billing/types';

export function AnalyticsDashboard() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceManagement();
  
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (user && currentWorkspace) {
      loadAnalytics();
    }
  }, [user, currentWorkspace, dateRange]);

  const loadAnalytics = async () => {
    if (!user || !currentWorkspace) return;

    setIsLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (dateRange === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else {
        startDate.setDate(startDate.getDate() - 90);
      }

      // Get events
      const eventData = await analyticsService.getEvents({
        workspace_id: currentWorkspace.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit: 100,
      });
      setEvents(eventData);

      // Get event counts
      const counts = await analyticsService.getEventCounts(
        currentWorkspace.id,
        startDate.toISOString(),
        endDate.toISOString()
      );
      setEventCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const getMetricCards = () => {
    return [
      {
        title: 'AI Generations',
        value: eventCounts['ai_generation_completed'] || 0,
        icon: Zap,
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/10',
      },
      {
        title: 'Agent Runs',
        value: eventCounts['agent_run_completed'] || 0,
        icon: Bot,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
      },
      {
        title: 'Workflow Runs',
        value: eventCounts['workflow_completed'] || 0,
        icon: Workflow,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
      },
      {
        title: 'Failed Generations',
        value: eventCounts['ai_generation_failed'] || 0,
        icon: AlertCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-zinc-400">Monitor usage and performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-zinc-500" />
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as any)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {getMetricCards().map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${metric.bgColor} flex items-center justify-center`}>
                  <metric.icon size={24} className={metric.color} />
                </div>
                <TrendingUp size={16} className="text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500 mb-1">{metric.title}</p>
              <p className="text-3xl font-bold text-white">{metric.value.toLocaleString()}</p>
            </motion.div>
          ))}
        </div>

        {/* Event Breakdown */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-violet-400" />
            Event Breakdown
          </h2>
          <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
            {Object.keys(eventCounts).length === 0 ? (
              <div className="text-center py-12">
                <Activity size={48} className="text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No events recorded in this period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(eventCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([eventName, count]) => (
                    <div key={eventName} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-violet-400" />
                        <span className="text-sm text-zinc-300">
                          {formatEventName(eventName)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(eventCounts))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white w-16 text-right">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* Recent Events */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-emerald-400" />
            Recent Events
          </h2>
          <div className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Activity size={48} className="text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">No recent events</p>
              </div>
            ) : (
              <div className="space-y-2">
                {events.slice(0, 20).map(event => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-zinc-900/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <p className="text-sm text-zinc-300">
                          {formatEventName(event.event_name)}
                        </p>
                        {event.entity_type && (
                          <p className="text-xs text-zinc-500">
                            {event.entity_type}: {event.entity_id}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                      {event.source && (
                        <p className="text-xs text-zinc-600 capitalize">
                          {event.source}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatEventName(eventName: string): string {
  return eventName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
