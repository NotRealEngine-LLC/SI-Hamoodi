// HAMOODI SyntheTech Intelligence — Brand Components
// Part 01: Original geometric SI emblem and brand identity

import { motion } from 'framer-motion';

// SI Symbol - Geometric intelligence emblem
export function SISymbol({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer computational arcs */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="url(#arcGradient)"
        strokeWidth="2"
        strokeDasharray="8 4"
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50px 50px' }}
      />
      
      {/* Middle ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="35"
        fill="none"
        stroke="url(#ringGradient)"
        strokeWidth="1.5"
        initial={{ rotate: 0 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50px 50px' }}
      />
      
      {/* Inner geometric nucleus */}
      <motion.polygon
        points="50,25 70,40 70,60 50,75 30,60 30,40"
        fill="url(#nucleusGradient)"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformOrigin: '50px 50px' }}
      />
      
      {/* Central intelligence node */}
      <motion.circle
        cx="50"
        cy="50"
        r="8"
        fill="#ffffff"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
        style={{ transformOrigin: '50px 50px' }}
      />
      
      {/* Interconnected nodes */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * 25;
        const y = 50 + Math.sin(rad) * 25;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#52dad5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
          />
        );
      })}
      
      {/* Connection lines */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * 25;
        const y = 50 + Math.sin(rad) * 25;
        return (
          <motion.line
            key={`line-${i}`}
            x1="50"
            y1="50"
            x2={x}
            y2={y}
            stroke="#9378ff"
            strokeWidth="1"
            opacity="0.4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.6 + i * 0.05 }}
          />
        );
      })}
      
      {/* Gradients */}
      <defs>
        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9378ff" />
          <stop offset="100%" stopColor="#52dad5" />
        </linearGradient>
        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#52dad5" />
          <stop offset="100%" stopColor="#c2f58d" />
        </linearGradient>
        <radialGradient id="nucleusGradient">
          <stop offset="0%" stopColor="#9378ff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#52dad5" stopOpacity="0.6" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// Brand Logo - Compact icon with symbol
export function BrandLogo({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SISymbol size={size} />
    </div>
  );
}

// Brand Wordmark - Full text logo
export function BrandWordmark({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <SISymbol size={32} />
      <div className="flex flex-col">
        <motion.span
          className="text-xl font-bold tracking-tight bg-gradient-to-r from-[#9378ff] to-[#52dad5] bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          HAMOODI
        </motion.span>
        <motion.span
          className="text-[10px] font-medium tracking-widest text-[#76859E] uppercase"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          SyntheTech Intelligence
        </motion.span>
      </div>
    </div>
  );
}

// Brand Signature - Minimal text signature
export function BrandSignature({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <span className="text-sm font-semibold tracking-wide text-[#F4F7FC]">
        HAMOODI
      </span>
      <span className="text-xs text-[#76859E]">SI</span>
    </motion.div>
  );
}

// Favicon component
export function BrandFavicon() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="16" cy="16" r="14" fill="url(#faviconGradient)" />
      <polygon
        points="16,8 22,12 22,20 16,24 10,20 10,12"
        fill="#ffffff"
        opacity="0.9"
      />
      <circle cx="16" cy="16" r="3" fill="#9378ff" />
      <defs>
        <radialGradient id="faviconGradient">
          <stop offset="0%" stopColor="#9378ff" />
          <stop offset="100%" stopColor="#52dad5" />
        </radialGradient>
      </defs>
    </svg>
  );
}
