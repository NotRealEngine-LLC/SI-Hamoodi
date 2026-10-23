// HAMOODI SyntheTech Intelligence — Error Panel
// Phase 05: Display AI generation errors with recovery options

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, X, AlertTriangle } from 'lucide-react';

interface SIErrorPanelProps {
  error: string | null;
  errorCode?: string;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  AUTH_REQUIRED: {
    title: 'Authentication Required',
    message: 'Please sign in to Puter.js to use AI features.',
  },
  MODEL_NOT_FOUND: {
    title: 'Model Unavailable',
    message: 'The selected model is temporarily unavailable. Please try another model.',
  },
  CAPABILITY_NOT_SUPPORTED: {
    title: 'Feature Not Supported',
    message: 'The selected model does not support this feature. Try a different model.',
  },
  CONTEXT_OVERFLOW: {
    title: 'Context Too Large',
    message: 'The conversation is too long for this model. Start a new conversation or use a model with larger context.',
  },
  RATE_LIMITED: {
    title: 'Rate Limited',
    message: 'Too many requests. Please wait a moment and try again.',
  },
  GENERATION_CANCELLED: {
    title: 'Generation Cancelled',
    message: 'The AI response was cancelled.',
  },
  GENERATION_FAILED: {
    title: 'Generation Failed',
    message: 'The AI request failed. Please try again.',
  },
  STREAM_ERROR: {
    title: 'Connection Interrupted',
    message: 'The connection was interrupted. The partial response has been preserved.',
  },
};

export function SIErrorPanel({
  error,
  errorCode,
  retryable = false,
  onRetry,
  onDismiss,
}: SIErrorPanelProps) {
  if (!error) return null;

  const errorInfo = errorCode ? ERROR_MESSAGES[errorCode] : null;
  const title = errorInfo?.title || 'Error';
  const message = errorInfo?.message || error;

  const isWarning = errorCode === 'GENERATION_CANCELLED' || errorCode === 'STREAM_ERROR';
  const Icon = isWarning ? AlertTriangle : AlertCircle;
  const iconColor = isWarning ? 'text-amber-400' : 'text-red-400';
  const bgColor = isWarning ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
  const textColor = isWarning ? 'text-amber-400' : 'text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex items-start gap-3 p-4 ${bgColor} border rounded-xl`}
    >
      <Icon size={18} className={`${iconColor} shrink-0 mt-0.5`} />
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${textColor} mb-1`}>{title}</p>
        <p className="text-xs text-zinc-400">{message}</p>
        
        {retryable && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-lg text-xs text-zinc-300 transition-all"
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        )}
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-zinc-800/50 rounded transition-all"
        >
          <X size={14} className="text-zinc-500" />
        </button>
      )}
    </motion.div>
  );
}
