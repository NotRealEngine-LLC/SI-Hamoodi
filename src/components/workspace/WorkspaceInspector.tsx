// HAMOODI SyntheTech Intelligence — Workspace Inspector
// Part 02: Contextual side panel for workspace information

import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Calendar, Hash, Sparkles, FolderKanban, Info } from 'lucide-react';

interface WorkspaceInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    type: 'conversation' | 'project' | 'general';
    data: any;
  } | null;
}

export function WorkspaceInspector({ isOpen, onClose, context }: WorkspaceInspectorProps) {
  if (!context) return null;

  const renderConversationContext = (data: any) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2">
          {data.title || 'Untitled Conversation'}
        </h3>
        <p className="text-sm text-[var(--si-text-muted)]">
          AI conversation with {data.model || 'AI'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
          <MessageSquare size={18} className="text-[#9378ff]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--si-text-muted)]">Messages</p>
            <p className="text-sm font-medium text-[var(--si-text-primary)]">
              {data.messageCount || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
          <Sparkles size={18} className="text-[#52dad5]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--si-text-muted)]">Model</p>
            <p className="text-sm font-medium text-[var(--si-text-primary)]">
              {data.model || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
          <Calendar size={18} className="text-[#c2f58d]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--si-text-muted)]">Created</p>
            <p className="text-sm font-medium text-[var(--si-text-primary)]">
              {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        {data.updatedAt && (
          <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
            <Calendar size={18} className="text-[#f3bd65]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--si-text-muted)]">Last Updated</p>
              <p className="text-sm font-medium text-[var(--si-text-primary)]">
                {new Date(data.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {data.projectId && (
          <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
            <FolderKanban size={18} className="text-[#59d9a7]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--si-text-muted)]">Project</p>
              <p className="text-sm font-medium text-[var(--si-text-primary)]">
                {data.projectName || 'Linked project'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[var(--si-border)]">
        <h4 className="text-sm font-medium text-[var(--si-text-secondary)] mb-3">Actions</h4>
        <div className="space-y-2">
          <button className="w-full px-3 py-2 text-sm text-left text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] rounded-lg transition-colors">
            Rename conversation
          </button>
          <button className="w-full px-3 py-2 text-sm text-left text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] rounded-lg transition-colors">
            Export conversation
          </button>
          <button className="w-full px-3 py-2 text-sm text-left text-[var(--si-danger)] hover:bg-[var(--si-danger)]/10 rounded-lg transition-colors">
            Delete conversation
          </button>
        </div>
      </div>
    </div>
  );

  const renderProjectContext = (data: any) => (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: data.color || '#9378ff' }}
          >
            <span className="text-xl">{data.icon || '📁'}</span>
          </div>
          <h3 className="text-lg font-semibold text-[var(--si-text-primary)]">
            {data.name || 'Untitled Project'}
          </h3>
        </div>
        {data.description && (
          <p className="text-sm text-[var(--si-text-muted)]">
            {data.description}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
          <MessageSquare size={18} className="text-[#9378ff]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--si-text-muted)]">Conversations</p>
            <p className="text-sm font-medium text-[var(--si-text-primary)]">
              {data.conversationCount || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
          <Calendar size={18} className="text-[#52dad5]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--si-text-muted)]">Created</p>
            <p className="text-sm font-medium text-[var(--si-text-primary)]">
              {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        {data.updatedAt && (
          <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
            <Calendar size={18} className="text-[#c2f58d]" />
            <div className="flex-1">
              <p className="text-xs text-[var(--si-text-muted)]">Last Updated</p>
              <p className="text-sm font-medium text-[var(--si-text-primary)]">
                {new Date(data.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[var(--si-border)]">
        <h4 className="text-sm font-medium text-[var(--si-text-secondary)] mb-3">Actions</h4>
        <div className="space-y-2">
          <button className="w-full px-3 py-2 text-sm text-left text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] rounded-lg transition-colors">
            Edit project
          </button>
          <button className="w-full px-3 py-2 text-sm text-left text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] rounded-lg transition-colors">
            New conversation
          </button>
          <button className="w-full px-3 py-2 text-sm text-left text-[var(--si-danger)] hover:bg-[var(--si-danger)]/10 rounded-lg transition-colors">
            Delete project
          </button>
        </div>
      </div>
    </div>
  );

  const renderGeneralContext = (data: any) => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2">
          Workspace Overview
        </h3>
        <p className="text-sm text-[var(--si-text-muted)]">
          Your HAMOODI SI workspace
        </p>
      </div>

      <div className="p-4 bg-[var(--si-surface-interactive)] rounded-xl">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-[#9378ff] mt-0.5" />
          <div>
            <p className="text-sm text-[var(--si-text-primary)] mb-1">
              Select a conversation or project to see details
            </p>
            <p className="text-xs text-[var(--si-text-muted)]">
              The inspector shows contextual information about your current workspace item.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
          <Hash size={18} className="text-[#52dad5]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--si-text-muted)]">Total Projects</p>
            <p className="text-sm font-medium text-[var(--si-text-primary)]">
              {data?.projectCount || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-[var(--si-surface-interactive)] rounded-xl">
          <MessageSquare size={18} className="text-[#c2f58d]" />
          <div className="flex-1">
            <p className="text-xs text-[var(--si-text-muted)]">Total Conversations</p>
            <p className="text-sm font-medium text-[var(--si-text-primary)]">
              {data?.conversationCount || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />

          {/* Inspector panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--si-surface)] border-l border-[var(--si-border)] z-50 overflow-y-auto lg:relative lg:max-w-none lg:w-[320px]"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--si-surface)] border-b border-[var(--si-border)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--si-text-primary)] uppercase tracking-wider">
                Inspector
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--si-surface-interactive)] rounded-lg transition-colors"
                aria-label="Close inspector"
              >
                <X size={18} className="text-[var(--si-text-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {context.type === 'conversation' && renderConversationContext(context.data)}
              {context.type === 'project' && renderProjectContext(context.data)}
              {context.type === 'general' && renderGeneralContext(context.data)}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
