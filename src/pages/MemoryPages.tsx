// HAMOODI SyntheTech Intelligence — Memory Management & SecondBrain Dashboard
// Phase 07: Unified memory and knowledge UI

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Database, FileText, Plus, Search, Filter, 
  Trash2, Edit3, CheckCircle, Clock, AlertCircle,
  Loader2, BookOpen, Sparkles
} from 'lucide-react';
import { useMemory } from '../contexts/MemoryContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import type { MemoryItem, KnowledgeSource } from '../lib/memory/types';

// ============ MEMORY MANAGEMENT PAGE ============
export function MemoryManagementPage() {
  const { currentWorkspace } = useWorkspaceManagement();
  const { 
    memories, knowledgeSources, isLoadingMemories, isLoadingSources,
    createMemory, deleteMemory, indexSource, deleteSource, error, clearError 
  } = useMemory();
  
  const [showCreateMemory, setShowCreateMemory] = useState(false);
  const [showCreateSource, setShowCreateSource] = useState(false);
  const [filter, setFilter] = useState<'all' | 'personal' | 'workspace'>('all');

  const filteredMemories = memories.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'personal') return m.scope === 'personal';
    if (filter === 'workspace') return m.scope === 'workspace';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SI Memory</h1>
            <p className="text-sm text-zinc-500">Manage your persistent knowledge and memories</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-8 pt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button onClick={clearError} className="text-zinc-500 hover:text-zinc-300">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memories Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Brain size={18} className="text-violet-400" />
                Memories ({filteredMemories.length})
              </h2>
              <button
                onClick={() => setShowCreateMemory(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-all"
              >
                <Plus size={14} />
                Add Memory
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
              {(['all', 'personal', 'workspace'] as const).map(f => (
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

            {/* Memory List */}
            {isLoadingMemories ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-violet-400" />
              </div>
            ) : filteredMemories.length === 0 ? (
              <div className="text-center py-12 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
                <Brain size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No memories yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMemories.map(memory => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onDelete={() => deleteMemory(memory.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Knowledge Sources Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database size={18} className="text-emerald-400" />
                Knowledge Sources ({knowledgeSources.length})
              </h2>
              <button
                onClick={() => setShowCreateSource(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-all"
              >
                <Plus size={14} />
                Add Source
              </button>
            </div>

            {/* Source List */}
            {isLoadingSources ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-emerald-400" />
              </div>
            ) : knowledgeSources.length === 0 ? (
              <div className="text-center py-12 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
                <Database size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No knowledge sources yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {knowledgeSources.map(source => (
                  <SourceCard
                    key={source.id}
                    source={source}
                    onIndex={() => indexSource(source.id)}
                    onDelete={() => deleteSource(source.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MEMORY CARD ============
function MemoryCard({ memory, onDelete }: { memory: MemoryItem; onDelete: () => void }) {
  const getStatusIcon = () => {
    switch (memory.status) {
      case 'active': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'pending_review': return <Clock size={14} className="text-amber-400" />;
      case 'archived': return <Clock size={14} className="text-zinc-400" />;
      default: return <AlertCircle size={14} className="text-zinc-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl hover:bg-zinc-800/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon()}
            <h3 className="text-sm font-medium text-white truncate">{memory.title}</h3>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{memory.content}</p>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500">
            <span className="capitalize">{memory.scope}</span>
            <span>•</span>
            <span className="capitalize">{memory.memory_type}</span>
            <span>•</span>
            <span>{new Date(memory.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-900/30 rounded transition-all"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    </motion.div>
  );
}

// ============ SOURCE CARD ============
function SourceCard({ source, onIndex, onDelete }: { source: KnowledgeSource; onIndex: () => void; onDelete: () => void }) {
  const getStatusColor = () => {
    switch (source.index_status) {
      case 'ready': return 'text-emerald-400';
      case 'failed': return 'text-red-400';
      case 'queued':
      case 'extracting':
      case 'chunking':
      case 'embedding':
      case 'indexing':
        return 'text-violet-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl hover:bg-zinc-800/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className={getStatusColor()} />
            <h3 className="text-sm font-medium text-white truncate">{source.title}</h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-zinc-500 mb-2">
            <span className="capitalize">{source.source_type}</span>
            <span>•</span>
            <span className={getStatusColor()}>
              {source.index_status.replace(/_/g, ' ')}
            </span>
            {source.chunk_count > 0 && (
              <>
                <span>•</span>
                <span>{source.chunk_count} chunks</span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {source.index_status !== 'ready' && (
            <button
              onClick={onIndex}
              className="p-1.5 hover:bg-violet-900/30 rounded transition-all"
              title="Index"
            >
              <Sparkles size={14} className="text-violet-400" />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-900/30 rounded transition-all"
            title="Delete"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============ SECONDBRAIN DASHBOARD ============
export function SecondBrainDashboard() {
  const { currentWorkspace } = useWorkspaceManagement();
  const { memories, knowledgeSources } = useMemory();

  const stats = {
    totalMemories: memories.length,
    totalSources: knowledgeSources.length,
    indexedSources: knowledgeSources.filter(s => s.index_status === 'ready').length,
    personalMemories: memories.filter(m => m.scope === 'personal').length,
    workspaceMemories: memories.filter(m => m.scope === 'workspace').length,
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SI SecondBrain</h1>
            <p className="text-sm text-zinc-500">Organize what matters. Retrieve what you need.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={Brain}
            label="Total Memories"
            value={stats.totalMemories}
            color="violet"
          />
          <StatCard
            icon={Database}
            label="Knowledge Sources"
            value={stats.totalSources}
            color="emerald"
          />
          <StatCard
            icon={CheckCircle}
            label="Indexed"
            value={stats.indexedSources}
            color="emerald"
          />
          <StatCard
            icon={Brain}
            label="Personal"
            value={stats.personalMemories}
            color="blue"
          />
          <StatCard
            icon={Database}
            label="Workspace"
            value={stats.workspaceMemories}
            color="amber"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickAction icon={Brain} label="Save Memory" color="violet" />
            <QuickAction icon={FileText} label="Index File" color="emerald" />
            <QuickAction icon={Search} label="Search Knowledge" color="blue" />
            <QuickAction icon={Database} label="Manage Sources" color="amber" />
          </div>
        </div>

        {/* Recent Memories */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Recent Memories</h2>
          {memories.length === 0 ? (
            <div className="text-center py-8 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
              <Brain size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No memories yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {memories.slice(0, 5).map(memory => (
                <MemoryCard key={memory.id} memory={memory} onDelete={() => {}} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Sources */}
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-3">Recent Knowledge Sources</h2>
          {knowledgeSources.length === 0 ? (
            <div className="text-center py-8 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
              <Database size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No knowledge sources yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {knowledgeSources.slice(0, 5).map(source => (
                <SourceCard key={source.id} source={source} onIndex={() => {}} onDelete={() => {}} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ STAT CARD ============
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  const colorClasses = {
    violet: 'bg-violet-500/10 text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    blue: 'bg-blue-500/10 text-blue-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

// ============ QUICK ACTION ============
function QuickAction({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  const colorClasses = {
    violet: 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
  };

  return (
    <button className={`p-4 rounded-xl transition-all ${colorClasses[color as keyof typeof colorClasses]}`}>
      <Icon size={20} className="mx-auto mb-2" />
      <p className="text-xs font-medium text-center">{label}</p>
    </button>
  );
}
