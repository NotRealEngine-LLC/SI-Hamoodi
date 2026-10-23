// HAMOODI SyntheTech Intelligence — Command Palette
// Part 02: Quick action command palette with keyboard navigation

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  FolderKanban, 
  Activity, 
  Wrench, 
  Settings,
  Plus,
  Search,
  Moon,
  Sun,
  Command
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { keyboardRegistry } from '../../lib/keyboard/shortcuts';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: any;
  action: () => void;
  shortcut?: string;
  group: string;
}

export function CommandPalette({ isOpen, onClose, isDark, onToggleTheme }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    {
      id: 'home',
      label: 'Go to Home',
      description: 'Navigate to homepage',
      icon: Home,
      action: () => navigate('/'),
      group: 'Navigation',
    },
    {
      id: 'new-chat',
      label: 'New Chat',
      description: 'Start a new conversation',
      icon: MessageSquare,
      action: () => navigate('/chat'),
      shortcut: 'Ctrl+Shift+O',
      group: 'Navigation',
    },
    {
      id: 'projects',
      label: 'Go to Projects',
      description: 'View all projects',
      icon: FolderKanban,
      action: () => navigate('/projects'),
      group: 'Navigation',
    },
    {
      id: 'create-project',
      label: 'Create Project',
      description: 'Start a new project',
      icon: Plus,
      action: () => navigate('/projects?new=true'),
      group: 'Navigation',
    },
    {
      id: 'activity',
      label: 'View Activity',
      description: 'See recent activity',
      icon: Activity,
      action: () => navigate('/activity'),
      group: 'Navigation',
    },
    {
      id: 'tools',
      label: 'Browse Tools',
      description: 'Explore available tools',
      icon: Wrench,
      action: () => navigate('/tools'),
      group: 'Navigation',
    },
    {
      id: 'settings',
      label: 'Open Settings',
      description: 'Configure preferences',
      icon: Settings,
      action: () => navigate('/settings'),
      group: 'Navigation',
    },

    // Appearance
    {
      id: 'toggle-theme',
      label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      description: 'Toggle application theme',
      icon: isDark ? Sun : Moon,
      action: onToggleTheme,
      group: 'Appearance',
    },

    // Search
    {
      id: 'search',
      label: 'Search Workspace',
      description: 'Search projects and conversations',
      icon: Search,
      action: () => {
        onClose();
        // Trigger global search
        window.dispatchEvent(new CustomEvent('open-global-search'));
      },
      shortcut: '/',
      group: 'Search',
    },
  ];

  // Filter commands based on query
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(query.toLowerCase()) ||
    cmd.group.toLowerCase().includes(query.toLowerCase())
  );

  // Group commands
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Flatten grouped commands for keyboard navigation
  const flatCommands = Object.values(groupedCommands).flat();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatCommands[selectedIndex]) {
      e.preventDefault();
      flatCommands[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Command palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--si-border)]">
              <Command size={20} className="text-[var(--si-text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="flex-1 bg-transparent text-[var(--si-text-primary)] placeholder-[var(--si-text-muted)] focus:outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-[var(--si-surface-interactive)] rounded transition-colors"
                  aria-label="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--si-text-muted)]" />
                  </svg>
                </button>
              )}
            </div>

            {/* Commands list */}
            <div className="max-h-[60vh] overflow-y-auto">
              {flatCommands.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Search size={32} className="text-[var(--si-text-muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--si-text-muted)]">
                    No commands found for "{query}"
                  </p>
                </div>
              ) : (
                Object.entries(groupedCommands).map(([group, cmds]) => (
                  <div key={group}>
                    <div className="px-6 py-2 text-xs font-semibold text-[var(--si-text-muted)] uppercase tracking-wider bg-[var(--si-surface-elevated)]">
                      {group}
                    </div>
                    {cmds.map(cmd => {
                      const flatIndex = flatCommands.indexOf(cmd);
                      const isSelected = flatIndex === selectedIndex;
                      const Icon = cmd.icon;

                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`w-full px-6 py-3 flex items-center gap-4 text-left transition-colors ${
                            isSelected
                              ? 'bg-[var(--si-surface-interactive)]'
                              : 'hover:bg-[var(--si-surface-interactive)]/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSelected ? 'bg-[#9378ff]/20' : 'bg-[var(--si-surface-interactive)]'
                          }`}>
                            <Icon size={18} className={isSelected ? 'text-[#9378ff]' : 'text-[var(--si-text-muted)]'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              isSelected ? 'text-[var(--si-text-primary)]' : 'text-[var(--si-text-secondary)]'
                            }`}>
                              {cmd.label}
                            </p>
                            {cmd.description && (
                              <p className="text-xs text-[var(--si-text-muted)] truncate">
                                {cmd.description}
                              </p>
                            )}
                          </div>
                          {cmd.shortcut && (
                            <kbd className="px-2 py-1 text-xs font-mono bg-[var(--si-surface-interactive)] border border-[var(--si-border)] rounded text-[var(--si-text-muted)]">
                              {cmd.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-[var(--si-border)] bg-[var(--si-surface-elevated)]">
              <div className="flex items-center justify-between text-xs text-[var(--si-text-muted)]">
                <div className="flex items-center gap-4">
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-[var(--si-surface-interactive)] rounded text-[10px]">↑↓</kbd> Navigate
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-[var(--si-surface-interactive)] rounded text-[10px]">↵</kbd> Select
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-[var(--si-surface-interactive)] rounded text-[10px]">Esc</kbd> Close
                  </span>
                </div>
                <span>{flatCommands.length} command{flatCommands.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
