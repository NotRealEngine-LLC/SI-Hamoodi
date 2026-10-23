// HAMOODI SyntheTech Intelligence — Agent Builder
// Phase 10: Custom Agent Creation & Management

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Plus, Save, Trash2, Play, Settings, Sparkles,
  ArrowLeft, CheckCircle, AlertCircle, Loader2, Edit3
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import type { CustomAgent, ModelPolicy, AgentSkill } from '../lib/agents/types';

export function AgentBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceManagement();
  const { 
    agents, selectedAgent, selectAgent, 
    createAgent, updateAgent, deleteAgent, testAgent,
    skills, loadSkills,
    error, clearError 
  } = useAgents();

  const [isEditing, setIsEditing] = useState(!id);
  const [isTesting, setIsTesting] = useState(false);
  const [testTask, setTestTask] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    icon: '🤖',
    color: 'violet',
    category: '',
    instructions: '',
    model_policy: { mode: 'auto' as const },
    skill_ids: [] as string[],
    allowed_tool_ids: [] as string[],
    knowledge_scope: [] as string[],
    max_iterations: 10,
    max_model_calls: 20,
    max_tool_calls: 25,
    requires_approval_for_writes: true,
  });

  // Load agent if editing
  useEffect(() => {
    if (id && agents.length > 0) {
      const agent = agents.find(a => a.id === id);
      if (agent) {
        selectAgent(agent);
        setFormData({
          name: agent.name,
          description: agent.description || '',
          icon: agent.icon || '🤖',
          color: agent.color || 'violet',
          category: agent.category || '',
          instructions: agent.instructions,
          model_policy: agent.model_policy,
          skill_ids: agent.skill_ids,
          allowed_tool_ids: agent.allowed_tool_ids,
          knowledge_scope: agent.knowledge_scope,
          max_iterations: agent.max_iterations,
          max_model_calls: agent.max_model_calls,
          max_tool_calls: agent.max_tool_calls,
          requires_approval_for_writes: agent.requires_approval_for_writes,
        });
      }
    }
  }, [id, agents, selectAgent]);

  // Load skills
  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleSave = async () => {
    if (!currentWorkspace) return;

    try {
      if (selectedAgent) {
        await updateAgent(selectedAgent.id, formData);
      } else {
        const agent = await createAgent({
          workspace_id: currentWorkspace.id,
          ...formData,
        });
        selectAgent(agent);
        navigate(`/agents/custom/${agent.id}`);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save agent:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      await deleteAgent(selectedAgent.id);
      navigate('/agents');
    } catch (err) {
      console.error('Failed to delete agent:', err);
    }
  };

  const handleTest = async () => {
    if (!selectedAgent || !testTask.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testAgent(selectedAgent.id, testTask);
      setTestResult(result);
    } catch (err) {
      console.error('Test failed:', err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/agents')}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-all"
            >
              <ArrowLeft size={20} className="text-zinc-400" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {selectedAgent ? selectedAgent.name : 'Create Agent'}
              </h1>
              <p className="text-sm text-zinc-500">
                {selectedAgent ? `Version ${selectedAgent.current_version}` : 'Build a custom AI agent'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedAgent && !isEditing && (
              <>
                <button
                  onClick={() => setIsTesting(!isTesting)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-all"
                >
                  <Play size={16} />
                  <span>Test</span>
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (!selectedAgent) navigate('/agents');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all"
                >
                  <Save size={16} />
                  <span>Save</span>
                </button>
              </>
            )}
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-6">
          {isEditing ? (
            <AgentEditor formData={formData} setFormData={setFormData} skills={skills} />
          ) : selectedAgent ? (
            <AgentViewer agent={selectedAgent} />
          ) : null}

          {/* Test Panel */}
          <AnimatePresence>
            {isTesting && selectedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-6 p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Play size={18} className="text-blue-400" />
                  Test Agent
                </h3>
                <textarea
                  value={testTask}
                  onChange={e => setTestTask(e.target.value)}
                  placeholder="Enter a task to test the agent..."
                  className="w-full h-24 px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none mb-3"
                />
                <button
                  onClick={handleTest}
                  disabled={!testTask.trim() || isTesting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all"
                >
                  {isTesting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Run Test</span>
                    </>
                  )}
                </button>

                {testResult && (
                  <div className="mt-4 p-4 bg-zinc-900/50 rounded-lg">
                    <h4 className="text-sm font-medium text-zinc-300 mb-2">Result:</h4>
                    <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
                      {testResult.result}
                    </pre>
                    <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                      <span>Model: {testResult.modelUsed}</span>
                      <span>Tokens: {testResult.tokenUsage?.totalTokens || 0}</span>
                      <span>Duration: {testResult.durationMs}ms</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Agent Editor Component
function AgentEditor({ 
  formData, 
  setFormData, 
  skills 
}: { 
  formData: any; 
  setFormData: (data: any) => void;
  skills: AgentSkill[];
}) {
  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={18} className="text-violet-400" />
          Identity
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Agent name"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Icon</label>
            <input
              type="text"
              value={formData.icon}
              onChange={e => setFormData({ ...formData, icon: e.target.value })}
              placeholder="🤖"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this agent do?"
              className="w-full h-20 px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Research, Writing, Analysis"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-violet-400" />
          Instructions
        </h2>
        <textarea
          value={formData.instructions}
          onChange={e => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="Define the agent's behavior, personality, and capabilities..."
          className="w-full h-48 px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none font-mono"
        />
        <p className="text-xs text-zinc-500 mt-2">
          {formData.instructions.length} characters
        </p>
      </section>

      {/* Model Configuration */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bot size={18} className="text-violet-400" />
          Model Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Model Policy</label>
            <select
              value={formData.model_policy.mode}
              onChange={e => setFormData({ 
                ...formData, 
                model_policy: { ...formData.model_policy, mode: e.target.value }
              })}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              <option value="auto">Automatic (Let system choose)</option>
              <option value="manual">Manual (Specify model)</option>
            </select>
          </div>
          {formData.model_policy.mode === 'manual' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Model ID</label>
              <input
                type="text"
                value={formData.model_policy.modelId || ''}
                onChange={e => setFormData({ 
                  ...formData, 
                  model_policy: { ...formData.model_policy, modelId: e.target.value }
                })}
                placeholder="gpt-4o-mini"
                className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          )}
        </div>
      </section>

      {/* Budget & Limits */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Budget & Limits</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Max Iterations</label>
            <input
              type="number"
              value={formData.max_iterations}
              onChange={e => setFormData({ ...formData, max_iterations: Number(e.target.value) })}
              min={1}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Max Model Calls</label>
            <input
              type="number"
              value={formData.max_model_calls}
              onChange={e => setFormData({ ...formData, max_model_calls: Number(e.target.value) })}
              min={1}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Max Tool Calls</label>
            <input
              type="number"
              value={formData.max_tool_calls}
              onChange={e => setFormData({ ...formData, max_tool_calls: Number(e.target.value) })}
              min={0}
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requires_approval_for_writes}
              onChange={e => setFormData({ ...formData, requires_approval_for_writes: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
            />
            <span className="text-sm text-zinc-300">Require approval for write operations</span>
          </label>
        </div>
      </section>

      {/* Skills */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Skills</h2>
        {skills.length === 0 ? (
          <p className="text-sm text-zinc-500">No skills available. Create skills in the Skills Studio.</p>
        ) : (
          <div className="space-y-2">
            {skills.map(skill => (
              <label key={skill.id} className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-lg cursor-pointer hover:bg-zinc-900/50 transition-all">
                <input
                  type="checkbox"
                  checked={formData.skill_ids.includes(skill.id)}
                  onChange={e => {
                    const newSkillIds = e.target.checked
                      ? [...formData.skill_ids, skill.id]
                      : formData.skill_ids.filter((id: string) => id !== skill.id);
                    setFormData({ ...formData, skill_ids: newSkillIds });
                  }}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-violet-500 focus:ring-violet-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{skill.name}</p>
                  <p className="text-xs text-zinc-500">{skill.description}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Agent Viewer Component
function AgentViewer({ agent }: { agent: CustomAgent }) {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Status</p>
            <p className="text-sm text-white capitalize flex items-center gap-2">
              {agent.status === 'active' && <CheckCircle size={14} className="text-emerald-400" />}
              {agent.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Version</p>
            <p className="text-sm text-white">{agent.current_version}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Category</p>
            <p className="text-sm text-white">{agent.category || 'Uncategorized'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Created</p>
            <p className="text-sm text-white">{new Date(agent.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        {agent.description && (
          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-1">Description</p>
            <p className="text-sm text-zinc-300">{agent.description}</p>
          </div>
        )}
      </section>

      {/* Instructions */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Instructions</h2>
        <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">
          {agent.instructions}
        </pre>
      </section>

      {/* Configuration */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Model Policy</p>
            <p className="text-sm text-white capitalize">{agent.model_policy.mode}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Max Iterations</p>
            <p className="text-sm text-white">{agent.max_iterations}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Max Model Calls</p>
            <p className="text-sm text-white">{agent.max_model_calls}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Max Tool Calls</p>
            <p className="text-sm text-white">{agent.max_tool_calls}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Skills</p>
            <p className="text-sm text-white">{agent.skill_ids.length} assigned</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Approval Required</p>
            <p className="text-sm text-white">{agent.requires_approval_for_writes ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
