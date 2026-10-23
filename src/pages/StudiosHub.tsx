// HAMOODI SyntheTech Intelligence — Studios Hub
// Phase 09: Entry point for all creation studios

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, FileText, Table2, Presentation, Image, Code2,
  ArrowRight, Sparkles, Clock, Plus
} from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { artifactService } from '../lib/creation/artifact-service';

export function StudiosHub() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const [recentArtifacts, setRecentArtifacts] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (user && currentWorkspace) {
      loadRecentArtifacts();
    }
  }, [user, currentWorkspace]);

  const loadRecentArtifacts = async () => {
    if (!user || !currentWorkspace) return;

    try {
      const artifacts = await artifactService.listArtifacts(user.id, {
        workspace_id: currentWorkspace.id,
        limit: 10,
      });
      setRecentArtifacts(artifacts);
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    }
  };

  const studios = [
    {
      id: 'research',
      name: 'Research Studio',
      description: 'Source-grounded research and reporting',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-600',
      path: '/studios/research',
    },
    {
      id: 'docs',
      name: 'Docs Studio',
      description: 'Rich text document editing',
      icon: FileText,
      color: 'from-violet-500 to-purple-600',
      path: '/studios/docs',
    },
    {
      id: 'sheets',
      name: 'Sheets Studio',
      description: 'Spreadsheets with formulas',
      icon: Table2,
      color: 'from-emerald-500 to-green-600',
      path: '/studios/sheets',
    },
    {
      id: 'slides',
      name: 'Slides Studio',
      description: 'Presentation creation',
      icon: Presentation,
      color: 'from-orange-500 to-red-600',
      path: '/studios/slides',
    },
    {
      id: 'creative',
      name: 'Creative Studio',
      description: 'AI image generation',
      icon: Image,
      color: 'from-pink-500 to-rose-600',
      path: '/studios/creative',
    },
    {
      id: 'code',
      name: 'Developer Studio',
      description: 'Code editing and projects',
      icon: Code2,
      color: 'from-zinc-500 to-zinc-700',
      path: '/studios/code',
    },
  ];

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case 'research_report': return BookOpen;
      case 'document': return FileText;
      case 'spreadsheet': return Table2;
      case 'presentation': return Presentation;
      case 'image': return Image;
      case 'code_project':
      case 'code_file': return Code2;
      default: return FileText;
    }
  };

  const getStudioPath = (type: string, id: string) => {
    switch (type) {
      case 'research_report': return `/studios/research/${id}`;
      case 'document': return `/studios/docs/${id}`;
      case 'spreadsheet': return `/studios/sheets/${id}`;
      case 'presentation': return `/studios/slides/${id}`;
      case 'image': return `/studios/creative/${id}`;
      case 'code_project':
      case 'code_file': return `/studios/code/${id}`;
      default: return `/studios/docs/${id}`;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SI Creation Studios</h1>
            <p className="text-sm text-zinc-500">Research. Create. Refine. Export. Continue.</p>
          </div>
        </div>
      </div>

      {/* Studios Grid */}
      <div className="px-8 py-6">
        <h2 className="text-lg font-semibold text-white mb-4">Studios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {studios.map((studio, index) => (
            <motion.button
              key={studio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(studio.path)}
              className="group p-6 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-xl text-left transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${studio.color} flex items-center justify-center mb-4 shadow-lg`}>
                <studio.icon size={24} className="text-white" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">
                {studio.name}
              </h3>
              <p className="text-sm text-zinc-500 mb-3">{studio.description}</p>
              <div className="flex items-center gap-1 text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Open Studio</span>
                <ArrowRight size={12} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Recent Artifacts */}
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-zinc-400" />
          Recent Artifacts
        </h2>
        {recentArtifacts.length === 0 ? (
          <div className="text-center py-12 bg-zinc-800/20 border border-zinc-700/30 rounded-xl">
            <FileText size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 mb-4">No artifacts yet</p>
            <button
              onClick={() => navigate('/studios/docs')}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-all mx-auto"
            >
              <Plus size={16} />
              <span>Create Your First Document</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentArtifacts.map(artifact => {
              const Icon = getArtifactIcon(artifact.artifact_type);
              return (
                <motion.button
                  key={artifact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate(getStudioPath(artifact.artifact_type, artifact.id))}
                  className="w-full flex items-center gap-3 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Icon size={18} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{artifact.title}</p>
                    <p className="text-xs text-zinc-500">
                      {artifact.artifact_type.replace(/_/g, ' ')} • {new Date(artifact.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-zinc-600" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
