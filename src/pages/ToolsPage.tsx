// HAMOODI SyntheTech Intelligence — Tools Directory Page
// Part 01: Capability directory with honest status indicators

import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Shield, 
  Globe,
  FileText,
  Table2,
  Presentation,
  Image,
  Video,
  Music,
  Code2,
  AppWindow,
  Database,
  Bot,
  Sparkles,
  Workflow,
  Users,
  Calendar,
  Mail,
  Mic,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Tool {
  id: string;
  icon: any;
  name: string;
  description: string;
  status: 'available' | 'planned' | 'in-development';
  category: 'intelligence' | 'creation' | 'development' | 'automation' | 'collaboration';
  route?: string;
}

export function ToolsPage() {
  const tools: Tool[] = [
    // Intelligence
    {
      id: 'chat',
      icon: MessageSquare,
      name: 'SI Chat',
      description: 'AI-powered conversations with multi-model support',
      status: 'available',
      category: 'intelligence',
      route: '/chat',
    },
    {
      id: 'research',
      icon: Search,
      name: 'SI Deep Research',
      description: 'Source-grounded research with citations',
      status: 'available',
      category: 'intelligence',
      route: '/studios/research',
    },
    {
      id: 'factcheck',
      icon: Shield,
      name: 'SI Fact Check',
      description: 'Verify information with trusted sources',
      status: 'planned',
      category: 'intelligence',
    },
    {
      id: 'browser',
      icon: Globe,
      name: 'SI Browser',
      description: 'AI-assisted web browsing and research',
      status: 'planned',
      category: 'intelligence',
    },

    // Creation
    {
      id: 'docs',
      icon: FileText,
      name: 'SI Docs',
      description: 'Rich text document editing with AI assistance',
      status: 'available',
      category: 'creation',
      route: '/studios/docs',
    },
    {
      id: 'sheets',
      icon: Table2,
      name: 'SI Sheets',
      description: 'Spreadsheets with formulas and calculations',
      status: 'available',
      category: 'creation',
      route: '/studios/sheets',
    },
    {
      id: 'slides',
      icon: Presentation,
      name: 'SI Slides',
      description: 'Presentation creation with AI generation',
      status: 'available',
      category: 'creation',
      route: '/studios/slides',
    },
    {
      id: 'images',
      icon: Image,
      name: 'SI Images',
      description: 'AI-powered image generation and editing',
      status: 'in-development',
      category: 'creation',
      route: '/studios/creative',
    },
    {
      id: 'video',
      icon: Video,
      name: 'SI Video',
      description: 'AI video generation and editing',
      status: 'planned',
      category: 'creation',
    },
    {
      id: 'audio',
      icon: Music,
      name: 'SI Audio',
      description: 'AI audio generation and processing',
      status: 'planned',
      category: 'creation',
    },

    // Development
    {
      id: 'code',
      icon: Code2,
      name: 'SI Code',
      description: 'Code editing with AI assistance',
      status: 'available',
      category: 'development',
      route: '/studios/code',
    },
    {
      id: 'appbuilder',
      icon: AppWindow,
      name: 'SI App Builder',
      description: 'Build applications with AI guidance',
      status: 'planned',
      category: 'development',
    },
    {
      id: 'dbbuilder',
      icon: Database,
      name: 'SI Database Builder',
      description: 'Design and build databases with AI',
      status: 'planned',
      category: 'development',
    },

    // Automation
    {
      id: 'agents',
      icon: Bot,
      name: 'SI Agents',
      description: 'Custom AI agents with specialized skills',
      status: 'available',
      category: 'automation',
      route: '/agents',
    },
    {
      id: 'skills',
      icon: Sparkles,
      name: 'SI Skills',
      description: 'Reusable expertise packages for agents',
      status: 'available',
      category: 'automation',
      route: '/agents',
    },
    {
      id: 'workflows',
      icon: Workflow,
      name: 'SI Workflows',
      description: 'Automated workflow execution',
      status: 'available',
      category: 'automation',
      route: '/agents',
    },
    {
      id: 'employees',
      icon: Users,
      name: 'SI Employees',
      description: 'AI team members for complex tasks',
      status: 'planned',
      category: 'automation',
    },

    // Collaboration
    {
      id: 'teams',
      icon: Users,
      name: 'SI Teams',
      description: 'Team collaboration and communication',
      status: 'planned',
      category: 'collaboration',
    },
    {
      id: 'meetings',
      icon: Calendar,
      name: 'SI Meetings',
      description: 'AI-assisted meeting management',
      status: 'planned',
      category: 'collaboration',
    },
    {
      id: 'mail',
      icon: Mail,
      name: 'SI Mail',
      description: 'AI-powered email management',
      status: 'planned',
      category: 'collaboration',
    },
    {
      id: 'voice',
      icon: Mic,
      name: 'SI Voice',
      description: 'Voice commands and transcription',
      status: 'planned',
      category: 'collaboration',
    },
  ];

  const categories = [
    { id: 'intelligence', name: 'Intelligence', icon: Brain },
    { id: 'creation', name: 'Creation', icon: Sparkles },
    { id: 'development', name: 'Development', icon: Code2 },
    { id: 'automation', name: 'Automation', icon: Workflow },
    { id: 'collaboration', name: 'Collaboration', icon: Users },
  ];

  const getStatusBadge = (status: Tool['status']) => {
    switch (status) {
      case 'available':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#59d9a7]/10 text-[#59d9a7] rounded-lg text-xs font-medium">
            <CheckCircle size={12} />
            <span>Available</span>
          </div>
        );
      case 'in-development':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[#f3bd65]/10 text-[#f3bd65] rounded-lg text-xs font-medium">
            <Clock size={12} />
            <span>In Development</span>
          </div>
        );
      case 'planned':
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-[var(--si-text-muted)]/10 text-[var(--si-text-muted)] rounded-lg text-xs font-medium">
            <AlertCircle size={12} />
            <span>Planned</span>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--si-text-primary)] mb-4">
            Tools & Capabilities
          </h1>
          <p className="text-lg text-[var(--si-text-secondary)] max-w-2xl">
            Explore the complete HAMOODI SI ecosystem. From AI conversations to autonomous agents, 
            discover all the tools available to supercharge your workflow.
          </p>
        </div>

        {/* Categories */}
        {categories.map(category => {
          const categoryTools = tools.filter(t => t.category === category.id);
          const CategoryIcon = category.icon;

          return (
            <div key={category.id} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9378ff] to-[#52dad5] flex items-center justify-center">
                  <CategoryIcon size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--si-text-primary)]">
                  {category.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTools.map(tool => {
                  const ToolIcon = tool.icon;
                  
                  return (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className={`group relative bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-6 transition-all ${
                        tool.status === 'available' && tool.route
                          ? 'cursor-pointer hover:border-[var(--si-border-hover)]'
                          : 'opacity-75'
                      }`}
                      onClick={() => {
                        if (tool.status === 'available' && tool.route) {
                          window.location.href = tool.route;
                        }
                      }}
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9378ff]/20 to-[#52dad5]/20 flex items-center justify-center mb-4 group-hover:from-[#9378ff]/30 group-hover:to-[#52dad5]/30 transition-all">
                        <ToolIcon size={24} className="text-[#9378ff]" />
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2 group-hover:text-[#9378ff] transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-sm text-[var(--si-text-muted)] mb-4 line-clamp-2">
                        {tool.description}
                      </p>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        {getStatusBadge(tool.status)}
                        {tool.status === 'available' && tool.route && (
                          <span className="text-xs text-[#9378ff] opacity-0 group-hover:opacity-100 transition-opacity">
                            Open →
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-16 p-8 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl text-center">
          <h3 className="text-xl font-bold text-[var(--si-text-primary)] mb-2">
            Want to see more?
          </h3>
          <p className="text-sm text-[var(--si-text-muted)] mb-4">
            HAMOODI SI is continuously evolving. New tools and capabilities are added regularly.
          </p>
          <p className="text-xs text-[var(--si-text-muted)]">
            Follow our development journey and stay updated on new features.
          </p>
        </div>
      </div>
    </div>
  );
}

// Brain icon (not imported from lucide)
function Brain({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}
