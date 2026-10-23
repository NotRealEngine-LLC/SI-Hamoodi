// HAMOODI SyntheTech Intelligence — Execution Timeline
// Phase 06: Real-time execution event feed

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, CheckCircle, XCircle, Clock, AlertCircle, Loader2,
  Brain, Wrench, Shield, GitBranch, Target, Zap
} from 'lucide-react';
import { getSupabaseClient } from '../supabase/client';
import type { AgentExecutionEvent, AgentEventType } from './types';

interface ExecutionTimelineProps {
  runId: string;
  className?: string;
}

const EVENT_CONFIG: Record<AgentEventType, { icon: React.ElementType; color: string; label: string }> = {
  'run.started': { icon: Play, color: 'text-emerald-400', label: 'Run started' },
  'run.paused': { icon: Clock, color: 'text-blue-400', label: 'Run paused' },
  'run.resumed': { icon: Play, color: 'text-emerald-400', label: 'Run resumed' },
  'run.cancelled': { icon: XCircle, color: 'text-red-400', label: 'Run cancelled' },
  'run.completed': { icon: CheckCircle, color: 'text-emerald-400', label: 'Run completed' },
  'run.failed': { icon: XCircle, color: 'text-red-400', label: 'Run failed' },
  'plan.created': { icon: Target, color: 'text-violet-400', label: 'Plan created' },
  'plan.approved': { icon: CheckCircle, color: 'text-emerald-400', label: 'Plan approved' },
  'plan.rejected': { icon: XCircle, color: 'text-red-400', label: 'Plan rejected' },
  'task.assigned': { icon: Brain, color: 'text-blue-400', label: 'Task assigned' },
  'task.started': { icon: Play, color: 'text-emerald-400', label: 'Task started' },
  'task.progress': { icon: Loader2, color: 'text-violet-400', label: 'Task in progress' },
  'task.completed': { icon: CheckCircle, color: 'text-emerald-400', label: 'Task completed' },
  'task.failed': { icon: XCircle, color: 'text-red-400', label: 'Task failed' },
  'task.skipped': { icon: AlertCircle, color: 'text-amber-400', label: 'Task skipped' },
  'approval.requested': { icon: Shield, color: 'text-amber-400', label: 'Approval requested' },
  'approval.approved': { icon: CheckCircle, color: 'text-emerald-400', label: 'Approval granted' },
  'approval.rejected': { icon: XCircle, color: 'text-red-400', label: 'Approval rejected' },
  'tool.executing': { icon: Wrench, color: 'text-blue-400', label: 'Tool executing' },
  'tool.completed': { icon: CheckCircle, color: 'text-emerald-400', label: 'Tool completed' },
  'tool.failed': { icon: XCircle, color: 'text-red-400', label: 'Tool failed' },
  'checkpoint.saved': { icon: GitBranch, color: 'text-violet-400', label: 'Checkpoint saved' },
  'budget.exceeded': { icon: AlertCircle, color: 'text-red-400', label: 'Budget exceeded' },
};

export function ExecutionTimeline({ runId, className = '' }: ExecutionTimelineProps) {
  const [events, setEvents] = useState<AgentExecutionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const { data } = await supabase
        .from('agent_execution_events')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true });

      if (data) {
        setEvents(data as AgentExecutionEvent[]);
      }
      setIsLoading(false);
    };

    loadEvents();

    // Poll for updates every 2 seconds
    const interval = setInterval(loadEvents, 2000);
    return () => clearInterval(interval);
  }, [runId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatSummary = (event: AgentExecutionEvent): string => {
    const config = EVENT_CONFIG[event.event_type];
    let summary = config?.label || event.event_type;

    if (event.event_data) {
      if (event.event_data.title) {
        summary += `: ${event.event_data.title}`;
      }
      if (event.event_data.error) {
        summary += ` — ${event.event_data.error}`;
      }
    }

    return summary;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 size={20} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={`text-center py-8 text-sm text-zinc-500 ${className}`}>
        No execution events yet
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence>
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.event_type] || {
            icon: Clock,
            color: 'text-zinc-400',
            label: event.event_type,
          };
          const Icon = config.icon;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                event.event_type.includes('completed') || event.event_type.includes('approved')
                  ? 'bg-emerald-500/10'
                  : event.event_type.includes('failed') || event.event_type.includes('rejected')
                  ? 'bg-red-500/10'
                  : event.event_type.includes('started') || event.event_type.includes('executing')
                  ? 'bg-violet-500/10'
                  : 'bg-zinc-700/30'
              }`}>
                <Icon size={14} className={config.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300">{formatSummary(event)}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span>{formatTime(event.created_at)}</span>
                  {event.agent_role && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{event.agent_role}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
