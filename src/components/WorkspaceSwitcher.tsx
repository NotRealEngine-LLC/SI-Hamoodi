// HAMOODI SyntheTech Intelligence — Workspace Switcher
// Phase 04: Premium workspace selection UI

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Check, Building2, User } from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';

export function WorkspaceSwitcher() {
  const { workspaces, currentWorkspace, setCurrentWorkspace, createWorkspace } = useWorkspaceManagement();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createWorkspace(newName.trim(), 'team');
    setNewName('');
    setShowCreate(false);
  };

  if (!currentWorkspace) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-all"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          currentWorkspace.color ? `bg-${currentWorkspace.color}-500/20` : 'bg-violet-500/20'
        }`}>
          {currentWorkspace.icon ? (
            <span className="text-sm">{currentWorkspace.icon}</span>
          ) : (
            currentWorkspace.type === 'personal' ? (
              <User size={14} className="text-violet-400" />
            ) : (
              <Building2 size={14} className="text-violet-400" />
            )
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-white truncate">{currentWorkspace.name}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            {currentWorkspace.type} workspace
          </p>
        </div>
        <ChevronDown size={14} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2 max-h-80 overflow-y-auto">
                <p className="px-3 py-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                  Your Workspaces
                </p>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => { setCurrentWorkspace(ws.id); setIsOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      currentWorkspace.id === ws.id ? 'bg-violet-500/10' : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      ws.color ? `bg-${ws.color}-500/20` : 'bg-zinc-800'
                    }`}>
                      {ws.icon ? (
                        <span className="text-sm">{ws.icon}</span>
                      ) : (
                        ws.type === 'personal' ? (
                          <User size={14} className="text-zinc-400" />
                        ) : (
                          <Building2 size={14} className="text-zinc-400" />
                        )
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white truncate">{ws.name}</p>
                      <p className="text-[10px] text-zinc-500">{ws.type}</p>
                    </div>
                    {currentWorkspace.id === ws.id && (
                      <Check size={14} className="text-violet-400" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-zinc-800 p-2">
                {showCreate ? (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      placeholder="Workspace name..."
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreate}
                        className="flex-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium rounded-lg transition-all"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => { setShowCreate(false); setNewName(''); }}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all"
                  >
                    <Plus size={14} />
                    <span>Create Workspace</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
