// HAMOODI SyntheTech Intelligence — Main Workspace
// Phase 03: Cloud-connected workspace with guest mode support

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, MessageSquare, Plus, Settings, LogOut, User,
  Cloud, CloudOff, Pin, Trash2, Edit3, Check, X, Menu, ChevronRight,
  Sparkles, Send, Bot, Loader2, Zap, Globe, HardDrive,
  Shield, RefreshCw, Database, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace, Project, Conversation, Message } from '../contexts/WorkspaceContext';
import { HubsPage } from './HubsPage';
import { FilesPage } from './FilesPage';

// ============ SIDEBAR ============
function Sidebar({ activeView, setActiveView, selectedProject, setSelectedProject, selectedConversation, setSelectedConversation }: {
  activeView: string;
  setActiveView: (v: string) => void;
  selectedProject: Project | null;
  setSelectedProject: (p: Project | null) => void;
  selectedConversation: Conversation | null;
  setSelectedConversation: (c: Conversation | null) => void;
}) {
  const { user, profile, state: authState, signOut, isConfigured } = useAuth();
  const { mode, projects, conversations, syncStatus } = useWorkspace();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Guest';
  const isGuest = authState !== 'authenticated';

  return (
    <div className="w-72 h-full bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-sm font-bold text-white">⬡</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">HAMOODI</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">SyntheTech Intelligence</p>
          </div>
        </div>

        {/* Mode indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50">
          {mode === 'cloud' ? (
            <>
              <Cloud size={12} className="text-emerald-400" />
              <span className="text-xs text-emerald-400">Cloud Workspace</span>
            </>
          ) : (
            <>
              <HardDrive size={12} className="text-amber-400" />
              <span className="text-xs text-amber-400">Local Guest Mode</span>
            </>
          )}
          {syncStatus === 'syncing' && <RefreshCw size={10} className="animate-spin text-zinc-400 ml-auto" />}
          {syncStatus === 'synced' && <CheckCircle size={10} className="text-emerald-400 ml-auto" />}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-1">
        <button
          onClick={() => { setActiveView('projects'); setSelectedProject(null); setSelectedConversation(null); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeView === 'projects' ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <FolderOpen size={16} />
          <span>Projects</span>
          <span className="ml-auto text-xs text-zinc-600">{projects.length}</span>
        </button>
        <button
          onClick={() => { setActiveView('conversations'); setSelectedConversation(null); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeView === 'conversations' ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <MessageSquare size={16} />
          <span>Conversations</span>
          <span className="ml-auto text-xs text-zinc-600">{conversations.length}</span>
        </button>
        <button
          onClick={() => setActiveView('hubs')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeView === 'hubs' ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <Zap size={16} />
          <span>Hubs</span>
        </button>
        <button
          onClick={() => setActiveView('files')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeView === 'files' ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <HardDrive size={16} />
          <span>Files</span>
        </button>
        <button
          onClick={() => setActiveView('activity')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeView === 'activity' ? 'bg-violet-500/10 text-violet-300' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
        >
          <Clock size={16} />
          <span>Activity</span>
        </button>
      </div>

      {/* Projects list */}
      {activeView === 'projects' && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-1">
            {projects.filter(p => p.is_pinned).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedProject?.id === p.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                <Pin size={10} className="text-violet-400" />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
            {projects.filter(p => !p.is_pinned).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedProject?.id === p.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversations list */}
      {activeView === 'conversations' && (
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-1">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedConversation(c)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${selectedConversation?.id === c.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
              >
                {c.is_pinned && <Pin size={10} className="text-violet-400" />}
                <span className="truncate">{c.title}</span>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-4">No conversations yet</p>
            )}
          </div>
        </div>
      )}

      {/* Activity */}
      {activeView === 'activity' && <ActivityPanel />}

      {/* User section */}
      <div className="p-3 border-t border-zinc-800/50 relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-zinc-700 flex items-center justify-center">
            {isGuest ? <Globe size={14} className="text-zinc-400" /> : <span className="text-xs font-medium text-violet-300">{displayName[0]?.toUpperCase()}</span>}
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-medium text-zinc-300 truncate">{displayName}</p>
            <p className="text-[10px] text-zinc-500">{isGuest ? 'Guest' : (user?.email || '')}</p>
          </div>
          <ChevronRight size={14} className="text-zinc-600" />
        </button>

        <AnimatePresence>
          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-3 right-3 mb-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden"
            >
              {isGuest ? (
                <>
                  <button onClick={() => navigate('/auth/sign-in')} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-all">
                    <User size={14} /> Sign In
                  </button>
                  <button onClick={() => navigate('/auth/sign-up')} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-violet-400 hover:bg-zinc-700/50 transition-all">
                    <Sparkles size={14} /> Create Account
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { setActiveView('settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-700/50 transition-all">
                    <Settings size={14} /> Account Settings
                  </button>
                  <button onClick={() => { signOut(); setShowUserMenu(false); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-zinc-700/50 transition-all">
                    <LogOut size={14} /> Sign Out
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ============ ACTIVITY PANEL ============
function ActivityPanel() {
  const { activities } = useWorkspace();

  return (
    <div className="flex-1 overflow-y-auto px-3 pb-3">
      {activities.length === 0 ? (
        <p className="text-xs text-zinc-600 text-center py-4">No recent activity</p>
      ) : (
        <div className="space-y-2">
          {activities.slice(0, 20).map(a => (
            <div key={a.id} className="px-3 py-2 rounded-lg bg-zinc-800/30">
              <p className="text-xs text-zinc-300">{a.summary}</p>
              <p className="text-[10px] text-zinc-600 mt-1">{new Date(a.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ MAIN CONTENT ============
function MainContent({ activeView, setActiveView, selectedProject, setSelectedProject, selectedConversation, setSelectedConversation }: {
  activeView: string;
  setActiveView: (v: string) => void;
  selectedProject: Project | null;
  setSelectedProject: (p: Project | null) => void;
  selectedConversation: Conversation | null;
  setSelectedConversation: (c: Conversation | null) => void;
}) {
  if (activeView === 'settings') return <SettingsPanel />;
  if (selectedConversation) return <ConversationView conversation={selectedConversation} onBack={() => setSelectedConversation(null)} />;
  if (selectedProject) return <ProjectDetailView project={selectedProject} onBack={() => setSelectedProject(null)} />;
  if (activeView === 'projects') return <ProjectsOverview onSelectProject={setSelectedProject} />;
  if (activeView === 'conversations') return <ConversationsOverview onSelectConversation={setSelectedConversation} />;
  return <WelcomeView />;
}

// ============ WELCOME VIEW ============
function WelcomeView() {
  const { state: authState, isConfigured } = useAuth();
  const { mode, hasLocalData, importLocalData } = useWorkspace();
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleImport = async () => {
    setImporting(true);
    const result = await importLocalData();
    setImporting(false);
    if (result.success) {
      setImportResult(`Imported ${result.imported.projects} projects, ${result.imported.conversations} conversations, ${result.imported.messages} messages`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/30 mb-6"
        >
          <Sparkles size={36} className="text-white" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-white mb-3">Welcome to HAMOODI</h2>
        <p className="text-zinc-400 mb-8">
          Your unified intelligence workspace. Create projects, have AI conversations, and manage your knowledge — all in one place.
        </p>

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-violet-400" />
              <span className="text-xs font-medium text-zinc-300">HAMOODI Account</span>
            </div>
            <p className="text-sm text-zinc-400">
              {authState === 'authenticated' ? '✓ Connected' : 'Guest Mode'}
            </p>
          </div>
          <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-zinc-300">AI Provider</span>
            </div>
            <p className="text-sm text-zinc-400">Ready</p>
          </div>
        </div>

        {/* Migration prompt */}
        {hasLocalData && mode === 'cloud' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-xl mb-6"
          >
            <p className="text-sm text-violet-300 mb-3">Local workspace data found on this device.</p>
            {importResult ? (
              <p className="text-xs text-emerald-400">{importResult}</p>
            ) : (
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-all disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import to Cloud Workspace'}
              </button>
            )}
          </motion.div>
        )}

        {/* CTA */}
        {authState !== 'authenticated' && isConfigured && (
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/auth/sign-in')} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all">
              Sign In
            </button>
            <button onClick={() => navigate('/auth/sign-up')} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl border border-zinc-700/50 transition-all">
              Create Account
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============ PROJECTS OVERVIEW ============
function ProjectsOverview({ onSelectProject }: { onSelectProject: (p: Project) => void }) {
  const { projects, createProject } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createProject({ name: newName.trim(), description: null, icon: null, color: null, is_pinned: false });
    setNewName('');
    setShowCreate(false);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Projects</h2>
          <p className="text-sm text-zinc-500">{projects.length} projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
          >
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Project name..."
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handleCreate} className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg">Create</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs rounded-lg">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No projects yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectProject(p)}
              className="p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-left transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                  <FolderOpen size={14} className="text-violet-400" />
                </div>
                {p.is_pinned && <Pin size={12} className="text-violet-400" />}
              </div>
              <h3 className="text-sm font-medium text-white truncate">{p.name}</h3>
              {p.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.description}</p>}
              <p className="text-[10px] text-zinc-600 mt-2">{new Date(p.updated_at).toLocaleDateString()}</p>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ PROJECT DETAIL ============
function ProjectDetailView({ project, onBack }: { project: Project; onBack: () => void }) {
  const { updateProject, deleteProject, conversations } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const projectConvos = conversations.filter(c => c.project_id === project.id);

  const handleSave = async () => {
    await updateProject(project.id, { name });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this project? Conversations will be detached, not deleted.')) {
      await deleteProject(project.id);
      onBack();
    }
  };

  const handlePin = async () => {
    await updateProject(project.id, { is_pinned: !project.is_pinned });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors">
        ← Back to Projects
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input value={name} onChange={e => setName(e.target.value)} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50" />
              <button onClick={handleSave} className="p-1.5 bg-emerald-600 rounded-lg"><Check size={14} className="text-white" /></button>
              <button onClick={() => setEditing(false)} className="p-1.5 bg-zinc-700 rounded-lg"><X size={14} className="text-zinc-300" /></button>
            </div>
          ) : (
            <h2 className="text-xl font-bold text-white">{project.name}</h2>
          )}
          {project.description && <p className="text-sm text-zinc-400 mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={handlePin} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all">
            <Pin size={14} className={project.is_pinned ? 'text-violet-400' : 'text-zinc-500'} />
          </button>
          <button onClick={() => setEditing(true)} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all">
            <Edit3 size={14} className="text-zinc-400" />
          </button>
          <button onClick={handleDelete} className="p-2 bg-zinc-800 hover:bg-red-900/50 rounded-lg transition-all">
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-medium text-zinc-300 mb-3">Conversations ({projectConvos.length})</h3>
      {projectConvos.length === 0 ? (
        <p className="text-sm text-zinc-600">No conversations in this project yet.</p>
      ) : (
        <div className="space-y-2">
          {projectConvos.map(c => (
            <div key={c.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
              <p className="text-sm text-zinc-300">{c.title}</p>
              <p className="text-xs text-zinc-600 mt-1">{c.messages.length} messages</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ CONVERSATIONS OVERVIEW ============
function ConversationsOverview({ onSelectConversation }: { onSelectConversation: (c: Conversation) => void }) {
  const { conversations, createConversation } = useWorkspace();
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    const convo = await createConversation({ title: newTitle.trim(), project_id: null, selected_model_id: null, is_pinned: false });
    setNewTitle('');
    setShowCreate(false);
    onSelectConversation(convo);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Conversations</h2>
          <p className="text-sm text-zinc-500">{conversations.length} conversations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus size={16} /> New Chat
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
          >
            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Conversation title..."
              className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            />
            <div className="flex gap-2 mt-3">
              <button onClick={handleCreate} className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg">Create & Open</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs rounded-lg">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare size={40} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No conversations yet. Start a new one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.01 }}
              onClick={() => onSelectConversation(c)}
              className="w-full p-4 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {c.is_pinned && <Pin size={10} className="text-violet-400" />}
                  <span className="text-sm font-medium text-white truncate">{c.title}</span>
                </div>
                <span className="text-[10px] text-zinc-600">{c.messages.length} msgs</span>
              </div>
              {c.messages.length > 0 && (
                <p className="text-xs text-zinc-500 mt-1 truncate">{c.messages[c.messages.length - 1]?.content?.slice(0, 80)}</p>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ CONVERSATION VIEW ============
function ConversationView({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const { addMessage, updateConversation, deleteConversation, mode } = useWorkspace();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [selectedModel, setSelectedModel] = useState(conversation.selected_model_id || 'gpt-4o-mini');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);
    setStreamingContent('');

    // Add user message
    await addMessage(conversation.id, {
      role: 'user',
      content: userMsg,
      status: 'completed',
      model_id: null,
      conversation_id: conversation.id,
    });

    try {
      // Build conversation history for context
      const history = conversation.messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));

      // Import and use Puter.js AI
      const { sendAIRequest, isPuterAvailable } = await import('../lib/puter/ai');
      
      const aiResponse = await sendAIRequest(userMsg, {
        model: selectedModel,
        conversationHistory: history,
        onStream: isPuterAvailable() ? (chunk) => setStreamingContent(prev => prev + chunk) : undefined,
      });

      // Persist assistant response
      await addMessage(conversation.id, {
        role: 'assistant',
        content: aiResponse,
        status: 'completed',
        model_id: selectedModel,
        conversation_id: conversation.id,
      });

      // Update conversation timestamp
      await updateConversation(conversation.id, { updated_at: new Date().toISOString() } as Partial<Conversation>);
    } catch (err) {
      // Save error state
      const errorMsg = err instanceof Error ? err.message : 'AI request failed';
      await addMessage(conversation.id, {
        role: 'assistant',
        content: `⚠️ Error: ${errorMsg}\n\nYour message was saved. Please try again.`,
        status: 'failed',
        model_id: selectedModel,
        conversation_id: conversation.id,
      });
    }

    setSending(false);
    setStreamingContent('');
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-zinc-400 hover:text-zinc-200 transition-colors">←</button>
          <h3 className="text-sm font-medium text-white truncate">{conversation.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateConversation(conversation.id, { is_pinned: !conversation.is_pinned })}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <Pin size={14} className={conversation.is_pinned ? 'text-violet-400' : 'text-zinc-500'} />
          </button>
          <button
            onClick={async () => { if (confirm('Delete this conversation?')) { await deleteConversation(conversation.id); onBack(); } }}
            className="p-2 hover:bg-red-900/30 rounded-lg transition-all"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.length === 0 && (
          <div className="text-center py-16">
            <Bot size={40} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Start a conversation...</p>
          </div>
        )}
        {conversation.messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-violet-400" />
              </div>
            )}
            <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-md'
                : 'bg-zinc-800 text-zinc-200 rounded-bl-md border border-zinc-700/50'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.status === 'streaming' && <span className="inline-block w-2 h-4 bg-zinc-400 animate-pulse ml-1" />}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                <User size={14} className="text-zinc-300" />
              </div>
            )}
          </motion.div>
        ))}
        {/* Streaming content display */}
        {streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-violet-400" />
            </div>
            <div className="max-w-[70%] px-4 py-3 rounded-2xl text-sm bg-zinc-800 text-zinc-200 rounded-bl-md border border-zinc-700/50">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
              <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-1" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl transition-all"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ SETTINGS PANEL ============
function SettingsPanel() {
  const { user, profile, state: authState, updateProfile, signOut, isConfigured } = useAuth();
  const { mode, preferences, updatePreferences, syncStatus } = useWorkspace();
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(profile?.display_name || '');

  const handleSaveName = async () => {
    await updateProfile({ display_name: name });
    setEditingName(false);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-6">Settings</h2>

      {/* Account Section */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
          <Shield size={14} className="text-violet-400" /> Account & Security
        </h3>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <p className="text-sm text-white">
                {authState === 'authenticated' ? '✓ Connected' : 'Guest Mode'}
              </p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs ${mode === 'cloud' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              {mode === 'cloud' ? 'Cloud' : 'Local'}
            </div>
          </div>

          {authState === 'authenticated' && (
            <>
              <div>
                <p className="text-xs text-zinc-500">Email</p>
                <p className="text-sm text-white">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Display Name</p>
                {editingName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input value={name} onChange={e => setName(e.target.value)} className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500" />
                    <button onClick={handleSaveName} className="p-1 bg-emerald-600 rounded"><Check size={12} className="text-white" /></button>
                    <button onClick={() => setEditingName(false)} className="p-1 bg-zinc-700 rounded"><X size={12} className="text-zinc-300" /></button>
                  </div>
                ) : (
                  <p className="text-sm text-white">{profile?.display_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-zinc-500">Member since</p>
                <p className="text-sm text-white">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
              </div>
            </>
          )}

          {authState !== 'authenticated' && isConfigured && (
            <p className="text-xs text-zinc-500">Sign in to access cloud features and cross-device sync.</p>
          )}

          {!isConfigured && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-400">Cloud authentication requires Supabase configuration. See .env.example for setup instructions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Connections */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" /> Connections
        </h3>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <span className="text-xs font-bold text-violet-400">H</span>
              </div>
              <div>
                <p className="text-sm text-white">HAMOODI Account</p>
                <p className="text-xs text-zinc-500">{authState === 'authenticated' ? user?.email : 'Guest Mode'}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${authState === 'authenticated' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-700 text-zinc-400'}`}>
              {authState === 'authenticated' ? 'Connected' : 'Guest'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white">AI Provider</p>
                <p className="text-xs text-zinc-500">Simulated (Puter.js ready)</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
          <Settings size={14} className="text-zinc-400" /> Preferences
        </h3>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Theme</span>
            <select
              value={preferences.theme}
              onChange={e => updatePreferences({ theme: e.target.value as 'dark' | 'light' | 'system' })}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Reduced Motion</span>
            <button
              onClick={() => updatePreferences({ reduced_motion: !preferences.reduced_motion })}
              className={`w-10 h-6 rounded-full transition-all ${preferences.reduced_motion ? 'bg-violet-600' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${preferences.reduced_motion ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Project View</span>
            <select
              value={preferences.project_view}
              onChange={e => updatePreferences({ project_view: e.target.value as 'grid' | 'list' })}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-300">Stream Responses</span>
            <button
              onClick={() => updatePreferences({ stream_responses: !preferences.stream_responses })}
              className={`w-10 h-6 rounded-full transition-all ${preferences.stream_responses ? 'bg-violet-600' : 'bg-zinc-700'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${preferences.stream_responses ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      {mode === 'cloud' && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
            <Database size={14} className="text-zinc-400" /> Cloud Sync
          </h3>
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              {syncStatus === 'synced' && <><CheckCircle size={14} className="text-emerald-400" /><span className="text-sm text-emerald-400">Synced</span></>}
              {syncStatus === 'syncing' && <><RefreshCw size={14} className="text-violet-400 animate-spin" /><span className="text-sm text-violet-400">Synchronizing...</span></>}
              {syncStatus === 'error' && <><AlertCircle size={14} className="text-red-400" /><span className="text-sm text-red-400">Sync Error</span></>}
              {syncStatus === 'idle' && <><Cloud size={14} className="text-zinc-400" /><span className="text-sm text-zinc-400">Ready</span></>}
              {syncStatus === 'offline' && <><CloudOff size={14} className="text-amber-400" /><span className="text-sm text-amber-400">Offline</span></>}
            </div>
            <p className="text-xs text-zinc-500 mt-2">Data is stored in your HAMOODI cloud workspace and accessible across devices.</p>
          </div>
        </div>
      )}

      {/* Sign out */}
      {authState === 'authenticated' && (
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition-all"
        >
          <LogOut size={16} /> Sign Out
        </button>
      )}
    </div>
  );
}

// ============ MAIN WORKSPACE PAGE ============
export function WorkspacePage() {
  const [activeView, setActiveView] = useState('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isLoading } = useWorkspace();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-violet-400 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-zinc-950 overflow-hidden">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 rounded-lg text-zinc-400"
      >
        <Menu size={18} />
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative z-40 h-full transition-transform duration-200`}>
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeView === 'hubs' ? (
          <HubsPage />
        ) : activeView === 'files' ? (
          <FilesPage />
        ) : (
          <MainContent
            activeView={activeView}
            setActiveView={setActiveView}
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            selectedConversation={selectedConversation}
            setSelectedConversation={setSelectedConversation}
          />
        )}
      </div>
    </div>
  );
}
