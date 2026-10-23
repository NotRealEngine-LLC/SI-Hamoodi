// HAMOODI SyntheTech Intelligence — Integrations Hub UI
// Phase 08: Integration management interface

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Plug, Plus, CheckCircle, XCircle, AlertCircle, Loader2,
  ExternalLink, RefreshCw, Trash2, Settings, Zap, Shield, Play
} from 'lucide-react';
import { useIntegrations } from '../contexts/IntegrationsContext';
import type { IntegrationConnection, IntegrationProvider } from '../lib/mcp/types';

export function IntegrationsHub() {
  const navigate = useNavigate();
  const { 
    providers, connections, toolCatalog, executionHistory,
    isLoadingProviders, isLoadingConnections, isLoadingTools,
    createConnection, connectToServer, disconnectFromServer, deleteConnection,
    error, clearError
  } = useIntegrations();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [newConnectionName, setNewConnectionName] = useState('');
  const [newConnectionEndpoint, setNewConnectionEndpoint] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateConnection = async () => {
    if (!selectedProvider || !newConnectionName.trim()) return;

    setIsCreating(true);
    try {
      const connection = await createConnection({
        provider_id: selectedProvider.id,
        name: newConnectionName,
        mcp_endpoint: newConnectionEndpoint || undefined,
      });

      if (selectedProvider.auth_type === 'oauth2') {
        // Redirect to OAuth flow
        const authUrl = await useIntegrations().startOAuthFlow(connection.id, selectedProvider);
        window.location.href = authUrl;
      } else {
        // Connect directly
        await connectToServer(connection.id);
      }

      setShowAddModal(false);
      setNewConnectionName('');
      setNewConnectionEndpoint('');
      setSelectedProvider(null);
    } catch (err) {
      console.error('Failed to create connection:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle size={16} className="text-emerald-400" />;
      case 'disconnected': return <XCircle size={16} className="text-zinc-400" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      case 'connecting': return <Loader2 size={16} className="text-violet-400 animate-spin" />;
      default: return <AlertCircle size={16} className="text-amber-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-emerald-400';
      case 'disconnected': return 'text-zinc-400';
      case 'failed': return 'text-red-400';
      case 'connecting': return 'text-violet-400';
      default: return 'text-amber-400';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Plug size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SI Integrations</h1>
              <p className="text-sm text-zinc-500">Connect trusted tools and extend what your intelligence can do</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus size={16} />
            Add Integration
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-8 pt-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button onClick={clearError} className="text-zinc-500 hover:text-zinc-300">
              <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Connected Services */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-violet-400" />
            Connected Services ({connections.length})
          </h2>

          {isLoadingConnections ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-violet-400" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
              <Plug size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 mb-4">No integrations connected yet</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-all"
              >
                Add Your First Integration
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map(connection => (
                <ConnectionCard
                  key={connection.id}
                  connection={connection}
                  onConnect={() => connectToServer(connection.id)}
                  onDisconnect={() => disconnectFromServer(connection.id)}
                  onDelete={() => deleteConnection(connection.id)}
                  statusIcon={getStatusIcon(connection.status)}
                  statusColor={getStatusColor(connection.status)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Available Tools */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield size={18} className="text-emerald-400" />
              Available Tools ({toolCatalog.length})
            </h2>
            <button
              onClick={() => navigate('/integrations/tools')}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-all"
            >
              <Play size={12} />
              <span>Open Tool Explorer</span>
            </button>
          </div>

          {isLoadingTools ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
            </div>
          ) : toolCatalog.length === 0 ? (
            <div className="text-center py-8 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
              <p className="text-sm text-zinc-500">No tools available. Connect an integration to discover tools.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {toolCatalog.slice(0, 12).map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <RefreshCw size={18} className="text-blue-400" />
            Recent Activity
          </h2>

          {executionHistory.length === 0 ? (
            <div className="text-center py-8 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
              <p className="text-sm text-zinc-500">No tool executions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {executionHistory.slice(0, 10).map(event => (
                <div
                  key={event.id}
                  className="p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-300 truncate">{event.tool_namespaced_id}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(event.created_at).toLocaleString()} • {event.status}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    event.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                    event.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {event.duration_ms}ms
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add Integration Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddIntegrationModal
            providers={providers}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            connectionName={newConnectionName}
            onConnectionNameChange={setNewConnectionName}
            connectionEndpoint={newConnectionEndpoint}
            onConnectionEndpointChange={setNewConnectionEndpoint}
            onConfirm={handleCreateConnection}
            onClose={() => {
              setShowAddModal(false);
              setSelectedProvider(null);
              setNewConnectionName('');
              setNewConnectionEndpoint('');
            }}
            isCreating={isCreating}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Connection Card Component
function ConnectionCard({
  connection,
  onConnect,
  onDisconnect,
  onDelete,
  statusIcon,
  statusColor,
}: {
  connection: IntegrationConnection;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  statusIcon: React.ReactNode;
  statusColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Plug size={18} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">{connection.name}</h3>
            <p className="text-xs text-zinc-500">{connection.provider?.display_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className={`text-xs capitalize ${statusColor}`}>{connection.status}</span>
        </div>
      </div>

      {connection.description && (
        <p className="text-xs text-zinc-400 mb-3">{connection.description}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
        {connection.mcp_endpoint && (
          <span className="truncate">{connection.mcp_endpoint}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {connection.status !== 'connected' && (
          <button
            onClick={onConnect}
            className="flex-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-all"
          >
            Connect
          </button>
        )}
        {connection.status === 'connected' && (
          <button
            onClick={onDisconnect}
            className="flex-1 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs rounded-lg transition-all"
          >
            Disconnect
          </button>
        )}
        <button
          onClick={onDelete}
          className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs rounded-lg transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// Tool Card Component
function ToolCard({ tool }: { tool: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg hover:bg-zinc-800/50 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-white truncate flex-1">{tool.display_name}</h4>
        <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${
          tool.risk_level === 'read' ? 'bg-emerald-500/10 text-emerald-400' :
          tool.risk_level === 'write' ? 'bg-amber-500/10 text-amber-400' :
          'bg-red-500/10 text-red-400'
        }`}>
          {tool.risk_level}
        </span>
      </div>
      <p className="text-xs text-zinc-400 line-clamp-2">{tool.description}</p>
    </motion.div>
  );
}

// Add Integration Modal
function AddIntegrationModal({
  providers,
  selectedProvider,
  onSelectProvider,
  connectionName,
  onConnectionNameChange,
  connectionEndpoint,
  onConnectionEndpointChange,
  onConfirm,
  onClose,
  isCreating,
}: any) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Add Integration</h2>

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Select Provider</label>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {providers.map((provider: IntegrationProvider) => (
                <button
                  key={provider.id}
                  onClick={() => onSelectProvider(provider)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedProvider?.id === provider.id
                      ? 'bg-violet-500/10 border-violet-500/50'
                      : 'bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50'
                  }`}
                >
                  <p className="text-sm font-medium text-white">{provider.display_name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{provider.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Connection Details */}
          {selectedProvider && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Connection Name</label>
                <input
                  type="text"
                  value={connectionName}
                  onChange={e => onConnectionNameChange(e.target.value)}
                  placeholder="My Integration"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              {selectedProvider.category === 'mcp' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">MCP Endpoint</label>
                  <input
                    type="url"
                    value={connectionEndpoint}
                    onChange={e => onConnectionEndpointChange(e.target.value)}
                    placeholder="https://mcp.example.com"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedProvider || !connectionName.trim() || isCreating}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-all flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Add Integration</span>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
