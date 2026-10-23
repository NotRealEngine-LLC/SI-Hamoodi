// HAMOODI SyntheTech Intelligence — Usage Indicator
// Phase 05: Display token usage and cost information

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, DollarSign } from 'lucide-react';

interface SIUsageIndicatorProps {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  currency?: string;
  durationMs?: number;
  compact?: boolean;
}

export function SIUsageIndicator({
  inputTokens,
  outputTokens,
  totalTokens,
  estimatedCost,
  currency = 'USD',
  durationMs,
  compact = false,
}: SIUsageIndicatorProps) {
  if (!totalTokens && !estimatedCost && !durationMs) {
    return null;
  }

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(cost);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
        {totalTokens && (
          <div className="flex items-center gap-1">
            <Zap size={9} className="text-zinc-600" />
            <span>{formatTokens(totalTokens)} tokens</span>
          </div>
        )}
        {durationMs && (
          <span>{formatDuration(durationMs)}</span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-3 text-[10px] text-zinc-500 px-3 py-1.5 bg-zinc-800/30 rounded-lg"
    >
      {inputTokens !== undefined && outputTokens !== undefined && (
        <div className="flex items-center gap-1">
          <Zap size={10} className="text-zinc-600" />
          <span>{formatTokens(inputTokens)} in / {formatTokens(outputTokens)} out</span>
        </div>
      )}

      {totalTokens && !inputTokens && (
        <div className="flex items-center gap-1">
          <Zap size={10} className="text-zinc-600" />
          <span>{formatTokens(totalTokens)} tokens</span>
        </div>
      )}

      {estimatedCost !== undefined && estimatedCost > 0 && (
        <div className="flex items-center gap-1">
          <DollarSign size={10} className="text-zinc-600" />
          <span>{formatCost(estimatedCost)}</span>
          <span className="text-zinc-700">(estimated)</span>
        </div>
      )}

      {durationMs && (
        <span>{formatDuration(durationMs)}</span>
      )}
    </motion.div>
  );
}
