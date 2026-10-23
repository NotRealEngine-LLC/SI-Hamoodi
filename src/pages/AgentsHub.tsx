// HAMOODI SyntheTech Intelligence — Agents Hub
// Phase 10: Agent, Skill & Workflow Management Dashboard

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Sparkles, Workflow, Plus, Search, Filter,
  CheckCircle, Clock, Archive, Loader2
} from 'lucide-react';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';

export function AgentsHub() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceManagement();
  const { 
    agents, skills, workflows,
    isLoadingAgents, isLoadingSkills, isLoadingWorkflows,
    error, clearError
  } = useAgents();

  const [activeTab, setActiveTab] = useState<'agents' | 'skills' | 'workflows'>('agents');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || skill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return <CheckCircle size={14} className="text-emerald-400" />;
      case 'draft':
        return <Clock size={14} className="text-amber-400" />;
      case 'archived':
      case 'deprecated':
        return <Archive size={14} className="text-zinc-400" />;
      default:
        return <Clock size={14} className="text-zinc-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'published':
        return 'text-emerald-400';
      case 'draft':
        return 'text-amber-400';
      case 'archived':
      case 'deprecated':
        return 'text-zinc-400';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Agents & Automation</h1>
              <p className="text-sm text-zinc-500">Build intelligence once. Reuse it everywhere.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/agents/builder')}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20"
            >
              <Plus size={16} />
              <span>New Agent</span>
            </button>
            <button
              onClick={() => navigate('/skills/new')}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
            >
              <Sparkles size={16} />
              <span>New Skill</span>
            </button>
            <button
              onClick={() => navigate('/workflows/new')}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
            >
              <Workflow size={16} />
              <span>New Workflow</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'agents'
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot size={16} />
              <span>Agents ({agents.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'skills'
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <span>Skills ({skills.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'workflows'
                ? 'bg-violet-500/20 text-violet-300'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Workflow size={16} />
              <span>Workflows ({workflows.length})</span>
            </div>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-zinc-500" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-8 pt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button onClick={clearError} className="text-zinc-500 hover:text-zinc-300">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'agents' && (
          <AgentsList
            agents={filteredAgents}
            isLoading={isLoadingAgents}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
            onSelect={(id) => navigate(`/agents/custom/${id}`)}
          />
        )}
        {activeTab === 'skills' && (
          <SkillsList
            skills={filteredSkills}
            isLoading={isLoadingSkills}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
            onSelect={(id) => navigate(`/skills/${id}/edit`)}
          />
        )}
        {activeTab === 'workflows' && (
          <WorkflowsList
            workflows={filteredWorkflows}
            isLoading={isLoadingWorkflows}
            getStatusIcon={getStatusIcon}
            getStatusColor={getStatusColor}
            onSelect={(id) => navigate(`/workflows/${id}/edit`)}
          />
        )}
      </div>
    </div>
  );
}

// Agents List Component
function AgentsList({ 
  agents, 
  isLoading, 
  getStatusIcon, 
  getStatusColor,
  onSelect 
}: { 
  agents: any[];
  isLoading: boolean;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="text-center py-16">
        <Bot size={48} className="text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-400 mb-2">No agents yet</h3>
        <p className="text-sm text-zinc-500">Create your first custom agent to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map(agent => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect(agent.id)}
          className="p-5 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-xl">
                {agent.icon || '🤖'}
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">{agent.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  {getStatusIcon(agent.status)}
                  <span className={`text-xs capitalize ${getStatusColor(agent.status)}`}>
                    {agent.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {agent.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{agent.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>v{agent.current_version}</span>
            {agent.category && <span>• {agent.category}</span>}
            <span>• {agent.skill_ids.length} skills</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Skills List Component
function SkillsList({ 
  skills, 
  isLoading, 
  getStatusIcon, 
  getStatusColor,
  onSelect 
}: { 
  skills: any[];
  isLoading: boolean;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (skills.length === 0) {
    return (
      <div className="text-center py-16">
        <Sparkles size={48} className="text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-400 mb-2">No skills yet</h3>
        <p className="text-sm text-zinc-500">Create reusable skills to enhance your agents</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map(skill => (
        <motion.div
          key={skill.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect(skill.id)}
          className="p-5 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-white">{skill.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                {getStatusIcon(skill.status)}
                <span className={`text-xs capitalize ${getStatusColor(skill.status)}`}>
                  {skill.status}
                </span>
              </div>
            </div>
          </div>
          {skill.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{skill.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>v{skill.current_version}</span>
            {skill.category && <span>• {skill.category}</span>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Workflows List Component
function WorkflowsList({ 
  workflows, 
  isLoading, 
  getStatusIcon, 
  getStatusColor,
  onSelect 
}: { 
  workflows: any[];
  isLoading: boolean;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <div className="text-center py-16">
        <Workflow size={48} className="text-zinc-700 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-zinc-400 mb-2">No workflows yet</h3>
        <p className="text-sm text-zinc-500">Create automated workflows to streamline your work</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workflows.map(workflow => (
        <motion.div
          key={workflow.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelect(workflow.id)}
          className="p-5 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl cursor-pointer transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-white">{workflow.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                {getStatusIcon(workflow.status)}
                <span className={`text-xs capitalize ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
              </div>
            </div>
          </div>
          {workflow.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{workflow.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>v{workflow.current_version}</span>
            <span>• {workflow.nodes.length} nodes</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
