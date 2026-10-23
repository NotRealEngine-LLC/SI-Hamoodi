// HAMOODI SyntheTech Intelligence — Message Component
// Phase 05: Advanced message rendering with Markdown

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, RefreshCw, Edit3, GitBranch, Check, User, Bot } from 'lucide-react';
import type { Message } from '../../contexts/WorkspaceContext';

interface SIMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onBranch?: () => void;
  isStreaming?: boolean;
}

export function SIMessage({ message, onRegenerate, onEdit, onBranch, isStreaming }: SIMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Assistant avatar */}
      {isAssistant && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center shrink-0">
          <Bot size={14} className="text-violet-400" />
        </div>
      )}

      {/* Message content */}
      <div className={`max-w-[70%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm ${
            isUser
              ? 'bg-violet-600 text-white rounded-br-md'
              : 'bg-zinc-800 text-zinc-200 rounded-bl-md border border-zinc-700/50'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    return isInline ? (
                      <code className="bg-zinc-900/50 px-1.5 py-0.5 rounded text-violet-300 text-xs" {...props}>
                        {children}
                      </code>
                    ) : (
                      <div className="my-3 rounded-lg overflow-hidden border border-zinc-700/50">
                        <div className="bg-zinc-900/80 px-3 py-1.5 text-[10px] text-zinc-500 border-b border-zinc-700/50">
                          {match?.[1] || 'code'}
                        </div>
                        <pre className="bg-zinc-900/50 p-3 overflow-x-auto">
                          <code className="text-xs text-zinc-300" {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                  p({ children }) {
                    return <p className="mb-2 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-2 border-violet-500/50 pl-3 my-2 text-zinc-400 italic">
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-3 overflow-x-auto">
                        <table className="min-w-full border border-zinc-700/50 text-xs">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border border-zinc-700/50 bg-zinc-900/50 px-3 py-1.5 text-left font-medium text-zinc-300">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border border-zinc-700/50 px-3 py-1.5 text-zinc-400">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Streaming indicator */}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-1" />
          )}
        </div>

        {/* Message actions */}
        {isAssistant && !isStreaming && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-zinc-800 rounded transition-all"
              title="Copy"
            >
              {copied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} className="text-zinc-500" />
              )}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 hover:bg-zinc-800 rounded transition-all"
                title="Regenerate"
              >
                <RefreshCw size={12} className="text-zinc-500" />
              </button>
            )}
            {onBranch && (
              <button
                onClick={onBranch}
                className="p-1.5 hover:bg-zinc-800 rounded transition-all"
                title="Branch from here"
              >
                <GitBranch size={12} className="text-zinc-500" />
              </button>
            )}
          </div>
        )}

        {isUser && onEdit && (
          <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-zinc-800 rounded transition-all"
              title="Edit"
            >
              <Edit3 size={12} className="text-zinc-500" />
            </button>
          </div>
        )}

        {/* Status indicator */}
        {message.status === 'failed' && (
          <p className="text-xs text-red-400 mt-1">⚠️ Failed to generate</p>
        )}
        {message.status === 'cancelled' && (
          <p className="text-xs text-amber-400 mt-1">⚠️ Generation cancelled</p>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
          <User size={14} className="text-zinc-300" />
        </div>
      )}
    </motion.div>
  );
}
