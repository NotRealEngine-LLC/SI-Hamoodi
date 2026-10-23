// HAMOODI SyntheTech Intelligence — Signature Intro Animation
// Part 01: Framer Motion choreographed interface reveal

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface IntroAnimationProps {
  onComplete?: () => void;
  reducedMotion?: boolean;
}

export function useIntroAnimation({ onComplete, reducedMotion = false }: IntroAnimationProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (hasPlayedRef.current || reducedMotion) {
      if (onComplete) onComplete();
      return;
    }

    hasPlayedRef.current = true;
    if (onComplete) onComplete();
  }, [onComplete, reducedMotion]);

  return scopeRef;
}

// Animation variants for choreographed sequence
export const introVariants = {
  eyebrow: {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    },
  },
  headline: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.2 }
    },
  },
  supporting: {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut', delay: 0.4 }
    },
  },
  composer: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut', delay: 0.6 }
    },
  },
  action: {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut', delay: 0.8 + i * 0.08 }
    }),
  },
  core: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.8, ease: 'easeOut', delay: 0.3 }
    },
  },
};

// Component wrapper for intro animation
export function IntroAnimationWrapper({ 
  children, 
  reducedMotion = false 
}: { 
  children: React.ReactNode;
  reducedMotion?: boolean;
}) {
  const scopeRef = useIntroAnimation({ reducedMotion });

  return (
    <div ref={scopeRef} className="intro-animation-wrapper">
      {children}
    </div>
  );
}

// Animated elements with proper class names
export function AnimatedEyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`si-eyebrow opacity-0 ${className}`}>
      {children}
    </div>
  );
}

export function AnimatedHeadline({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h1 className={`si-headline opacity-0 ${className}`}>
      {children}
    </h1>
  );
}

export function AnimatedSupporting({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`si-supporting opacity-0 ${className}`}>
      {children}
    </p>
  );
}

export function AnimatedComposer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`si-composer opacity-0 ${className}`}>
      {children}
    </div>
  );
}

export function AnimatedAction({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`si-action opacity-0 ${className}`}>
      {children}
    </div>
  );
}

export function AnimatedCore({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`si-core opacity-0 ${className}`}>
      {children}
    </div>
  );
}
