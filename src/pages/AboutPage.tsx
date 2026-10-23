// HAMOODI SyntheTech Intelligence — About Page
// Part 01: Product information and vision

import { motion } from 'framer-motion';
import { Sparkles, Target, Shield, Zap, Heart } from 'lucide-react';
import { SISymbol } from '../components/brand/BrandComponents';

export function AboutPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <SISymbol size={80} />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#9378ff] via-[#52dad5] to-[#c2f58d] bg-clip-text text-transparent mb-4">
            HAMOODI
          </h1>
          <p className="text-2xl font-semibold text-[var(--si-text-primary)] mb-2">
            SyntheTech Intelligence
          </p>
          <p className="text-lg text-[var(--si-text-muted)]">
            SI — Synthetic Intelligence
          </p>
        </motion.div>

        {/* Vision Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 p-8 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target size={24} className="text-[#9378ff]" />
            <h2 className="text-2xl font-bold text-[var(--si-text-primary)]">Our Vision</h2>
          </div>
          <p className="text-[var(--si-text-secondary)] leading-relaxed mb-4">
            HAMOODI SI is being developed as a unified Synthetic Intelligence Operating System. 
            It will eventually allow users to communicate with AI, delegate complex objectives, 
            automate work, create digital artifacts, manage information, operate software tools, 
            and coordinate intelligent agents inside one environment.
          </p>
          <p className="text-[var(--si-text-secondary)] leading-relaxed">
            Our mission is to transform human intent into intelligent execution, making advanced 
            AI capabilities accessible, secure, and productive for everyone.
          </p>
        </motion.section>

        {/* Core Principles */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-[var(--si-text-primary)] mb-6 text-center">
            Core Principles
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Sparkles,
                title: 'Intelligence First',
                description: 'AI-powered capabilities at the core of every feature',
                color: '#9378ff',
              },
              {
                icon: Shield,
                title: 'Security & Privacy',
                description: 'Your data stays yours. Local-first with optional cloud sync',
                color: '#52dad5',
              },
              {
                icon: Zap,
                title: 'Performance',
                description: 'Fast, responsive, and optimized for productivity',
                color: '#c2f58d',
              },
              {
                icon: Heart,
                title: 'User-Centric',
                description: 'Designed for real workflows and genuine needs',
                color: '#f3bd65',
              },
            ].map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="p-6 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl hover:border-[var(--si-border-hover)] transition-all"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${principle.color}20` }}
                >
                  <principle.icon size={24} style={{ color: principle.color }} />
                </div>
                <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2">
                  {principle.title}
                </h3>
                <p className="text-sm text-[var(--si-text-muted)]">
                  {principle.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Platform Capabilities */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12 p-8 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl"
        >
          <h2 className="text-2xl font-bold text-[var(--si-text-primary)] mb-6">
            Platform Capabilities
          </h2>
          <div className="space-y-4">
            {[
              'Multimodel intelligence with Puter.js integration',
              'Super Agent orchestration for complex tasks',
              'Autonomous execution with approval controls',
              'Research and knowledge systems with citations',
              'Persistent synthetic memory across sessions',
              'Custom agents with specialized skills',
              'AI documents, presentations, and spreadsheets',
              'AI coding and application development',
              'AI media creation and editing',
              'MCP integrations for external tools',
              'Browser automation capabilities',
              'Workflow automation and scheduling',
              'Collaborative workspaces',
              'AI analytics and business intelligence',
              'Subscription and usage management',
            ].map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-[#9378ff]" />
                <span className="text-[var(--si-text-secondary)]">{capability}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center py-8 border-t border-[var(--si-border)]"
        >
          <p className="text-sm text-[var(--si-text-muted)] mb-2">
            Founded by <span className="text-[var(--si-text-primary)] font-medium">BhaiSazzaD</span>
          </p>
          <p className="text-xs text-[var(--si-text-muted)]">
            HAMOODI SyntheTech Intelligence — Building the future of intelligent work
          </p>
          <p className="text-xs text-[var(--si-text-muted)] mt-4">
            Version 1.0.0 • Phase 12 Complete
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
