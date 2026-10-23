// HAMOODI SyntheTech Intelligence — Super Agent Command Center
// Phase 06: Premium operational dashboard for autonomous task execution

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Play, Pause, X, CheckCircle, AlertCircle, Clock, 
  List, GitBranch, Eye, Edit3, Trash2, ChevronRight,
  Brain, Target, Sparkles, Loader2
} from 'lucide-react';
import { useSuperAgent } from '../contexts/SuperAgentContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import type { AgentRun, ExecutionPlan, RunStatus } from '../lib/super-agent/types';

export function SuperAgentCommandCenter() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceManagement();
  const { runs, activeRun, isLoading, createRun, generatePlan, approvePlan, executeRun, cancelRun, error, clearError } = useSuperAgent();
  
  const [objective, setObjective] = useState('');
  const [view, setView] = useState<'composer' | 'plan' | 'execution'>('composer');
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);

  const handleCreateRun = async () => {
    if (!objective.trim() || !currentWorkspace) return;
    
    try {
      const run = await createRun(objective, {
        workspaceId: currentWorkspace.id,
      });
      setSelectedRun(run);
      setView('plan');
      await generatePlan(run.id);
    } catch (err) {
      console.error('Failed to create run:', err);
    }
  };

  const handleApproveAndExecute = async () => {
    if (!selectedRun) return;
    
    try {
      await approvePlan(selectedRun.id);
      await executeRun(selectedRun.id);
      setView('execution');
    } catch (err) {
      console.error('Failed to execute:', err);
    }
  };

  const getStatusColor = (status: RunStatus) => {
    switch (status) {
      case 'completed': return 'text-emerald-400';
      case 'failed': return 'text-red-400';
      case 'running': return 'text-violet-400';
      case 'awaiting_plan_approval': return 'text-amber-400';
      case 'paused': return 'text-blue-400';
      case 'cancelled': return 'text-zinc-400';
      default: return 'text-zinc-500';
    }
  };

  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return AlertCircle;
      case 'running': return Loader2;
      case 'awaiting_plan_approval': return Clock;
      case 'paused': return Pause;
      case 'cancelled': return X;
      default: return Clock;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SI Super Agent</h1>
              <p className="text-sm text-zinc-500">Turn complex objectives into coordinated intelligent execution</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/agents/history')}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-sm text-zinc-300 transition-all"
          >
            <Clock size={16} />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Error Panel */}
      {error && (
        <div className="px-8 pt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button onClick={clearError} className="text-zinc-500 hover:text-zinc-300">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {view === 'composer' && (
          <div className="max-w-3xl mx-auto">
            {/* Goal Composer */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-violet-400" />
                <h2 className="text-lg font-semibold text-white">Define Your Objective</h2>
              </div>
              
              <textarea
                value={objective}
                onChange={e => setObjective(e.target.value)}
                placeholder="Describe what you want to accomplish...&#10;&#10;Example: Research the market for an AI-powered productivity startup, analyze opportunities, and prepare an actionable launch strategy."
                className="w-full h-32 px-4 py-3 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
              />

              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-zinc-500">
                  {objective.length} characters
                </div>
                <button
                  onClick={handleCreateRun}
                  disabled={!objective.trim() || isLoading || !currentWorkspace}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Create Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Runs */}
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Recent Runs</h3>
              {runs.length === 0 ? (
                <div className="text-center py-12 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
                  <Brain size={32} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No runs yet. Create your first objective above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {runs.slice(0, 10).map((run: AgentRun) => {
                    const StatusIcon = getStatusIcon(run.status);
                    return (
                      <button
                        key={run.id}
                        onClick={() => {
                          setSelectedRun(run);
                          setView(run.plan ? 'execution' : 'plan');
                        }}
                        className="w-full p-4 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl text-left transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate mb-1">
                              {run.objective}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-zinc-500">
                              <span className={`flex items-center gap-1 ${getStatusColor(run.status)}`}>
                                <StatusIcon size={12} className={run.status === 'running' ? 'animate-spin' : ''} />
                                {run.status.replace(/_/g, ' ')}
                              </span>
                              <span>{new Date(run.created_at).toLocaleDateString()}</span>
                              {run.plan && <span>{run.plan.totalTasks} tasks</span>}
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-zinc-600 shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'plan' && selectedRun?.plan && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Execution Plan</h2>
                <p className="text-sm text-zinc-500 mt-1">Review and approve the execution plan</p>
              </div>
              <button
                onClick={() => setView('composer')}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
              >
                Back
              </button>
            </div>

            {/* Plan Summary */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Total Tasks</p>
                  <p className="text-2xl font-bold text-white">{selectedRun.plan.totalTasks}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Parallelizable</p>
                  <p className="text-2xl font-bold text-white">{selectedRun.plan.parallelizableTasks}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Complexity</p>
                  <p className="text-2xl font-bold text-white capitalize">{selectedRun.plan.estimatedComplexity}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 mb-1">Estimated Duration</p>
                <p className="text-sm text-zinc-300">{selectedRun.plan.estimatedDuration}</p>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-3 mb-6">
              {selectedRun.plan.tasks.map((task: any, index: number) => (
                <div
                  key={task.id}
                  className="p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-violet-400">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white mb-1">{task.title}</h4>
                      <p className="text-xs text-zinc-400 mb-2">{task.description}</p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Brain size={10} />
                          {task.assignedRole}
                        </span>
                        {task.dependencies.length > 0 && (
                          <span className="flex items-center gap-1">
                            <GitBranch size={10} />
                            {task.dependencies.length} dependencies
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded ${
                          task.riskLevel === 'high' ? 'bg-red-500/10 text-red-400' :
                          task.riskLevel === 'medium' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {task.riskLevel} risk
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Approval Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleApproveAndExecute}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    <span>Approve & Execute</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setView('composer')}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {view === 'execution' && selectedRun && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Execution Progress</h2>
                <p className="text-sm text-zinc-500 mt-1">{selectedRun.objective}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedRun.status === 'running' && (
                  <button
                    onClick={() => cancelRun(selectedRun.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-xl transition-all"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setView('composer')}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
                >
                  Back
                </button>
              </div>
            </div>

            {/* Execution Status */}
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const StatusIcon = getStatusIcon(selectedRun.status);
                  return <StatusIcon size={24} className={`${getStatusColor(selectedRun.status)} ${selectedRun.status === 'running' ? 'animate-spin' : ''}`} />;
                })()}
                <div>
                  <p className={`text-lg font-semibold ${getStatusColor(selectedRun.status)}`}>
                    {selectedRun.status.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {selectedRun.total_model_calls} model calls • {selectedRun.total_tokens_used.toLocaleString()} tokens
                  </p>
                </div>
              </div>

              {selectedRun.execution_report && (
                <div className="pt-4 border-t border-zinc-700/50">
                  <p className="text-sm text-zinc-300 mb-2">{selectedRun.execution_report.summary}</p>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500">Completed:</span>{' '}
                      <span className="text-emerald-400">{selectedRun.execution_report.tasksCompleted}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Failed:</span>{' '}
                      <span className="text-red-400">{selectedRun.execution_report.tasksFailed}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Duration:</span>{' '}
                      <span className="text-zinc-300">{(selectedRun.execution_report.totalDuration / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Task Progress */}
            {selectedRun.plan && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Tasks</h3>
                {selectedRun.plan.tasks.map((task: any, index: number) => (
                  <div
                    key={task.id}
                    className="p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-zinc-700/50 flex items-center justify-center">
                        <span className="text-xs font-medium text-zinc-400">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-zinc-300">{task.title}</p>
                      </div>
                      <span className="text-xs text-zinc-500 capitalize">{task.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
