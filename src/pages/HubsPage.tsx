// HAMOODI SyntheTech Intelligence — Hubs Page
// Phase 04: Hub management and organization

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderOpen, Eye, EyeOff, MoreVertical, Edit3, Trash2, Archive } from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import type { HubVisibility } from '../lib/supabase/types';

export function HubsPage() {
  const { hubs, createHub, updateHub, deleteHub, canCreateHub } = useWorkspaceManagement();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newVisibility, setNewVisibility] = useState<HubVisibility>('workspace');
  const [selectedHub, setSelectedHub] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    // This would need currentWorkspace.id from context
    // For now, placeholder
    setShowCreate(false);
    setNewName('');
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Hubs</h2>
          <p className="text-sm text-zinc-500 mt-1">Organize related projects and context</p>
        </div>
        {canCreateHub && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus size={16} /> New Hub
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
          >
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Hub name..."
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 mb-3"
            />
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs text-zinc-400">Visibility:</label>
              <select
                value={newVisibility}
                onChange={e => setNewVisibility(e.target.value as HubVisibility)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="workspace">Workspace (all members)</option>
                <option value="restricted">Restricted (specific members)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs rounded-lg">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hubs.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={48} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">No hubs yet</h3>
          <p className="text-sm text-zinc-500 mb-4">Create a hub to organize related projects and share context</p>
          {canCreateHub && (
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-all"
            >
              Create Your First Hub
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hubs.map(hub => (
            <motion.div
              key={hub.id}
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl cursor-pointer transition-all"
              onClick={() => setSelectedHub(hub.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  hub.color ? `bg-${hub.color}-500/20` : 'bg-violet-500/20'
                }`}>
                  {hub.icon ? (
                    <span className="text-lg">{hub.icon}</span>
                  ) : (
                    <FolderOpen size={18} className="text-violet-400" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {hub.visibility === 'restricted' ? (
                    <span title="Restricted"><EyeOff size={12} className="text-amber-400" /></span>
                  ) : (
                    <span title="Workspace visible"><Eye size={12} className="text-emerald-400" /></span>
                  )}
                </div>
              </div>
              <h3 className="text-base font-semibold text-white mb-1">{hub.name}</h3>
              {hub.description && (
                <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{hub.description}</p>
              )}
              <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                <span>{hub.project_count || 0} projects</span>
                <span>•</span>
                <span>{hub.file_count || 0} files</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
