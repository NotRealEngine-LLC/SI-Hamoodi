// HAMOODI SyntheTech Intelligence — Model Picker Component
// Phase 05: Advanced model selection UI

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Star, Zap, Brain, Eye, Check } from 'lucide-react';
import { useIntelligence } from '../../contexts/IntelligenceContext';
import type { AIModel } from '../../lib/intelligence/types';

interface SIModelPickerProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
}

export function SIModelPicker({ selectedModel, onModelChange, compact = false }: SIModelPickerProps) {
  const { models } = useIntelligence();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'fast' | 'advanced'>('all');

  const currentModel = models.find(m => m.id === selectedModel);

  const filteredModels = models.filter(model => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!model.displayName.toLowerCase().includes(query) &&
          !model.providerName.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Category filter
    switch (filter) {
      case 'fast':
        return model.capabilities.streaming === 'supported' && 
               (model.contextWindow || 0) < 100000;
      case 'advanced':
        return model.capabilities.reasoning === 'supported' ||
               model.capabilities.tool_calling === 'supported';
      case 'favorites':
        // TODO: Implement favorites from user preferences
        return true;
      default:
        return true;
    }
  });

  const getModelIcon = (model: AIModel) => {
    if (model.capabilities.reasoning === 'supported') {
      return <Brain size={14} className="text-violet-400" />;
    }
    if (model.capabilities.tool_calling === 'supported') {
      return <Zap size={14} className="text-amber-400" />;
    }
    if (model.capabilities.image_input === 'supported') {
      return <Eye size={14} className="text-blue-400" />;
    }
    return <Zap size={14} className="text-zinc-400" />;
  };

  if (compact) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs transition-all"
      >
        {currentModel && getModelIcon(currentModel)}
        <span className="text-zinc-300">{currentModel?.displayName || 'Select Model'}</span>
        <ChevronDown size={12} className="text-zinc-500" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-sm transition-all"
      >
        {currentModel && getModelIcon(currentModel)}
        <span className="text-zinc-300">{currentModel?.displayName || 'Select Model'}</span>
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
              className="absolute top-full left-0 mt-2 w-80 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {/* Search */}
              <div className="p-3 border-b border-zinc-800">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search models..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-1 p-2 border-b border-zinc-800">
                {(['all', 'fast', 'advanced'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                      filter === f
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Model List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredModels.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    No models found
                  </div>
                ) : (
                  filteredModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onModelChange(model.id);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                        selectedModel === model.id
                          ? 'bg-violet-500/10 border-l-2 border-violet-500'
                          : 'hover:bg-zinc-800/50 border-l-2 border-transparent'
                      }`}
                    >
                      {getModelIcon(model)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">
                            {model.displayName}
                          </span>
                          {selectedModel === model.id && (
                            <Check size={12} className="text-violet-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-zinc-500">{model.providerName}</span>
                          {model.contextWindow && (
                            <span className="text-[10px] text-zinc-600">
                              • {(model.contextWindow / 1000).toFixed(0)}K context
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-zinc-800 text-[10px] text-zinc-600 text-center">
                {models.length} models available via Puter.js
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
