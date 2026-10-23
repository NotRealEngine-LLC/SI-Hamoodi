// HAMOODI SyntheTech Intelligence — Context Indicator
// Phase 05: Display active context scope

import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Zap, FileText, Globe } from 'lucide-react';

interface SIContextIndicatorProps {
  workspaceName?: string;
  hubName?: string;
  projectName?: string;
  hubInstructionsActive?: boolean;
}

export function SIContextIndicator({
  workspaceName,
  hubName,
  projectName,
  hubInstructionsActive = false,
}: SIContextIndicatorProps) {
  if (!workspaceName && !hubName && !projectName) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-[10px] text-zinc-500"
    >
      {workspaceName && (
        <div className="flex items-center gap-1">
          <Globe size={10} className="text-zinc-600" />
          <span>{workspaceName}</span>
        </div>
      )}

      {hubName && (
        <>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-violet-500" />
            <span>{hubName}</span>
          </div>
        </>
      )}

      {projectName && (
        <>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-1">
            <FolderOpen size={10} className="text-blue-500" />
            <span>{projectName}</span>
          </div>
        </>
      )}

      {hubInstructionsActive && (
        <div className="flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-violet-500/10 rounded text-violet-400">
          <FileText size={9} />
          <span>Hub instructions active</span>
        </div>
      )}
    </motion.div>
  );
}
