// HAMOODI SyntheTech Intelligence — SI Command Center Homepage
// Part 01: Premium homepage with Synthetic Core visualization
// Polished for MVP Demo - GenSpark-inspired design

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
  Sparkles,
  TrendingUp,
  Shield,
  Clock
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
      gradient: 'from-[#8B5CF6] to-[#6D28D9]',
      shadowColor: 'shadow-[#8B5CF6]/20',
    },
    {
      icon: FolderKanban,
      title: 'Create a Project',
      description: 'Organize your work and ideas',
      route: '/projects',
      gradient: 'from-[#06B6D4] to-[#0891B2]',
      shadowColor: 'shadow-[#06B6D4]/20',
    },
    {
      icon: Zap,
      title: 'Explore Automations',
      description: 'Discover workflow templates',
      route: '/agents',
      gradient: 'from-[#10B981] to-[#059669]',
      shadowColor: 'shadow-[#10B981]/20',
    },
    {
      icon: Brain,
      title: 'Access Memory',
      description: 'View your knowledge base',
      route: '/memory',
      gradient: 'from-[#F59E0B] to-[#D97706]',
      shadowColor: 'shadow-[#F59E0B]/20',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data stays yours with enterprise-grade security',
    },
    {
      icon: TrendingUp,
      title: 'Intelligent Automation',
      description: 'AI-powered workflows that adapt to your needs',
    },
    {
      icon: Clock,
      title: 'Real-time Collaboration',
      description: 'Work seamlessly with your team across projects',
    },
  ];

  return (
    <motion.div
      className="min-h-screen bg-[var(--si-bg)] relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? {} : {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.6 } }
      }}
    >
      {/* Enhanced background with mesh gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-mesh opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#8B5CF6] rounded-full mix-blend-multiply filter blur-[150px] opacity-15 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-[#06B6D4] rounded-full mix-blend-multiply filter blur-[150px] opacity-15 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-[600px] h-[600px] bg-[#10B981] rounded-full mix-blend-multiply filter blur-[150px] opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[calc(100vh-240px)]">
          
          {/* Left column - Text content */}
          <div className="space-y-10">
            {/* Eyebrow */}
            <motion.div
              variants={introVariants.eyebrow}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[var(--si-surface-interactive)] border border-[var(--si-border)] backdrop-blur-sm"
            >
              <SISymbol size={20} />
              <span className="text-gradient-primary font-semibold text-sm tracking-wide">
                SYNTHETIC INTELLIGENCE WORKSPACE
              </span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={introVariants.headline}
              className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[var(--si-text-primary)] leading-[1.1]"
              style={{ fontSize: 'clamp(48px, 5vw, 72px)' }}
            >
              What will we
              <br />
              <span className="text-gradient-accent">
                build today?
              </span>
            </motion.h1>

            {/* Supporting text */}
            <motion.p
              variants={introVariants.supporting}
              className="text-xl text-[var(--si-text-secondary)] max-w-xl leading-relaxed"
            >
              Explore ideas, solve complex problems, and turn intent into meaningful work with AI-powered intelligence.
            </motion.p>

            {/* AI Composer */}
            <motion.div
              variants={introVariants.composer}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              <div className="relative bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-6 shadow-2xl hover:border-[var(--si-border-hover)] transition-all duration-300">
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
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onNavigate('/chat')}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Sparkles size={18} />
                    <span>Send</span>
                  </motion.button>
                </div>
                
                {/* Quick actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--si-border)]">
                  <span className="text-xs text-[var(--si-text-muted)] font-medium">Quick:</span>
                  {['Write code', 'Analyze data', 'Create content'].map((action) => (
                    <motion.button
                      key={action}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onNavigate('/chat')}
                      className="text-xs px-3 py-1.5 bg-[var(--si-surface-interactive)] text-[var(--si-text-secondary)] rounded-lg hover:bg-[var(--si-surface-hover)] hover:text-[var(--si-text-primary)] transition-all duration-200 border border-[var(--si-border)]"
                    >
                      {action}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={introVariants.supporting}
              className="flex items-center gap-8 text-sm"
            >
              {[
                { color: '#10B981', label: 'AI Ready' },
                { color: '#06B6D4', label: 'Secure' },
                { color: '#8B5CF6', label: 'Fast' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse" 
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="text-[var(--si-text-muted)] font-medium">{stat.label}</span>
                </div>
              ))}
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
              className="absolute top-10 right-10 w-24 h-24 bg-[#8B5CF6] rounded-full blur-3xl opacity-20"
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
              className="absolute bottom-20 left-10 w-32 h-32 bg-[#06B6D4] rounded-full blur-3xl opacity-20"
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
          className="mt-24 lg:mt-32"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--si-text-primary)] mb-3">
              Get Started
            </h2>
            <p className="text-[var(--si-text-secondary)]">
              Choose from our powerful suite of AI tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedActions.map((action, index) => (
              <motion.button
                key={action.title}
                custom={index}
                variants={introVariants.action}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigate(action.route)}
                className={`group relative bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-6 text-left hover:border-[var(--si-border-hover)] transition-all duration-300 overflow-hidden shadow-lg ${action.shadowColor}`}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon size={28} className="text-white" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-[var(--si-text-primary)] mb-2 group-hover:text-gradient-primary transition-all">
                    {action.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-[var(--si-text-muted)] mb-4 leading-relaxed">
                    {action.description}
                  </p>
                  
                  {/* Arrow */}
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--si-accent-primary)] opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span>Explore</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Features section */}
        <motion.div
          variants={introVariants.supporting}
          className="mt-24 lg:mt-32 pb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--si-text-primary)] mb-3">
              Why HAMOODI SI?
            </h2>
            <p className="text-[var(--si-text-secondary)]">
              Built for the future of intelligent work
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="p-8 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl hover:border-[var(--si-border-hover)] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#06B6D4]/20 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-[#8B5CF6]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--si-text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--si-text-muted)] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
