// HAMOODI SyntheTech Intelligence — Workspace Dashboard
// Phase 04: Command-center workspace experience

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderOpen, MessageSquare, Zap, File as FileIcon, Upload,
  Plus, Users, Clock, TrendingUp, ArrowRight, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';

export function WorkspaceDashboard() {
  const navigate = useNavigate();
  const { projects, conversations, activities } = useWorkspace();
  const { currentWorkspace, currentMembership, hubs } = useWorkspaceManagement();
  const { profile } = useAuth();
  const [showCreateHub, setShowCreateHub] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">No workspace selected</p>
      </div>
    );
  }

  const recentProjects = projects.slice(0, 6);
  const recentConversations = conversations.slice(0, 5);
  const recentHubs = hubs.slice(0, 4);
  const recentActivities = activities.slice(0, 8);

  const stats = [
    { label: 'Projects', value: projects.length, icon: FolderOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Hubs', value: hubs.length, icon: Zap, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Conversations', value: conversations.length, icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Members', value: currentMembership ? 1 : 0, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                currentWorkspace.color ? `bg-${currentWorkspace.color}-500/20` : 'bg-violet-500/20'
              }`}>
                {currentWorkspace.icon ? (
                  <span className="text-xl">{currentWorkspace.icon}</span>
                ) : (
                  <Sparkles size={20} className="text-violet-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{currentWorkspace.name}</h1>
                <p className="text-sm text-zinc-500">
                  {currentWorkspace.description || 'Your workspace'}
                </p>
              </div>
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 px-3 py-1.5 bg-zinc-800/50 rounded-lg capitalize">
              {currentWorkspace.type} workspace
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon size={14} className={stat.color} />
                </div>
                <span className="text-xs text-zinc-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Recent items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick actions */}
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => navigate('/workspace')}
                className="flex items-center gap-2 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl transition-all"
              >
                <Plus size={14} className="text-violet-400" />
                <span className="text-xs text-zinc-300">New Project</span>
              </button>
              <button
                onClick={() => navigate('/hubs')}
                className="flex items-center gap-2 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl transition-all"
              >
                <Zap size={14} className="text-amber-400" />
                <span className="text-xs text-zinc-300">New Hub</span>
              </button>
              <button
                onClick={() => navigate('/files')}
                className="flex items-center gap-2 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl transition-all"
              >
                <Upload size={14} className="text-emerald-400" />
                <span className="text-xs text-zinc-300">Upload File</span>
              </button>
              <button
                onClick={() => navigate('/workspace')}
                className="flex items-center gap-2 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl transition-all"
              >
                <MessageSquare size={14} className="text-blue-400" />
                <span className="text-xs text-zinc-300">New Chat</span>
              </button>
            </div>
          </div>

          {/* Recent projects */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-400">Recent Projects</h2>
              {projects.length > 0 && (
                <button
                  onClick={() => navigate('/workspace')}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  View all <ArrowRight size={10} />
                </button>
              )}
            </div>
            {recentProjects.length === 0 ? (
              <div className="p-6 bg-zinc-800/20 border border-zinc-700/30 rounded-xl text-center">
                <FolderOpen size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No projects yet</p>
                <button
                  onClick={() => navigate('/workspace')}
                  className="mt-2 text-xs text-violet-400 hover:text-violet-300"
                >
                  Create your first project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recentProjects.map(project => (
                  <motion.div
                    key={project.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FolderOpen size={14} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{project.name}</p>
                        {project.description && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{project.description}</p>
                        )}
                      </div>
                      {project.is_pinned && (
                        <span className="text-[10px] text-violet-400">Pinned</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Recent hubs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-zinc-400">Hubs</h2>
              {hubs.length > 0 && (
                <button
                  onClick={() => navigate('/hubs')}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  View all <ArrowRight size={10} />
                </button>
              )}
            </div>
            {recentHubs.length === 0 ? (
              <div className="p-6 bg-zinc-800/20 border border-zinc-700/30 rounded-xl text-center">
                <Zap size={24} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No hubs yet</p>
                <button
                  onClick={() => navigate('/hubs')}
                  className="mt-2 text-xs text-violet-400 hover:text-violet-300"
                >
                  Create your first hub
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recentHubs.map(hub => (
                  <motion.div
                    key={hub.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Zap size={14} className="text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{hub.name}</p>
                        <p className="text-xs text-zinc-500 capitalize">{hub.visibility}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Activity & Conversations */}
        <div className="space-y-6">
          {/* Recent conversations */}
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-3">Recent Conversations</h2>
            {recentConversations.length === 0 ? (
              <div className="p-4 bg-zinc-800/20 border border-zinc-700/30 rounded-xl text-center">
                <MessageSquare size={20} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentConversations.map(convo => (
                  <div
                    key={convo.id}
                    className="p-2.5 bg-zinc-800/20 hover:bg-zinc-800/40 border border-zinc-700/20 rounded-lg cursor-pointer transition-all"
                  >
                    <p className="text-xs font-medium text-zinc-300 truncate">{convo.title}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{convo.messages.length} messages</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div>
            <h2 className="text-sm font-medium text-zinc-400 mb-3">Recent Activity</h2>
            {recentActivities.length === 0 ? (
              <div className="p-4 bg-zinc-800/20 border border-zinc-700/30 rounded-xl text-center">
                <Clock size={20} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentActivities.map(activity => (
                  <div
                    key={activity.id}
                    className="p-2.5 bg-zinc-800/20 border border-zinc-700/20 rounded-lg"
                  >
                    <p className="text-xs text-zinc-300">{activity.summary}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
