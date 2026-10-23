// HAMOODI SyntheTech Intelligence — Knowledge Search UI
// Phase 07: Sophisticated knowledge search interface

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, BookOpen, FileText, Brain, 
  Loader2, AlertCircle, ChevronDown, ExternalLink
} from 'lucide-react';
import { useMemory } from '../contexts/MemoryContext';
import { retrievalService } from '../lib/memory/retrieval-service';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import type { KnowledgeResult, SearchMode } from '../lib/memory/types';

export function KnowledgeSearchUI() {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspaceManagement();
  const { knowledgeSources, isLoadingSources } = useMemory();
  
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('hybrid');
  const [results, setResults] = useState<KnowledgeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [maxResults, setMaxResults] = useState(10);

  const handleSearch = async () => {
    if (!query.trim() || !user || !currentWorkspace) return;

    setIsSearching(true);
    setError(null);

    try {
      const searchResults = await retrievalService.search(user.id, {
        query: query.trim(),
        workspaceId: currentWorkspace.id,
        sourceIds: selectedSources.length > 0 ? selectedSources : undefined,
        maxResults,
        mode: searchMode,
      });

      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSources(prev => 
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Search size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Search</h1>
            <p className="text-sm text-zinc-500">Search your workspace knowledge base</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Search knowledge..."
            className="w-full pl-12 pr-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Search Controls */}
        <div className="flex items-center gap-3 mt-4">
          {/* Search Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Mode:</span>
            <div className="flex gap-1">
              {(['keyword', 'semantic', 'hybrid'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setSearchMode(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    searchMode === mode
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Max Results */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Results:</span>
            <select
              value={maxResults}
              onChange={e => setMaxResults(Number(e.target.value))}
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 transition-all"
          >
            <Filter size={14} />
            <span>Filters</span>
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
          >
            {isSearching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            <span>Search</span>
          </button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl"
            >
              <h3 className="text-sm font-medium text-zinc-300 mb-3">Filter by Source</h3>
              {isLoadingSources ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-blue-400" />
                </div>
              ) : knowledgeSources.length === 0 ? (
                <p className="text-xs text-zinc-500">No knowledge sources available</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {knowledgeSources.map(source => (
                    <label
                      key={source.id}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => toggleSource(source.id)}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                      />
                      <FileText size={14} className="text-zinc-400" />
                      <span className="text-sm text-zinc-300 flex-1">{source.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        source.index_status === 'ready'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {source.index_status}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 size={32} className="animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Searching knowledge...</p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={48} className="text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">
              {query ? 'No matching knowledge found' : 'Start searching'}
            </h3>
            <p className="text-sm text-zinc-500">
              {query
                ? 'Try adjusting your search query or filters'
                : 'Enter a query to search your workspace knowledge'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 mb-2">
              Found {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((result, index) => (
              <motion.div
                key={result.chunkId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl hover:bg-zinc-800/50 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-blue-400" />
                      <h4 className="text-sm font-medium text-white">{result.title}</h4>
                    </div>
                    {result.reference && (
                      <p className="text-xs text-zinc-500 mb-2">{result.reference}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {result.similarity !== undefined && (
                      <span className="text-xs text-zinc-500">
                        {(result.similarity * 100).toFixed(1)}% match
                      </span>
                    )}
                    <button className="p-1.5 hover:bg-zinc-700 rounded transition-all" title="Open source">
                      <ExternalLink size={14} className="text-zinc-400" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-zinc-300 line-clamp-3">{result.content}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
