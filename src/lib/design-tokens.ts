// HAMOODI SyntheTech Intelligence — Enhanced Design System
// Part 01: Comprehensive semantic design tokens

export const designTokens = {
  // Colors - Dark Theme
  dark: {
    bg: '#080B12',
    surface: '#0E1320',
    surfaceElevated: '#141B2B',
    surfaceInteractive: '#1B2537',
    
    textPrimary: '#F4F7FC',
    textSecondary: '#A6B3C9',
    textMuted: '#76859E',
    
    accentPrimary: '#9378FF',
    accentCyan: '#52DAD5',
    accentLime: '#C2F58D',
    
    success: '#59D9A7',
    warning: '#F3BD65',
    danger: '#FF6C7C',
    
    border: 'rgba(175, 197, 230, 0.11)',
    borderHover: 'rgba(175, 197, 230, 0.2)',
  },
  
  // Colors - Light Theme
  light: {
    bg: '#F7F9FC',
    surface: '#FFFFFF',
    surfaceElevated: '#F0F3F9',
    surfaceInteractive: '#E8EDF5',
    
    textPrimary: '#172033',
    textSecondary: '#536078',
    textMuted: '#728097',
    
    accentPrimary: '#7C5CFF',
    accentCyan: '#3DB8B3',
    accentLime: '#8FD65F',
    
    success: '#3DB87F',
    warning: '#D99A3D',
    danger: '#E54D5D',
    
    border: '#E4E9F1',
    borderHover: '#D0D7E3',
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
      --si-accent-cyan: ${colors.accentCyan};
      --si-accent-lime: ${colors.accentLime};
      
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
