// HAMOODI SyntheTech Intelligence — Generation Status
// Phase 05: Display generation lifecycle status

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Pause } from 'lucide-react';
import type { GenerationStatus } from '../../lib/intelligence/types';

interface SIGenerationStatusProps {
  status: GenerationStatus;
  modelName?: string;
}

const STATUS_CONFIG: Record<GenerationStatus, { icon: React.ElementType; color: string; label: string }> = {
  idle: { icon: Loader2, color: 'text-zinc-500', label: 'Ready' },
  preparing: { icon: Loader2, color: 'text-violet-400', label: 'Preparing...' },
  auth_required: { icon: Loader2, color: 'text-amber-400', label: 'Authentication Required' },
  queued: { icon: Loader2, color: 'text-blue-400', label: 'Queued...' },
  streaming: { icon: Loader2, color: 'text-violet-400', label: 'Generating...' },
  finalizing: { icon: Loader2, color: 'text-indigo-400', label: 'Finalizing...' },
  completed: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  cancelled: { icon: Pause, color: 'text-amber-400', label: 'Cancelled' },
};

export function SIGenerationStatus({ status, modelName }: SIGenerationStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const isAnimating = ['preparing', 'queued', 'streaming', 'finalizing'].includes(status);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-2 text-xs"
    >
      <Icon size={14} className={`${config.color} ${isAnimating ? 'animate-spin' : ''}`} />
      <span className={config.color}>{config.label}</span>
      {modelName && status === 'streaming' && (
        <span className="text-zinc-600">with {modelName}</span>
      )}
    </motion.div>
  );
}
