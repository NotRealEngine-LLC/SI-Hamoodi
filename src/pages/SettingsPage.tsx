// HAMOODI SyntheTech Intelligence — Settings Page
// Part 01: Application preferences and settings

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Sun, 
  Monitor, 
  Zap, 
  Database, 
  Download, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { PreferencesRepository } from '../lib/repositories/PreferencesRepository';

export function SettingsPage() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [defaultModel, setDefaultModel] = useState('gpt-4o-mini');
  const [streamResponses, setStreamResponses] = useState(true);
  const [puterConnected, setPuterConnected] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const preferencesRepo = new PreferencesRepository();

  useEffect(() => {
    loadPreferences();
    checkPuterConnection();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await preferencesRepo.get();
      if (prefs) {
        setTheme(prefs.theme);
        setReducedMotion(prefs.reducedMotion);
        setSidebarCollapsed(prefs.sidebarCollapsed);
        setDefaultModel(prefs.defaultModel);
        setStreamResponses(prefs.streamResponses);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };

  const checkPuterConnection = async () => {
    if (typeof window !== 'undefined' && (window as any).puter) {
      try {
        const isSignedIn = await (window as any).puter.auth.isSignedIn();
        setPuterConnected(isSignedIn);
      } catch {
        setPuterConnected(false);
      }
    }
  };

  const savePreferences = async () => {
    setSaveStatus('saving');
    try {
      await preferencesRepo.save({
        theme,
        reducedMotion,
        sidebarCollapsed,
        defaultModel,
        streamResponses,
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await preferencesRepo.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hamoodi-si-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleClearData = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      await preferencesRepo.clearAll();
      setShowDeleteConfirm(false);
      await loadPreferences();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  useEffect(() => {
    // Apply theme
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('light', !prefersDark);
    } else {
      document.documentElement.classList.toggle('light', theme === 'light');
    }

    savePreferences();
  }, [theme, reducedMotion, sidebarCollapsed, defaultModel, streamResponses]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--si-text-primary)] mb-2">Settings</h1>
          <p className="text-sm text-[var(--si-text-muted)]">
            Customize your HAMOODI SI experience
          </p>
        </div>

        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              saveStatus === 'saved' 
                ? 'bg-[#59d9a7]/10 border border-[#59d9a7]/20' 
                : saveStatus === 'error'
                ? 'bg-[#ff6c7c]/10 border border-[#ff6c7c]/20'
                : 'bg-[#9378ff]/10 border border-[#9378ff]/20'
            }`}
          >
            {saveStatus === 'saved' && <CheckCircle size={18} className="text-[#59d9a7]" />}
            {saveStatus === 'error' && <AlertCircle size={18} className="text-[#ff6c7c]" />}
            {saveStatus === 'saving' && <div className="w-4 h-4 border-2 border-[#9378ff] border-t-transparent rounded-full animate-spin" />}
            <span className={`text-sm ${
              saveStatus === 'saved' ? 'text-[#59d9a7]' :
              saveStatus === 'error' ? 'text-[#ff6c7c]' :
              'text-[#9378ff]'
            }`}>
              {saveStatus === 'saved' && 'Settings saved'}
              {saveStatus === 'error' && 'Failed to save settings'}
              {saveStatus === 'saving' && 'Saving...'}
            </span>
          </motion.div>
        )}

        {/* Appearance Section */}
        <section className="mb-8 p-6 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl">
          <h2 className="text-lg font-semibold text-[var(--si-text-primary)] mb-4 flex items-center gap-2">
            <Sun size={18} className="text-[#9378ff]" />
            Appearance
          </h2>

          <div className="space-y-4">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-[var(--si-text-secondary)] mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as any)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                      theme === option.value
                        ? 'bg-[#9378ff]/10 border-[#9378ff]/50 text-[#9378ff]'
                        : 'bg-[var(--si-surface-interactive)] border-[var(--si-border)] text-[var(--si-text-secondary)] hover:border-[var(--si-border-hover)]'
                    }`}
                  >
                    <option.icon size={16} />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--si-text-primary)]">Reduced Motion</p>
                <p className="text-xs text-[var(--si-text-muted)]">Minimize animations for accessibility</p>
              </div>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  reducedMotion ? 'bg-[#9378ff]' : 'bg-[var(--si-surface-interactive)]'
                }`}
              >
                <motion.div
                  animate={{ x: reducedMotion ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {/* Sidebar */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--si-text-primary)]">Collapsed Sidebar</p>
                <p className="text-xs text-[var(--si-text-muted)]">Start with sidebar collapsed</p>
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  sidebarCollapsed ? 'bg-[#9378ff]' : 'bg-[var(--si-surface-interactive)]'
                }`}
              >
                <motion.div
                  animate={{ x: sidebarCollapsed ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>
          </div>
        </section>

        {/* AI Preferences Section */}
        <section className="mb-8 p-6 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl">
          <h2 className="text-lg font-semibold text-[var(--si-text-primary)] mb-4 flex items-center gap-2">
            <Zap size={18} className="text-[#52dad5]" />
            AI Preferences
          </h2>

          <div className="space-y-4">
            {/* Default Model */}
            <div>
              <label className="block text-sm font-medium text-[var(--si-text-secondary)] mb-2">
                Default Model
              </label>
              <select
                value={defaultModel}
                onChange={e => setDefaultModel(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--si-surface-interactive)] border border-[var(--si-border)] rounded-xl text-sm text-[var(--si-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#9378ff]/50"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Fast)</option>
                <option value="gpt-4o">GPT-4o (Advanced)</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>

            {/* Streaming */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--si-text-primary)]">Stream Responses</p>
                <p className="text-xs text-[var(--si-text-muted)]">Show AI responses as they generate</p>
              </div>
              <button
                onClick={() => setStreamResponses(!streamResponses)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  streamResponses ? 'bg-[#9378ff]' : 'bg-[var(--si-surface-interactive)]'
                }`}
              >
                <motion.div
                  animate={{ x: streamResponses ? 20 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full"
                />
              </button>
            </div>

            {/* Puter Connection Status */}
            <div className="flex items-center justify-between p-4 bg-[var(--si-surface-interactive)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${puterConnected ? 'bg-[#59d9a7]' : 'bg-[#ff6c7c]'}`} />
                <div>
                  <p className="text-sm font-medium text-[var(--si-text-primary)]">
                    Puter AI Connection
                  </p>
                  <p className="text-xs text-[var(--si-text-muted)]">
                    {puterConnected ? 'Connected and ready' : 'Not connected'}
                  </p>
                </div>
              </div>
              {!puterConnected && (
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && (window as any).puter) {
                      (window as any).puter.auth.signIn();
                    }
                  }}
                  className="px-3 py-1.5 bg-[#9378ff] hover:bg-[#7c5cff] text-white text-xs font-medium rounded-lg transition-all"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Data Management Section */}
        <section className="mb-8 p-6 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl">
          <h2 className="text-lg font-semibold text-[var(--si-text-primary)] mb-4 flex items-center gap-2">
            <Database size={18} className="text-[#c2f58d]" />
            Data Management
          </h2>

          <div className="space-y-4">
            {/* Info */}
            <div className="p-4 bg-[#52dad5]/10 border border-[#52dad5]/20 rounded-xl flex items-start gap-3">
              <Info size={18} className="text-[#52dad5] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[var(--si-text-primary)] mb-1">Local Storage</p>
                <p className="text-xs text-[var(--si-text-muted)]">
                  All your data is stored locally in your browser. No data is sent to external servers 
                  except when using AI features through Puter.js.
                </p>
              </div>
            </div>

            {/* Export */}
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--si-surface-interactive)] hover:bg-[var(--si-surface-elevated)] border border-[var(--si-border)] rounded-xl text-sm font-medium text-[var(--si-text-primary)] transition-all"
            >
              <Download size={16} />
              <span>Export All Data</span>
            </button>

            {/* Clear */}
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ff6c7c]/10 hover:bg-[#ff6c7c]/20 border border-[#ff6c7c]/20 rounded-xl text-sm font-medium text-[#ff6c7c] transition-all"
            >
              <Trash2 size={16} />
              <span>{showDeleteConfirm ? 'Confirm Delete All Data' : 'Clear All Data'}</span>
            </button>
            {showDeleteConfirm && (
              <p className="text-xs text-[#ff6c7c] text-center">
                This will delete all local data including projects, conversations, and preferences.
              </p>
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="p-6 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl">
          <h2 className="text-lg font-semibold text-[var(--si-text-primary)] mb-4 flex items-center gap-2">
            <Info size={18} className="text-[#9378ff]" />
            About
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--si-text-muted)]">Product</span>
              <span className="text-[var(--si-text-primary)] font-medium">HAMOODI SI</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--si-text-muted)]">Version</span>
              <span className="text-[var(--si-text-primary)] font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--si-text-muted)]">Development Phase</span>
              <span className="text-[var(--si-text-primary)] font-medium">Part 01 & 02 Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--si-text-muted)]">Founded by</span>
              <span className="text-[var(--si-text-primary)] font-medium">BhaiSazzaD</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
