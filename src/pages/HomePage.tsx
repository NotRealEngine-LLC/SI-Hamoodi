// HAMOODI SyntheTech Intelligence — SI Command Center Homepage
// Part 01: Premium homepage with Synthetic Core visualization

import { motion } from 'framer-motion';
import { SyntheticCore, SyntheticCoreFallback } from '../components/SyntheticCore';
import { SISymbol } from '../components/brand/BrandComponents';
import { introVariants } from '../components/animations/IntroAnimation';
import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  FolderKanban, 
  Zap, 
  Brain,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (route: string) => void;
  reducedMotion?: boolean;
}

export function HomePage({ onNavigate, reducedMotion = false }: HomePageProps) {
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGLSupported(false);
      }
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);

  const suggestedActions = [
    {
      icon: MessageSquare,
      title: 'Start a Conversation',
      description: 'Chat with AI about any topic',
      route: '/chat',
      color: 'from-[#9378ff] to-[#7c5cff]',
    },
    {
      icon: FolderKanban,
      title: 'Create a Project',
      description: 'Organize your work and ideas',
      route: '/projects',
      color: 'from-[#52dad5] to-[#3db8b3]',
    },
    {
      icon: Zap,
      title: 'Explore Automations',
      description: 'Discover workflow templates',
      route: '/automations',
      color: 'from-[#c2f58d] to-[#8fd65f]',
    },
    {
      icon: Brain,
      title: 'Access Memory',
      description: 'View your knowledge base',
      route: '/memory',
      color: 'from-[#f3bd65] to-[#d99a3d]',
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-[var(--si-bg)] relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? {} : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } }
      }}
    >
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#9378ff] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#52dad5] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#c2f58d] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
          
          {/* Left column - Text content */}
          <div className="space-y-8">
            {/* Eyebrow */}
            <motion.div
              variants={introVariants.eyebrow}
              className="flex items-center gap-2 text-sm font-medium tracking-wider text-[#9378ff] uppercase"
            >
              <SISymbol size={20} />
              <span>Synthetic Intelligence Workspace</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={introVariants.headline}
              className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[var(--si-text-primary)] leading-tight"
              style={{ fontSize: 'clamp(48px, 5vw, 72px)' }}
            >
              What will we
              <br />
              <span className="bg-gradient-to-r from-[#9378ff] via-[#52dad5] to-[#c2f58d] bg-clip-text text-transparent">
                build today?
              </span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              variants={introVariants.supporting}
              className="text-lg lg:text-xl text-[var(--si-text-secondary)] max-w-xl leading-relaxed"
            >
              Explore ideas, solve complex problems, and turn intent into meaningful work with AI-powered intelligence.
            </motion.p>

            {/* AI Composer */}
            <motion.div
              variants={introVariants.composer}
              className="relative"
            >
              <div className="bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-6 shadow-2xl hover:border-[var(--si-border-hover)] transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <textarea
                      placeholder="Ask anything or describe what you want to create..."
                      className="w-full bg-transparent text-[var(--si-text-primary)] placeholder-[var(--si-text-muted)] resize-none focus:outline-none text-base leading-relaxed min-h-[80px]"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onNavigate('/chat');
                        }
                      }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('/chat')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#9378ff] to-[#7c5cff] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Sparkles size={18} />
                    <span>Send</span>
                  </motion.button>
                </div>
                
                {/* Quick actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--si-border)]">
                  <span className="text-xs text-[var(--si-text-muted)]">Quick:</span>
                  <button
                    onClick={() => onNavigate('/chat')}
                    className="text-xs px-3 py-1.5 bg-[var(--si-surface-interactive)] text-[var(--si-text-secondary)] rounded-lg hover:bg-[var(--si-surface-elevated)] transition-colors"
                  >
                    Write code
                  </button>
                  <button
                    onClick={() => onNavigate('/chat')}
                    className="text-xs px-3 py-1.5 bg-[var(--si-surface-interactive)] text-[var(--si-text-secondary)] rounded-lg hover:bg-[var(--si-surface-elevated)] transition-colors"
                  >
                    Analyze data
                  </button>
                  <button
                    onClick={() => onNavigate('/chat')}
                    className="text-xs px-3 py-1.5 bg-[var(--si-surface-interactive)] text-[var(--si-text-secondary)] rounded-lg hover:bg-[var(--si-surface-elevated)] transition-colors"
                  >
                    Create content
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={introVariants.supporting}
              className="flex items-center gap-8 text-sm text-[var(--si-text-muted)]"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#59d9a7]" />
                <span>AI Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#52dad5]" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#9378ff]" />
                <span>Fast</span>
              </div>
            </motion.div>
          </div>

          {/* Right column - Synthetic Core visualization */}
          <motion.div
            variants={introVariants.core}
            className="relative h-[500px] lg:h-[600px] flex items-center justify-center"
          >
            {webGLSupported ? (
              <SyntheticCore className="w-full h-full" interactive={true} />
            ) : (
              <SyntheticCoreFallback className="w-full h-full max-w-md" />
            )}
            
            {/* Floating accent elements */}
            <motion.div
              className="absolute top-10 right-10 w-20 h-20 bg-[#9378ff] rounded-full blur-2xl opacity-20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-20 left-10 w-32 h-32 bg-[#52dad5] rounded-full blur-3xl opacity-20"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.35, 0.2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </motion.div>
        </div>

        {/* Suggested actions grid */}
        <motion.div
          variants={introVariants.composer}
          className="mt-20 lg:mt-32"
        >
          <h2 className="text-2xl font-bold text-[var(--si-text-primary)] mb-8">
            Get Started
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestedActions.map((action, i) => (
              <motion.button
                key={action.title}
                custom={i}
                variants={introVariants.action}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(action.route)}
                className="group relative bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-6 text-left hover:border-[var(--si-border-hover)] transition-all duration-300 overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <action.icon size={24} className="text-white" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-base font-semibold text-[var(--si-text-primary)] mb-2 group-hover:text-[#9378ff] transition-colors">
                    {action.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-[var(--si-text-muted)] mb-4">
                    {action.description}
                  </p>
                  
                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-sm font-medium text-[#9378ff] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Explore</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Recent activity section */}
        <motion.div
          variants={introVariants.supporting}
          className="mt-20 lg:mt-32 pb-12"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[var(--si-text-primary)]">
              Recent Activity
            </h2>
            <button
              onClick={() => onNavigate('/activity')}
              className="text-sm text-[#9378ff] hover:text-[#7c5cff] transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>
          
          <div className="bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--si-surface-interactive)] flex items-center justify-center">
                <Sparkles size={24} className="text-[var(--si-text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2">
                No recent activity
              </h3>
              <p className="text-sm text-[var(--si-text-muted)] mb-6">
                Start a conversation or create a project to see your activity here
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('/chat')}
                className="px-6 py-3 bg-gradient-to-r from-[#9378ff] to-[#7c5cff] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start your first conversation
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
