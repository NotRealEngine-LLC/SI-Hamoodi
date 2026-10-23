// HAMOODI SyntheTech Intelligence — Research Studio
// Phase 09: Source-grounded research and reporting

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, FileText, Link2, Quote, BookOpen, Loader2,
  CheckCircle, AlertCircle, Plus, Trash2, ExternalLink
} from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';

export function ResearchStudio() {
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const [researchQuestion, setResearchQuestion] = useState('');
  const [researchMode, setResearchMode] = useState<'quick' | 'deep' | 'document'>('quick');
  const [isResearching, setIsResearching] = useState(false);
  const [sources, setSources] = useState<Array<{
    id: string;
    title: string;
    url?: string;
    excerpt: string;
    verified: boolean;
  }>>([]);
  const [findings, setFindings] = useState('');
  const [report, setReport] = useState('');

  const handleStartResearch = async () => {
    if (!researchQuestion.trim() || !user || !currentWorkspace) return;

    setIsResearching(true);
    setSources([]);
    setFindings('');
    setReport('');

    try {
      // In production, this would call the SI Intelligence Service
      // For now, simulate research process
      
      // Simulate finding sources
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSources = [
        {
          id: '1',
          title: 'Research Source 1',
          url: 'https://example.com/source1',
          excerpt: 'This is a relevant excerpt from the first source that addresses the research question.',
          verified: true,
        },
        {
          id: '2',
          title: 'Research Source 2',
          url: 'https://example.com/source2',
          excerpt: 'Another important finding from a second authoritative source.',
          verified: true,
        },
      ];

      setSources(mockSources);

      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      setFindings('Based on the research, several key findings emerge:\n\n1. First major finding from the sources\n2. Second important insight\n3. Third conclusion supported by evidence');

      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReport(`# Research Report: ${researchQuestion}\n\n## Executive Summary\n\nThis report presents findings from a ${researchMode} research investigation.\n\n## Key Findings\n\n${findings}\n\n## Sources\n\n${mockSources.map((s, i) => `${i + 1}. ${s.title}${s.url ? ` (${s.url})` : ''}`).join('\n')}\n\n## Conclusion\n\nFurther investigation may be warranted based on these initial findings.`);

    } catch (error) {
      console.error('Research failed:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleAddSource = () => {
    const newSource = {
      id: Date.now().toString(),
      title: 'Manual Source',
      url: '',
      excerpt: '',
      verified: false,
    };
    setSources([...sources, newSource]);
  };

  const handleRemoveSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SI Research Studio</h1>
            <p className="text-sm text-zinc-500">Source-grounded research and reporting</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Research Setup */}
        <div className="w-96 border-r border-zinc-800/50 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Research Question */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Research Question
              </label>
              <textarea
                value={researchQuestion}
                onChange={e => setResearchQuestion(e.target.value)}
                placeholder="What would you like to research?"
                className="w-full h-32 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>

            {/* Research Mode */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Research Mode
              </label>
              <div className="space-y-2">
                {(['quick', 'deep', 'document'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setResearchMode(mode)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      researchMode === mode
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50'
                    }`}
                  >
                    <p className="text-sm font-medium text-white capitalize">{mode} Research</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {mode === 'quick' && 'Fast investigation with limited sources'}
                      {mode === 'deep' && 'Comprehensive multi-step investigation'}
                      {mode === 'document' && 'Analyze specific workspace documents'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Research Button */}
            <button
              onClick={handleStartResearch}
              disabled={!researchQuestion.trim() || isResearching}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
            >
              {isResearching ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <Search size={18} />
                  <span>Start Research</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center Panel - Findings & Report */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Findings */}
            {findings && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Quote size={18} className="text-blue-400" />
                  Key Findings
                </h2>
                <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">{findings}</pre>
                </div>
              </div>
            )}

            {/* Report */}
            {report && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-emerald-400" />
                  Research Report
                </h2>
                <div className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl">
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">{report}</pre>
                </div>
              </div>
            )}

            {!findings && !report && !isResearching && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen size={48} className="text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-400 mb-2">Start Your Research</h3>
                  <p className="text-sm text-zinc-500">Enter a research question and select a mode to begin</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Sources */}
        <div className="w-96 border-l border-zinc-800/50 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Link2 size={18} className="text-violet-400" />
              Sources ({sources.length})
            </h2>
            <button
              onClick={handleAddSource}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
            >
              <Plus size={16} className="text-zinc-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {sources.length === 0 ? (
              <div className="text-center py-12">
                <Link2 size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">No sources yet</p>
              </div>
            ) : (
              sources.map(source => (
                <motion.div
                  key={source.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-zinc-800/30 border border-zinc-700/30 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {source.verified ? (
                          <CheckCircle size={14} className="text-emerald-400" />
                        ) : (
                          <AlertCircle size={14} className="text-amber-400" />
                        )}
                        <h3 className="text-sm font-medium text-white truncate">{source.title}</h3>
                      </div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <ExternalLink size={10} />
                          {source.url}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveSource(source.id)}
                      className="p-1 hover:bg-red-900/30 rounded transition-all"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                  {source.excerpt && (
                    <p className="text-xs text-zinc-400 line-clamp-3">{source.excerpt}</p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
