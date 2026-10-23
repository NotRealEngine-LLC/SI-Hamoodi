// HAMOODI SyntheTech Intelligence — Enhanced Design System
// Part 01: Comprehensive semantic design tokens

export const designTokens = {
  // Colors - Dark Theme (GenSpark-inspired refined palette)
  dark: {
    bg: '#0A0E1A',
    surface: '#0F1420',
    surfaceElevated: '#151B2B',
    surfaceInteractive: '#1C2438',
    surfaceHover: '#232C42',
    
    textPrimary: '#F8FAFC',
    textSecondary: '#B4C0D3',
    textMuted: '#8494A7',
    textDisabled: '#5A6577',
    
    accentPrimary: '#8B5CF6',
    accentPrimaryHover: '#7C3AED',
    accentSecondary: '#06B6D4',
    accentTertiary: '#10B981',
    
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    
    border: 'rgba(148, 163, 184, 0.12)',
    borderHover: 'rgba(148, 163, 184, 0.24)',
    borderFocus: 'rgba(139, 92, 246, 0.5)',
  },
  
  // Colors - Light Theme
  light: {
    bg: '#FAFBFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFC',
    surfaceInteractive: '#F1F5F9',
    surfaceHover: '#E2E8F0',
    
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textDisabled: '#94A3B8',
    
    accentPrimary: '#7C3AED',
    accentPrimaryHover: '#6D28D9',
    accentSecondary: '#0891B2',
    accentTertiary: '#059669',
    
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2563EB',
    
    border: 'rgba(15, 23, 42, 0.08)',
    borderHover: 'rgba(15, 23, 42, 0.16)',
    borderFocus: 'rgba(124, 58, 237, 0.5)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace",
    },
    
    fontSize: {
      hero: { min: 48, max: 72 },
      h1: { min: 28, max: 36 },
      h2: { min: 22, max: 28 },
      h3: { min: 18, max: 24 },
      body: { min: 14, max: 16 },
      small: { min: 12, max: 14 },
      tiny: 11,
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  // Spacing (4px base)
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },
  
  // Border Radius
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 24,
    full: 9999,
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    glow: '0 0 20px rgba(147, 120, 255, 0.3)',
    glowCyan: '0 0 20px rgba(82, 218, 213, 0.3)',
  },
  
  // Layout
  layout: {
    sidebar: {
      expanded: 256,
      collapsed: 72,
    },
    header: {
      height: 64,
    },
    contextPanel: {
      width: 320,
    },
    content: {
      maxWidth: 1280,
      chatWidth: 768,
    },
  },
  
  // Breakpoints
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  
  // Motion
  motion: {
    duration: {
      fast: 120,
      normal: 200,
      slow: 300,
      slower: 450,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      spring: { type: 'spring', stiffness: 300, damping: 30 },
    },
  },
  
  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modal: 400,
    popover: 500,
    tooltip: 600,
    toast: 700,
  },
};

// Helper function to get theme-aware colors
export function getThemeColors(isDark: boolean) {
  return isDark ? designTokens.dark : designTokens.light;
}

// Helper function to get responsive font size
export function getResponsiveFontSize(size: 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'small') {
  const config = designTokens.typography.fontSize[size];
  if (typeof config === 'number') return `${config}px`;
  return `clamp(${config.min}px, ${config.min + (config.max - config.min) * 0.5}px, ${config.max}px)`;
}

// Export as CSS custom properties string
export function generateCSSVariables(isDark: boolean = true): string {
  const colors = getThemeColors(isDark);
  
  return `
    :root {
      --si-bg: ${colors.bg};
      --si-surface: ${colors.surface};
      --si-surface-elevated: ${colors.surfaceElevated};
      --si-surface-interactive: ${colors.surfaceInteractive};
      
      --si-text-primary: ${colors.textPrimary};
      --si-text-secondary: ${colors.textSecondary};
      --si-text-muted: ${colors.textMuted};
      
      --si-accent-primary: ${colors.accentPrimary};
      --si-accent-secondary: ${colors.accentSecondary};
      --si-accent-tertiary: ${colors.accentTertiary};
      
      --si-success: ${colors.success};
      --si-warning: ${colors.warning};
      --si-danger: ${colors.danger};
      
      --si-border: ${colors.border};
      --si-border-hover: ${colors.borderHover};
      
      --si-font-sans: ${designTokens.typography.fontFamily.sans};
      --si-font-mono: ${designTokens.typography.fontFamily.mono};
      
      --si-radius-sm: ${designTokens.borderRadius.sm}px;
      --si-radius-md: ${designTokens.borderRadius.md}px;
      --si-radius-lg: ${designTokens.borderRadius.lg}px;
      --si-radius-xl: ${designTokens.borderRadius.xl}px;
      
      --si-shadow-sm: ${designTokens.shadows.sm};
      --si-shadow-md: ${designTokens.shadows.md};
      --si-shadow-lg: ${designTokens.shadows.lg};
      --si-shadow-xl: ${designTokens.shadows.xl};
    }
  `;
}
