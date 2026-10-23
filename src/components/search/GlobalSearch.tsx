// HAMOODI SyntheTech Intelligence — Global Search System
// Part 02: Comprehensive search across workspace

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, FolderKanban, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { projectRepository } from '../../lib/repositories/ProjectRepository';
import { conversationRepository } from '../../lib/repositories/ConversationRepository';

interface SearchResult {
  id: string;
  type: 'project' | 'conversation';
  title: string;
  description?: string;
  updatedAt: string;
  icon?: string;
  color?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search projects
        const projects = await projectRepository.search(query);
        projects.forEach(project => {
          searchResults.push({
            id: project.id,
            type: 'project',
            title: project.name,
            description: project.description,
            updatedAt: project.updatedAt,
            icon: project.icon,
            color: project.color,
          });
        });

        // Search conversations
        const conversations = await conversationRepository.search(query);
        conversations.forEach((conversation: any) => {
          searchResults.push({
            id: conversation.id,
            type: 'conversation',
            title: conversation.title,
            description: conversation.summary,
            updatedAt: conversation.updatedAt,
          });
        });

        // Sort by most recent
        searchResults.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        setResults(searchResults.slice(0, 10)); // Limit to 10 results
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'project') {
      navigate(`/projects/${result.id}`);
    } else if (result.type === 'conversation') {
      navigate(`/chat/${result.id}`);
    }
    onClose();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="bg-[#9378ff]/20 text-[#9378ff] rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
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

          {/* Search modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--si-border)]">
              <Search size={20} className="text-[var(--si-text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search projects, conversations..."
                className="flex-1 bg-transparent text-[var(--si-text-primary)] placeholder-[var(--si-text-muted)] focus:outline-none text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-[var(--si-surface-interactive)] rounded transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} className="text-[var(--si-text-muted)]" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-6 h-6 border-2 border-[#9378ff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-[var(--si-text-muted)]">Searching...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  {query.trim() ? (
                    <>
                      <Search size={32} className="text-[var(--si-text-muted)] mx-auto mb-3" />
                      <p className="text-sm text-[var(--si-text-muted)]">
                        No results found for "{query}"
                      </p>
                    </>
                  ) : (
                    <>
                      <Search size={32} className="text-[var(--si-text-muted)] mx-auto mb-3" />
                      <p className="text-sm text-[var(--si-text-muted)]">
                        Start typing to search
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <motion.button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectResult(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full px-6 py-3 flex items-center gap-4 text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-[var(--si-surface-interactive)]'
                          : 'hover:bg-[var(--si-surface-interactive)]/50'
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        result.type === 'project'
                          ? 'bg-[#9378ff]/10'
                          : 'bg-[#52dad5]/10'
                      }`}>
                        {result.type === 'project' ? (
                          <span className="text-xl">{result.icon || '📁'}</span>
                        ) : (
                          <MessageSquare size={18} className="text-[#52dad5]" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-[var(--si-text-primary)] truncate">
                            {highlightMatch(result.title, query)}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            result.type === 'project'
                              ? 'bg-[#9378ff]/10 text-[#9378ff]'
                              : 'bg-[#52dad5]/10 text-[#52dad5]'
                          }`}>
                            {result.type}
                          </span>
                        </div>
                        {result.description && (
                          <p className="text-xs text-[var(--si-text-muted)] truncate">
                            {highlightMatch(result.description, query)}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      {index === selectedIndex && (
                        <ArrowRight size={16} className="text-[var(--si-text-muted)] flex-shrink-0" />
                      )}
                    </motion.button>
                  ))}
                </div>
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
                    <kbd className="px-1.5 py-0.5 bg-[var(--si-surface-interactive)] rounded text-[10px]">↵</kbd> Open
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-[var(--si-surface-interactive)] rounded text-[10px]">Esc</kbd> Close
                  </span>
                </div>
                {results.length > 0 && (
                  <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
