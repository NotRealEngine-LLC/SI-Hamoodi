// HAMOODI SyntheTech Intelligence — Knowledge Settings
// Phase 07: Memory and knowledge configuration

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Brain, Database, Shield, Eye, EyeOff,
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export interface KnowledgeSettings {
  // Retrieval Settings
  enableKnowledgeRetrieval: boolean;
  defaultSearchMode: 'keyword' | 'semantic' | 'hybrid';
  maxKnowledgeResults: number;
  maxMemoryResults: number;

  // Memory Settings
  enableMemorySuggestions: boolean;
  enableAutomaticMemoryCapture: boolean;
  defaultMemoryScope: 'personal' | 'workspace' | 'hub' | 'project';

  // Privacy Settings
  shareWorkspaceKnowledge: boolean;
  allowCrossWorkspaceSearch: boolean;
  enableEmbeddingGeneration: boolean;

  // Provider Settings
  embeddingProvider: 'supabase' | 'openai' | 'custom';
  discloseProviderUsage: boolean;
}

const defaultSettings: KnowledgeSettings = {
  enableKnowledgeRetrieval: true,
  defaultSearchMode: 'hybrid',
  maxKnowledgeResults: 5,
  maxMemoryResults: 3,
  enableMemorySuggestions: true,
  enableAutomaticMemoryCapture: false,
  defaultMemoryScope: 'personal',
  shareWorkspaceKnowledge: true,
  allowCrossWorkspaceSearch: false,
  enableEmbeddingGeneration: true,
  embeddingProvider: 'supabase',
  discloseProviderUsage: true,
};

export function KnowledgeSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<KnowledgeSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // In production, save to database
      // For now, just simulate save
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = <K extends keyof KnowledgeSettings>(
    key: K,
    value: KnowledgeSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Knowledge Settings</h1>
            <p className="text-sm text-zinc-500">Configure memory and knowledge preferences</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-3xl">
        {/* Retrieval Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database size={18} className="text-blue-400" />
            Retrieval Settings
          </h2>
          <div className="space-y-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
            <SettingToggle
              label="Enable Knowledge Retrieval"
              description="Allow AI to search your knowledge base when answering questions"
              checked={settings.enableKnowledgeRetrieval}
              onChange={value => updateSetting('enableKnowledgeRetrieval', value)}
            />

            <SettingSelect
              label="Default Search Mode"
              description="Choose how knowledge is searched by default"
              value={settings.defaultSearchMode}
              onChange={value => updateSetting('defaultSearchMode', value as any)}
              options={[
                { value: 'keyword', label: 'Keyword (Fast)' },
                { value: 'semantic', label: 'Semantic (Accurate)' },
                { value: 'hybrid', label: 'Hybrid (Balanced)' },
              ]}
            />

            <SettingSlider
              label="Max Knowledge Results"
              description="Maximum number of knowledge chunks to retrieve"
              value={settings.maxKnowledgeResults}
              onChange={value => updateSetting('maxKnowledgeResults', value)}
              min={1}
              max={20}
              step={1}
            />

            <SettingSlider
              label="Max Memory Results"
              description="Maximum number of memories to retrieve"
              value={settings.maxMemoryResults}
              onChange={value => updateSetting('maxMemoryResults', value)}
              min={1}
              max={10}
              step={1}
            />
          </div>
        </section>

        {/* Memory Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Brain size={18} className="text-violet-400" />
            Memory Settings
          </h2>
          <div className="space-y-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
            <SettingToggle
              label="Enable Memory Suggestions"
              description="Allow the system to suggest saving important information as memories"
              checked={settings.enableMemorySuggestions}
              onChange={value => updateSetting('enableMemorySuggestions', value)}
            />

            <SettingToggle
              label="Automatic Memory Capture"
              description="Automatically capture important decisions and outcomes (requires review)"
              checked={settings.enableAutomaticMemoryCapture}
              onChange={value => updateSetting('enableAutomaticMemoryCapture', value)}
            />

            <SettingSelect
              label="Default Memory Scope"
              description="Default scope for new memories"
              value={settings.defaultMemoryScope}
              onChange={value => updateSetting('defaultMemoryScope', value as any)}
              options={[
                { value: 'personal', label: 'Personal (Private)' },
                { value: 'workspace', label: 'Workspace (Shared)' },
                { value: 'hub', label: 'Hub (Team)' },
                { value: 'project', label: 'Project (Specific)' },
              ]}
            />
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={18} className="text-emerald-400" />
            Privacy Settings
          </h2>
          <div className="space-y-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
            <SettingToggle
              label="Share Workspace Knowledge"
              description="Allow workspace members to search shared knowledge"
              checked={settings.shareWorkspaceKnowledge}
              onChange={value => updateSetting('shareWorkspaceKnowledge', value)}
            />

            <SettingToggle
              label="Allow Cross-Workspace Search"
              description="Allow searching knowledge across multiple workspaces (if member)"
              checked={settings.allowCrossWorkspaceSearch}
              onChange={value => updateSetting('allowCrossWorkspaceSearch', value)}
            />

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-300 font-medium mb-1">Privacy Notice</p>
                  <p className="text-xs text-amber-200/80">
                    Knowledge retrieval may send document excerpts to AI providers for embedding generation.
                    Only authorized content within your workspace scope will be processed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Provider Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings size={18} className="text-cyan-400" />
            Provider Settings
          </h2>
          <div className="space-y-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6">
            <SettingToggle
              label="Enable Embedding Generation"
              description="Generate vector embeddings for semantic search"
              checked={settings.enableEmbeddingGeneration}
              onChange={value => updateSetting('enableEmbeddingGeneration', value)}
            />

            <SettingSelect
              label="Embedding Provider"
              description="Choose which provider generates embeddings"
              value={settings.embeddingProvider}
              onChange={value => updateSetting('embeddingProvider', value as any)}
              options={[
                { value: 'supabase', label: 'Supabase (Built-in)' },
                { value: 'openai', label: 'OpenAI (User Account)' },
                { value: 'custom', label: 'Custom Provider' },
              ]}
            />

            <SettingToggle
              label="Disclose Provider Usage"
              description="Show which provider is processing your content"
              checked={settings.discloseProviderUsage}
              onChange={value => updateSetting('discloseProviderUsage', value)}
            />

            {settings.discloseProviderUsage && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Eye size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-300 font-medium mb-1">Provider Disclosure</p>
                    <p className="text-xs text-blue-200/80">
                      Current provider: <strong>{settings.embeddingProvider}</strong>
                      <br />
                      Embeddings are generated using text-embedding-3-small model (1536 dimensions).
                      Content is processed securely and not stored beyond the embedding vectors.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
          <div className="flex items-center gap-2">
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-emerald-400"
              >
                <CheckCircle size={16} />
                <span className="text-sm">Settings saved</span>
              </motion.div>
            )}
            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-red-400"
              >
                <AlertCircle size={16} />
                <span className="text-sm">Failed to save</span>
              </motion.div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-violet-500/25"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Setting Components
function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-white mb-1">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-zinc-700'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  );
}

function SettingSelect({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-white mb-1">{label}</p>
      <p className="text-xs text-zinc-500 mb-2">{description}</p>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SettingSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-white">{label}</p>
        <span className="text-sm text-violet-400 font-medium">{value}</span>
      </div>
      <p className="text-xs text-zinc-500 mb-2">{description}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
      />
    </div>
  );
}
