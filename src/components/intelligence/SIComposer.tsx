// HAMOODI SyntheTech Intelligence — Composer Component
// Phase 05: Advanced message composer with presets

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Square, Sparkles } from 'lucide-react';
import { SIModelPicker } from './SIModelPicker';
import type { AIPreset } from '../../lib/intelligence/types';

interface SIComposerProps {
  onSend: (message: string, preset?: AIPreset) => void;
  onCancel: () => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const PRESETS: { id: AIPreset; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '💬' },
  { id: 'concise', label: 'Concise', icon: '⚡' },
  { id: 'detailed', label: 'Detailed', icon: '📝' },
  { id: 'creative', label: 'Creative', icon: '🎨' },
  { id: 'technical', label: 'Technical', icon: '🔧' },
  { id: 'research', label: 'Research', icon: '🔬' },
];

export function SIComposer({ onSend, onCancel, isGenerating, disabled = false }: SIComposerProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [selectedPreset, setSelectedPreset] = useState<AIPreset>('general');
  const [showPresets, setShowPresets] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isGenerating || disabled) return;
    onSend(input.trim(), selectedPreset);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-zinc-800/50 bg-zinc-900/30">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/30">
        <SIModelPicker
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          compact
        />

        {/* Preset selector */}
        <div className="relative">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs transition-all"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span className="text-zinc-300">
              {PRESETS.find(p => p.id === selectedPreset)?.label || 'General'}
            </span>
          </button>

          {showPresets && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowPresets(false)} />
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-700/50 rounded-lg shadow-xl overflow-hidden z-50"
              >
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      setShowPresets(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-all ${
                      selectedPreset === preset.id
                        ? 'bg-violet-500/10 text-violet-300'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Status indicator */}
        {isGenerating && (
          <div className="flex items-center gap-2 text-xs text-violet-400">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span>Generating...</span>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex gap-2 p-4">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          disabled={disabled || isGenerating}
          rows={1}
          className="flex-1 px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none disabled:opacity-50"
          style={{ minHeight: '44px', maxHeight: '200px' }}
        />

        {isGenerating ? (
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all flex items-center gap-2"
          >
            <Square size={16} />
            <span className="hidden sm:inline">Stop</span>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
