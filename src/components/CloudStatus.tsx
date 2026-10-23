// HAMOODI SyntheTech Intelligence — Cloud Status Indicator
// Phase 03: Unified sync state display

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, HardDrive, Wifi } from 'lucide-react';

export type CloudStatus = 'local' | 'connecting' | 'connected' | 'saving' | 'saved' | 'offline' | 'error';

interface CloudStatusIndicatorProps {
  status: CloudStatus;
  compact?: boolean;
  className?: string;
}

const statusConfig: Record<CloudStatus, { icon: React.ElementType; color: string; label: string; bgColor: string }> = {
  local: { icon: HardDrive, color: 'text-amber-400', label: 'Local Only', bgColor: 'bg-amber-500/10' },
  connecting: { icon: RefreshCw, color: 'text-violet-400', label: 'Connecting...', bgColor: 'bg-violet-500/10' },
  connected: { icon: Cloud, color: 'text-emerald-400', label: 'Cloud Connected', bgColor: 'bg-emerald-500/10' },
  saving: { icon: RefreshCw, color: 'text-violet-400', label: 'Saving...', bgColor: 'bg-violet-500/10' },
  saved: { icon: CheckCircle, color: 'text-emerald-400', label: 'Saved', bgColor: 'bg-emerald-500/10' },
  offline: { icon: CloudOff, color: 'text-amber-400', label: 'Offline', bgColor: 'bg-amber-500/10' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Sync Error', bgColor: 'bg-red-500/10' },
};

export function CloudStatusIndicator({ status, compact = false, className = '' }: CloudStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const isAnimating = status === 'connecting' || status === 'saving';

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bgColor}`}
        title={config.label}
      >
        <Icon size={10} className={`${config.color} ${isAnimating ? 'animate-spin' : ''}`} />
        <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} border border-current/10 ${className}`}
    >
      <Icon size={12} className={`${config.color} ${isAnimating ? 'animate-spin' : ''}`} />
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </motion.div>
  );
}

// Save status badge for inline use
export function SaveBadge({ saved, saving }: { saved: boolean; saving?: boolean }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-violet-400">
        <RefreshCw size={9} className="animate-spin" /> Saving...
      </span>
    );
  }
  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
        <CheckCircle size={9} /> Saved
      </span>
    );
  }
  return null;
}
