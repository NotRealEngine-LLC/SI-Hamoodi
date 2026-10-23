// HAMOODI SyntheTech Intelligence — Execution History Page
// Phase 06: Comprehensive run history and details

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Loader2,
  ChevronRight, Filter, Search, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getSupabaseClient } from '../lib/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import type { AgentRun, RunStatus } from '../lib/super-agent/types';

export function ExecutionHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'running'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadRuns = async () => {
      if (!user) return;

      const supabase = getSupabaseClient();
      if (!supabase) return;

      let query = supabase
        .from('agent_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data } = await query;
      if (data) {
        setRuns(data as AgentRun[]);
      }
      setIsLoading(false);
    };

    loadRuns();
  }, [user]);

  const filteredRuns = runs.filter(run => {
    // Filter by status
    if (filter !== 'all' && run.status !== filter) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return run.objective.toLowerCase().includes(query);
    }

    return true;
  });

  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-emerald-400" />;
      case 'failed':
        return <XCircle size={16} className="text-red-400" />;
      case 'running':
        return <Loader2 size={16} className="text-violet-400 animate-spin" />;
      case 'partially_completed':
        return <AlertCircle size={16} className="text-amber-400" />;
      case 'cancelled':
        return <XCircle size={16} className="text-zinc-400" />;
      default:
        return <Clock size={16} className="text-zinc-500" />;
    }
  };

  const getStatusColor = (status: RunStatus) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400';
      case 'failed':
        return 'text-red-400';
      case 'running':
        return 'text-violet-400';
      case 'partially_completed':
        return 'text-amber-400';
      default:
        return 'text-zinc-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Execution History</h1>
            <p className="text-sm text-zinc-500 mt-1">View and manage past Super Agent runs</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search runs..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-500" />
            {(['all', 'completed', 'failed', 'running'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Run List */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filteredRuns.length === 0 ? (
          <div className="text-center py-16">
            <Clock size={48} className="text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">
              {searchQuery || filter !== 'all' ? 'No runs match your filters' : 'No runs yet'}
            </h3>
            <p className="text-sm text-zinc-500">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first Super Agent run to see it here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRuns.map(run => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/agents/runs/${run.id}`)}
                className="p-4 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(run.status)}
                      <span className={`text-sm font-medium capitalize ${getStatusColor(run.status)}`}>
                        {run.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-white mb-2 line-clamp-2">
                      {run.objective}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(run.created_at)}
                      </span>
                      {run.plan && (
                        <span>
                          {run.plan.totalTasks} task{run.plan.totalTasks !== 1 ? 's' : ''}
                        </span>
                      )}
                      {run.total_model_calls > 0 && (
                        <span>
                          {run.total_model_calls} model call{run.total_model_calls !== 1 ? 's' : ''}
                        </span>
                      )}
                      {run.total_tokens_used > 0 && (
                        <span>
                          {run.total_tokens_used.toLocaleString()} tokens
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-zinc-600 shrink-0 mt-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
