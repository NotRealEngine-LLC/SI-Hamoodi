// HAMOODI SyntheTech Intelligence — Task Graph Visualization
// Phase 06: Visual task dependency graph

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, Pause } from 'lucide-react';
import type { AgentTask } from './types';
import { progressCalculator } from './progress-calculator';

interface TaskGraphProps {
  tasks: AgentTask[];
  onTaskClick?: (taskId: string) => void;
  className?: string;
}

export function TaskGraph({ tasks, onTaskClick, className = '' }: TaskGraphProps) {
  // Calculate layout using topological sorting
  const layout = useMemo(() => {
    return calculateLayout(tasks);
  }, [tasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-emerald-400" />;
      case 'failed':
        return <XCircle size={16} className="text-red-400" />;
      case 'running':
        return <Loader2 size={16} className="text-violet-400 animate-spin" />;
      case 'pending':
      case 'ready':
        return <Clock size={16} className="text-zinc-400" />;
      case 'blocked':
      case 'awaiting_approval':
        return <Pause size={16} className="text-amber-400" />;
      case 'skipped':
        return <AlertCircle size={16} className="text-zinc-500" />;
      default:
        return <Clock size={16} className="text-zinc-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    return progressCalculator.getStatusColor(status);
  };

  const getStatusBgColor = (status: string) => {
    return progressCalculator.getStatusBgColor(status);
  };

  return (
    <div className={`relative ${className}`}>
      {/* SVG for dependency lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        {layout.edges.map((edge, i) => (
          <line
            key={i}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke="rgb(63 63 70)"
            strokeWidth="2"
            strokeDasharray={edge.dashed ? '5,5' : undefined}
          />
        ))}
      </svg>

      {/* Task nodes */}
      <div className="relative" style={{ zIndex: 1 }}>
        {layout.nodes.map((node) => {
          const task = tasks.find(t => t.id === node.taskId);
          if (!task) return null;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: node.level * 0.1 }}
              onClick={() => onTaskClick?.(task.id)}
              className={`absolute p-3 rounded-xl border cursor-pointer transition-all hover:scale-105 ${getStatusBgColor(task.status)} ${
                task.status === 'running' ? 'border-violet-500/50' : 'border-zinc-700/50'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: '200px',
              }}
            >
              <div className="flex items-start gap-2">
                {getStatusIcon(task.status)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${getStatusColor(task.status)}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1 capitalize">
                    {task.assignedRole} • {task.status}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

interface LayoutNode {
  taskId: string;
  x: number;
  y: number;
  level: number;
}

interface LayoutEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
}

function calculateLayout(tasks: AgentTask[]): { nodes: LayoutNode[]; edges: LayoutEdge[] } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  // Calculate levels using topological sort
  const levels = new Map<string, number>();
  const visited = new Set<string>();

  const calculateLevel = (taskId: string): number => {
    if (levels.has(taskId)) return levels.get(taskId)!;
    if (visited.has(taskId)) return 0; // Cycle detected

    visited.add(taskId);
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.dependencies.length === 0) {
      levels.set(taskId, 0);
      return 0;
    }

    const maxDepLevel = Math.max(...task.dependencies.map(dep => calculateLevel(dep)));
    const level = maxDepLevel + 1;
    levels.set(taskId, level);
    return level;
  };

  tasks.forEach(task => calculateLevel(task.id));

  // Group tasks by level
  const levelGroups = new Map<number, AgentTask[]>();
  tasks.forEach(task => {
    const level = levels.get(task.id) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(task);
  });

  // Position nodes
  const nodeWidth = 220;
  const nodeHeight = 80;
  const horizontalSpacing = 50;
  const verticalSpacing = 30;

  levelGroups.forEach((tasksInLevel, level) => {
    const levelWidth = tasksInLevel.length * (nodeWidth + horizontalSpacing) - horizontalSpacing;
    const startX = -levelWidth / 2;

    tasksInLevel.forEach((task, index) => {
      nodes.push({
        taskId: task.id,
        x: startX + index * (nodeWidth + horizontalSpacing),
        y: level * (nodeHeight + verticalSpacing),
        level,
      });
    });
  });

  // Create edges
  tasks.forEach(task => {
    const targetNode = nodes.find(n => n.taskId === task.id);
    if (!targetNode) return;

    task.dependencies.forEach(depId => {
      const sourceNode = nodes.find(n => n.taskId === depId);
      if (!sourceNode) return;

      edges.push({
        x1: sourceNode.x + nodeWidth / 2,
        y1: sourceNode.y + nodeHeight,
        x2: targetNode.x + nodeWidth / 2,
        y2: targetNode.y,
      });
    });
  });

  // Normalize positions to start at 0,0
  const minX = Math.min(...nodes.map(n => n.x));
  const minY = Math.min(...nodes.map(n => n.y));

  nodes.forEach(node => {
    node.x -= minX;
    node.y -= minY;
  });

  edges.forEach(edge => {
    edge.x1 -= minX;
    edge.y1 -= minY;
    edge.x2 -= minX;
    edge.y2 -= minY;
  });

  return { nodes, edges };
}
