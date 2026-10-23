// HAMOODI SyntheTech Intelligence — Global Search
// Phase 04: Cross-entity search within authorized workspace

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, FolderOpen, MessageSquare, Zap, File as FileIcon, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';

interface SearchResult {
  id: string;
  type: 'project' | 'conversation' | 'hub' | 'file';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  meta?: string;
}

type SearchFilter = 'all' | 'projects' | 'conversations' | 'hubs' | 'files';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { projects, conversations } = useWorkspace();
  const { hubs, currentWorkspace } = useWorkspaceManagement();

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase();
    const newResults: SearchResult[] = [];

    // Search projects
    if (filter === 'all' || filter === 'projects') {
      projects
        .filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(p => {
          newResults.push({
            id: p.id,
            type: 'project',
            title: p.name,
            subtitle: p.description || undefined,
            icon: FolderOpen,
            meta: p.is_pinned ? 'Pinned' : undefined,
          });
        });
    }

    // Search conversations
    if (filter === 'all' || filter === 'conversations') {
      conversations
        .filter(c => c.title.toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(c => {
          newResults.push({
            id: c.id,
            type: 'conversation',
            title: c.title,
            subtitle: `${c.messages.length} messages`,
            icon: MessageSquare,
            meta: c.is_pinned ? 'Pinned' : undefined,
          });
        });
    }

    // Search hubs
    if (filter === 'all' || filter === 'hubs') {
      hubs
        .filter(h => h.name.toLowerCase().includes(q) || (h.description || '').toLowerCase().includes(q))
        .slice(0, 5)
        .forEach(h => {
          newResults.push({
            id: h.id,
            type: 'hub',
            title: h.name,
            subtitle: h.description || undefined,
            icon: Zap,
            meta: h.visibility === 'restricted' ? 'Restricted' : undefined,
          });
        });
    }

    setResults(newResults);
    setSelectedIndex(0);
  }, [query, filter, projects, conversations, hubs]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    // Navigate based on result type
    switch (result.type) {
      case 'hub':
        navigate(`/hubs`);
        break;
      case 'file':
        navigate(`/files`);
        break;
      default:
        navigate('/workspace');
    }
  };

  const filters: { value: SearchFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'projects', label: 'Projects' },
    { value: 'conversations', label: 'Chats' },
    { value: 'hubs', label: 'Hubs' },
    { value: 'files', label: 'Files' },
  ];

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-sm text-zinc-400 transition-all w-full"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] text-zinc-500">
          <Command size={9} /> K
        </kbd>
      </button>

      {/* Search modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                <Search size={18} className="text-zinc-500" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Search ${currentWorkspace?.name || 'workspace'}...`}
                  className="flex-1 bg-transparent text-white text-sm placeholder-zinc-500 focus:outline-none"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-300"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 px-4 py-2 border-b border-zinc-800">
                {filters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                      filter === f.value
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto">
                {query && results.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500">
                    No results found for "{query}"
                  </div>
                ) : results.length > 0 ? (
                  <div className="py-2">
                    {results.map((result, i) => {
                      const Icon = result.icon;
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                            i === selectedIndex ? 'bg-violet-500/10' : 'hover:bg-zinc-800/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            result.type === 'project' ? 'bg-blue-500/10' :
                            result.type === 'conversation' ? 'bg-emerald-500/10' :
                            result.type === 'hub' ? 'bg-violet-500/10' :
                            'bg-amber-500/10'
                          }`}>
                            <Icon size={14} className={
                              result.type === 'project' ? 'text-blue-400' :
                              result.type === 'conversation' ? 'text-emerald-400' :
                              result.type === 'hub' ? 'text-violet-400' :
                              'text-amber-400'
                            } />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{result.title}</p>
                            {result.subtitle && (
                              <p className="text-xs text-zinc-500 truncate">{result.subtitle}</p>
                            )}
                          </div>
                          {result.meta && (
                            <span className="text-[10px] text-zinc-600 px-2 py-0.5 bg-zinc-800 rounded">
                              {result.meta}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-600 capitalize">{result.type}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500">
                    Start typing to search your workspace
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-600">
                <div className="flex items-center gap-3">
                  <span><kbd className="px-1 bg-zinc-800 rounded">↑↓</kbd> Navigate</span>
                  <span><kbd className="px-1 bg-zinc-800 rounded">↵</kbd> Open</span>
                  <span><kbd className="px-1 bg-zinc-800 rounded">esc</kbd> Close</span>
                </div>
                <span>Scoped to {currentWorkspace?.name || 'workspace'}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
