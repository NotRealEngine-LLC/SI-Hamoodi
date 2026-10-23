// HAMOODI SyntheTech Intelligence — Tool Explorer
// Phase 08: Interactive tool testing and inspection interface

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Loader2, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronRight, Copy, Trash2, Eye
} from 'lucide-react';
import { useIntegrations } from '../contexts/IntegrationsContext';
import type { MCPToolDefinition, IntegrationConnection } from '../lib/mcp/types';

export function ToolExplorer() {
  const { connections, toolCatalog, isLoadingTools } = useIntegrations();
  const [selectedConnection, setSelectedConnection] = useState<IntegrationConnection | null>(null);
  const [selectedTool, setSelectedTool] = useState<MCPToolDefinition | null>(null);
  const [toolInput, setToolInput] = useState<string>('{}');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [showInputHelp, setShowInputHelp] = useState(false);

  // Filter tools by selected connection
  const availableTools = selectedConnection
    ? toolCatalog.filter(t => t.namespaced_id.startsWith(`${selectedConnection.id}:`))
    : toolCatalog;

  const handleExecuteTool = async () => {
    if (!selectedTool) return;

    setIsExecuting(true);
    setExecutionResult(null);
    setExecutionError(null);

    try {
      // Parse input JSON
      let input;
      try {
        input = JSON.parse(toolInput);
      } catch (e) {
        throw new Error('Invalid JSON input');
      }

      // Execute tool via gateway
      const { toolsGateway } = await import('../lib/mcp/tools-gateway');
      const result = await toolsGateway.executeTool({
        toolNamespacedId: selectedTool.namespaced_id,
        input,
        context: {
          userId: 'current-user', // Would come from auth context
          workspaceId: selectedConnection?.workspace_id,
        },
      });

      if (result.success) {
        setExecutionResult(result.output);
      } else {
        setExecutionError(result.error?.message || 'Tool execution failed');
      }
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyResult = () => {
    if (executionResult) {
      navigator.clipboard.writeText(JSON.stringify(executionResult, null, 2));
    }
  };

  const formatJson = (obj: any): string => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'read': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'write': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'sensitive': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'high_risk': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Play size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tool Explorer</h1>
            <p className="text-sm text-zinc-500">Test and inspect available MCP tools</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tool List */}
        <div className="w-80 border-r border-zinc-800/50 flex flex-col">
          {/* Connection Filter */}
          <div className="p-4 border-b border-zinc-800/50">
            <label className="block text-xs font-medium text-zinc-400 mb-2">Connection</label>
            <select
              value={selectedConnection?.id || ''}
              onChange={e => {
                const conn = connections.find(c => c.id === e.target.value);
                setSelectedConnection(conn || null);
                setSelectedTool(null);
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">All Connections</option>
              {connections.map(conn => (
                <option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.status})
                </option>
              ))}
            </select>
          </div>

          {/* Tool List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingTools ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-blue-400" />
              </div>
            ) : availableTools.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No tools available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setSelectedTool(tool);
                      setToolInput('{}');
                      setExecutionResult(null);
                      setExecutionError(null);
                    }}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedTool?.id === tool.id
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-zinc-800/30 border-zinc-700/30 hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-medium text-white truncate flex-1">
                        {tool.display_name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${getRiskBadgeColor(tool.risk_level)}`}>
                        {tool.risk_level}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{tool.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Tool Details & Execution */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedTool ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Eye size={48} className="text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-400 mb-2">Select a Tool</h3>
                <p className="text-sm text-zinc-500">Choose a tool from the list to inspect and test it</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tool Info */}
              <div className="p-6 border-b border-zinc-800/50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-2">{selectedTool.display_name}</h2>
                    <p className="text-sm text-zinc-400 mb-3">{selectedTool.description}</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRiskBadgeColor(selectedTool.risk_level)}`}>
                        {selectedTool.risk_level.toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-500">
                        ID: {selectedTool.namespaced_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Schema Viewer */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowInputHelp(!showInputHelp)}
                    className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                  >
                    {showInputHelp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span>Input Schema</span>
                  </button>
                  <AnimatePresence>
                    {showInputHelp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800/50"
                      >
                        <pre className="text-xs text-zinc-300 overflow-x-auto">
                          {formatJson(selectedTool.input_schema)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Execution Panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Input */}
                <div className="p-6 border-b border-zinc-800/50">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Tool Input (JSON)
                  </label>
                  <textarea
                    value={toolInput}
                    onChange={e => setToolInput(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full h-32 px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-zinc-500">
                      {selectedTool.risk_level === 'sensitive' || selectedTool.risk_level === 'high_risk'
                        ? '⚠️ This tool requires approval before execution'
                        : '✓ This tool can be executed directly'}
                    </p>
                    <button
                      onClick={handleExecuteTool}
                      disabled={isExecuting}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
                    >
                      {isExecuting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Executing...</span>
                        </>
                      ) : (
                        <>
                          <Play size={14} />
                          <span>Execute Tool</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Output */}
                <div className="flex-1 overflow-y-auto p-6">
                  {executionError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-400 mb-1">Execution Failed</p>
                          <p className="text-xs text-red-300">{executionError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {executionResult && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">Execution Successful</span>
                        </div>
                        <button
                          onClick={handleCopyResult}
                          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-all"
                        >
                          <Copy size={12} />
                          <span>Copy</span>
                        </button>
                      </div>
                      <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                        <pre className="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                          {formatJson(executionResult)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {!executionResult && !executionError && (
                    <div className="text-center py-12">
                      <Play size={32} className="text-zinc-700 mx-auto mb-3" />
                      <p className="text-sm text-zinc-500">Execute the tool to see results</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
