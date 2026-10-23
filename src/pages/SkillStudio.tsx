// HAMOODI SyntheTech Intelligence — Skill Studio
// Phase 10: Skill Creation & Management

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, Save, Trash2, ArrowLeft, CheckCircle, 
  AlertCircle, Loader2, Edit3, FileText
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAgents } from '../contexts/AgentsContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import type { AgentSkill, SkillManifest } from '../lib/agents/types';

export function SkillStudio() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentWorkspace } = useWorkspaceManagement();
  const { 
    skills, selectedSkill, selectSkill,
    createSkill, updateSkill, deleteSkill,
    error, clearError
  } = useAgents();

  const [isEditing, setIsEditing] = useState(!id);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    instructions: '',
    manifest: {
      name: '',
      description: '',
      version: '1.0.0',
      author: '',
      license: 'MIT',
      dependencies: [],
      requested_capabilities: [],
    } as SkillManifest,
    resource_files: [] as string[],
    requested_capabilities: [] as string[],
  });

  // Load skill if editing
  useEffect(() => {
    if (id && skills.length > 0) {
      const skill = skills.find(s => s.id === id);
      if (skill) {
        selectSkill(skill);
        setFormData({
          name: skill.name,
          description: skill.description || '',
          category: skill.category || '',
          instructions: skill.instructions,
          manifest: skill.manifest,
          resource_files: skill.resource_files,
          requested_capabilities: skill.requested_capabilities,
        });
      }
    }
  }, [id, skills, selectSkill]);

  const handleSave = async () => {
    if (!currentWorkspace) return;

    try {
      if (selectedSkill) {
        await updateSkill(selectedSkill.id, formData);
      } else {
        const skill = await createSkill({
          workspace_id: currentWorkspace.id,
          ...formData,
        });
        selectSkill(skill);
        navigate(`/skills/${skill.id}/edit`);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save skill:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedSkill) return;
    if (!confirm('Are you sure you want to delete this skill?')) return;

    try {
      await deleteSkill(selectedSkill.id);
      navigate('/agents');
    } catch (err) {
      console.error('Failed to delete skill:', err);
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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {selectedSkill ? selectedSkill.name : 'Create Skill'}
              </h1>
              <p className="text-sm text-zinc-500">
                {selectedSkill ? `Version ${selectedSkill.current_version}` : 'Package reusable expertise'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedSkill && !isEditing && (
              <>
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
                    if (!selectedSkill) navigate('/agents');
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-xl transition-all"
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
            <SkillEditor formData={formData} setFormData={setFormData} />
          ) : selectedSkill ? (
            <SkillViewer skill={selectedSkill} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Skill Editor Component
function SkillEditor({ 
  formData, 
  setFormData 
}: { 
  formData: any; 
  setFormData: (data: any) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Identity */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-400" />
          Identity
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., market-research"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Research, Writing, Analysis"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this skill do?"
              className="w-full h-20 px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Manifest */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText size={18} className="text-amber-400" />
          SKILL.md Manifest
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Version</label>
            <input
              type="text"
              value={formData.manifest.version}
              onChange={e => setFormData({ 
                ...formData, 
                manifest: { ...formData.manifest, version: e.target.value }
              })}
              placeholder="1.0.0"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Author</label>
            <input
              type="text"
              value={formData.manifest.author || ''}
              onChange={e => setFormData({ 
                ...formData, 
                manifest: { ...formData.manifest, author: e.target.value }
              })}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">License</label>
            <input
              type="text"
              value={formData.manifest.license || 'MIT'}
              onChange={e => setFormData({ 
                ...formData, 
                manifest: { ...formData.manifest, license: e.target.value }
              })}
              placeholder="MIT"
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Instructions</h2>
        <textarea
          value={formData.instructions}
          onChange={e => setFormData({ ...formData, instructions: e.target.value })}
          placeholder="## Skill Instructions&#10;&#10;Define how this skill should be used..."
          className="w-full h-64 px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none font-mono"
        />
        <p className="text-xs text-zinc-500 mt-2">
          {formData.instructions.length} characters
        </p>
      </section>

      {/* Requested Capabilities */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Requested Capabilities</h2>
        <div className="space-y-2">
          {['web_search', 'file_read', 'file_write', 'code_execution', 'external_api'].map(cap => (
            <label key={cap} className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-lg cursor-pointer hover:bg-zinc-900/50 transition-all">
              <input
                type="checkbox"
                checked={formData.requested_capabilities.includes(cap)}
                onChange={e => {
                  const newCaps = e.target.checked
                    ? [...formData.requested_capabilities, cap]
                    : formData.requested_capabilities.filter((c: string) => c !== cap);
                  setFormData({ ...formData, requested_capabilities: newCaps });
                }}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-sm text-zinc-300">{cap}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

// Skill Viewer Component
function SkillViewer({ skill }: { skill: AgentSkill }) {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Overview</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Status</p>
            <p className="text-sm text-white capitalize flex items-center gap-2">
              {skill.status === 'published' && <CheckCircle size={14} className="text-emerald-400" />}
              {skill.status}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Version</p>
            <p className="text-sm text-white">{skill.current_version}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Category</p>
            <p className="text-sm text-white">{skill.category || 'Uncategorized'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Created</p>
            <p className="text-sm text-white">{new Date(skill.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        {skill.description && (
          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-1">Description</p>
            <p className="text-sm text-zinc-300">{skill.description}</p>
          </div>
        )}
      </section>

      {/* Manifest */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Manifest</h2>
        <pre className="text-xs text-zinc-300 bg-zinc-900/50 p-4 rounded-lg overflow-x-auto">
          {JSON.stringify(skill.manifest, null, 2)}
        </pre>
      </section>

      {/* Instructions */}
      <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Instructions</h2>
        <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">
          {skill.instructions}
        </pre>
      </section>

      {/* Capabilities */}
      {skill.requested_capabilities.length > 0 && (
        <section className="p-6 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
          <h2 className="text-lg font-semibold text-white mb-4">Requested Capabilities</h2>
          <div className="flex flex-wrap gap-2">
            {skill.requested_capabilities.map(cap => (
              <span
                key={cap}
                className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full"
              >
                {cap}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
