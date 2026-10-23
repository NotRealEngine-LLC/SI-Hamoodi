// HAMOODI SyntheTech Intelligence — Workflow Builder
// Phase 10: Workflow Creation & Management

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, Save, Trash2, ArrowLeft, Play, CheckCircle,
  AlertCircle, Loader2, Edit3, Plus, GitBranch
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { workflowService } from '../lib/agents/workflow-service';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, WorkflowNodeType } from '../lib/agents/types';

export function WorkflowBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const { 
    workflows, selectedWorkflow, selectWorkflow,
    error, clearError
  } = useAgents();

  const [isEditing, setIsEditing] = useState(!id);
  const [isRunning, setIsRunning] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    nodes: [] as WorkflowNode[],
    edges: [] as WorkflowEdge[],
  });

  // Load workflow if editing
  useEffect(() => {
    if (id && workflows.length > 0) {
      const workflow = workflows.find(w => w.id === id);
      if (workflow) {
        selectWorkflow(workflow);
        setFormData({
          name: workflow.name,
          description: workflow.description || '',
          nodes: workflow.nodes,
          edges: workflow.edges,
        });
      }
    }
  }, [id, workflows, selectWorkflow]);

  const handleSave = async () => {
    if (!currentWorkspace || !user) return;

    try {
      if (selectedWorkflow) {
        await workflowService.updateWorkflow(user.id, selectedWorkflow.id, formData);
      } else {
        const workflow = await workflowService.createWorkflow(user.id, {
          workspace_id: currentWorkspace.id,
          ...formData,
        });
        selectWorkflow(workflow);
        navigate(`/workflows/${workflow.id}/edit`);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save workflow:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkflow || !user) return;
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      await workflowService.deleteWorkflow(user.id, selectedWorkflow.id);
      navigate('/agents');
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const handleRun = async () => {
    if (!selectedWorkflow || !user) return;
    if (!confirm('Run this workflow now?')) return;

    setIsRunning(true);
    try {
      const run = await workflowService.createRun(user.id, selectedWorkflow.id, 'manual', {});
      alert(`Workflow run started: ${run.id}`);
    } catch (err) {
      console.error('Failed to run workflow:', err);
      alert('Failed to start workflow');
    } finally {
      setIsRunning(false);
    }
  };

  const addNode = (type: WorkflowNodeType) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 100, y: 100 + formData.nodes.length * 100 },
      config: getDefaultConfig(type),
    };
    setFormData({ ...formData, nodes: [...formData.nodes, newNode] });
  };

  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setFormData({
      ...formData,
      nodes: formData.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n),
    });
  };

  const deleteNode = (nodeId: string) => {
    setFormData({
      ...formData,
      nodes: formData.nodes.filter(n => n.id !== nodeId),
      edges: formData.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    });
  };

  const addEdge = (sourceId: string, targetId: string) => {
    const newEdge: WorkflowEdge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
    };
    setFormData({ ...formData, edges: [...formData.edges, newEdge] });
  };

  const deleteEdge = (edgeId: string) => {
    setFormData({
      ...formData,
      edges: formData.edges.filter(e => e.id !== edgeId),
    });
  };

  const getDefaultConfig = (type: WorkflowNodeType): any => {
    switch (type) {
      case 'trigger':
        return { triggerType: 'manual' };
      case 'agent':
        return { agentId: '', input: {} };
      case 'tool':
        return { toolId: '', input: {} };
      case 'condition':
        return { expression: '' };
      case 'transform':
        return { mapping: {} };
      case 'approval':
        return { message: 'Approval required' };
      case 'delay':
        return { duration: 1000 };
      case 'output':
        return { format: 'text' };
      default:
        return {};
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Workflow size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {selectedWorkflow ? selectedWorkflow.name : 'Create Workflow'}
              </h1>
              <p className="text-sm text-zinc-500">
                {selectedWorkflow ? `Version ${selectedWorkflow.current_version}` : 'Build automated workflows'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedWorkflow && !isEditing && (
              <>
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm rounded-xl transition-all"
                >
                  {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  <span>{isRunning ? 'Running...' : 'Run'}</span>
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
                    if (!selectedWorkflow) navigate('/agents');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all"
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
        <div className="max-w-6xl mx-auto px-8 py-6">
          {isEditing ? (
            <WorkflowEditor
              formData={formData}
              setFormData={setFormData}
              addNode={addNode}
              updateNode={updateNode}
              deleteNode={deleteNode}
              addEdge={addEdge}
              deleteEdge={deleteEdge}
            />
          ) : selectedWorkflow ? (
            <WorkflowViewer workflow={selectedWorkflow} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Workflow Editor Component
function WorkflowEditor({
  formData,
  setFormData,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  deleteEdge,
}: {
  formData: any;
  setFormData: (data: any) => void;
  addNode: (type: WorkflowNodeType) => void;
  updateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (source: string, target: string) => void;
  deleteEdge: (id: string) => void;
}) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Workflow size={18} className="text-emerald-400" />
          Workflow Identity
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Workflow name"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this workflow do?"
              className="w-full h-20 px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Node Palette */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Add Nodes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { type: 'trigger', label: 'Trigger', icon: Play, color: 'text-blue-400' },
            { type: 'agent', label: 'Agent', icon: GitBranch, color: 'text-violet-400' },
            { type: 'tool', label: 'Tool', icon: Workflow, color: 'text-amber-400' },
            { type: 'condition', label: 'Condition', icon: GitBranch, color: 'text-orange-400' },
            { type: 'transform', label: 'Transform', icon: GitBranch, color: 'text-cyan-400' },
            { type: 'approval', label: 'Approval', icon: CheckCircle, color: 'text-emerald-400' },
            { type: 'delay', label: 'Delay', icon: Loader2, color: 'text-zinc-400' },
            { type: 'output', label: 'Output', icon: CheckCircle, color: 'text-green-400' },
          ].map(({ type, label, icon: Icon, color }) => (
            <button
              key={type}
              onClick={() => addNode(type as WorkflowNodeType)}
              className="flex flex-col items-center gap-2 p-4 bg-zinc-900/30 hover:bg-zinc-900/50 border border-zinc-700/30 rounded-lg transition-all"
            >
              <Icon size={20} className={color} />
              <span className="text-xs text-zinc-300">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Nodes List */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Nodes ({formData.nodes.length})</h2>
        {formData.nodes.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            No nodes yet. Add nodes using the palette above.
          </p>
        ) : (
          <div className="space-y-3">
            {formData.nodes.map((node: WorkflowNode) => (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 bg-zinc-900/30 border rounded-lg cursor-pointer transition-all ${
                  selectedNode === node.id
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-zinc-700/30 hover:bg-zinc-900/50'
                }`}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Workflow size={14} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{node.type}</p>
                      <p className="text-xs text-zinc-500">ID: {node.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNode(node.id);
                    }}
                    className="p-1.5 hover:bg-red-900/30 rounded transition-all"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Edges */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Connections ({formData.edges.length})</h2>
        {formData.edges.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            No connections yet. Connect nodes to define workflow flow.
          </p>
        ) : (
          <div className="space-y-2">
            {formData.edges.map((edge: WorkflowEdge) => (
              <div
                key={edge.id}
                className="flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-700/30 rounded-lg"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">{edge.source}</span>
                  <span className="text-zinc-600">→</span>
                  <span className="text-zinc-400">{edge.target}</span>
                </div>
                <button
                  onClick={() => deleteEdge(edge.id)}
                  className="p-1.5 hover:bg-red-900/30 rounded transition-all"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// Workflow Viewer Component
function WorkflowViewer({ workflow }: { workflow: WorkflowDefinition }) {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Status</p>
            <p className="text-sm text-white capitalize flex items-center gap-2">
              {workflow.status === 'active' && <CheckCircle size={14} className="text-emerald-400" />}
              {workflow.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Version</p>
            <p className="text-sm text-white">{workflow.current_version}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Nodes</p>
            <p className="text-sm text-white">{workflow.nodes.length}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Connections</p>
            <p className="text-sm text-white">{workflow.edges.length}</p>
          </div>
        </div>
        {workflow.description && (
          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-1">Description</p>
            <p className="text-sm text-zinc-300">{workflow.description}</p>
          </div>
        )}
      </section>

      {/* Nodes */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Nodes</h2>
        <div className="space-y-2">
          {workflow.nodes.map(node => (
            <div
              key={node.id}
              className="p-3 bg-zinc-900/30 border border-zinc-700/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Workflow size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white capitalize">{node.type}</p>
                  <p className="text-xs text-zinc-500">ID: {node.id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edges */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Connections</h2>
        <div className="space-y-2">
          {workflow.edges.map(edge => (
            <div
              key={edge.id}
              className="flex items-center gap-2 p-3 bg-zinc-900/30 border border-zinc-700/30 rounded-lg text-sm"
            >
              <span className="text-zinc-400">{edge.source}</span>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-400">{edge.target}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
