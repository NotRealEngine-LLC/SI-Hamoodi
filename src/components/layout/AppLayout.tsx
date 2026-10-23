// HAMOODI SyntheTech Intelligence — Main Application Layout
// Part 01 & 02: Premium layout with enhanced navigation

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EnhancedSidebar } from '../navigation/EnhancedSidebar';
import { EnhancedHeader } from '../navigation/EnhancedHeader';
import { GlobalSearch } from '../search/GlobalSearch';
import { CommandPalette } from '../search/CommandPalette';
import { useKeyboardShortcuts, registerDefaultShortcuts } from '../../lib/keyboard/shortcuts';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, state: authState, signOut } = useAuth();
  const [isDark, setIsDark] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('hamoodi-theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
  }, []);

  // Register default keyboard shortcuts
  useEffect(() => {
    registerDefaultShortcuts({
      openCommandPalette: () => setIsCommandPaletteOpen(true),
      newChat: () => navigate('/chat'),
      toggleSidebar: () => setIsSidebarCollapsed(!isSidebarCollapsed),
      focusSearch: () => setIsSearchOpen(true),
      closeOverlay: () => {
        setIsCommandPaletteOpen(false);
        setIsSearchOpen(false);
      },
    });
  }, [navigate, isSidebarCollapsed]);

  // Apply theme to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('hamoodi-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleToggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/sign-in');
  };

  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  const handleCommandPalette = () => {
    setIsCommandPaletteOpen(true);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  // Get page title from route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Home';
    if (path.startsWith('/chat')) return 'Chat';
    if (path.startsWith('/projects')) return 'Projects';
    if (path.startsWith('/hubs')) return 'Hubs';
    if (path.startsWith('/files')) return 'Files';
    if (path.startsWith('/memory')) return 'Memory';
    if (path.startsWith('/agents')) return 'Agents';
    if (path.startsWith('/workflows')) return 'Workflows';
    if (path.startsWith('/integrations')) return 'Integrations';
    if (path.startsWith('/studios')) return 'Studios';
    if (path.startsWith('/billing')) return 'Billing';
    if (path.startsWith('/analytics')) return 'Analytics';
    if (path.startsWith('/settings')) return 'Settings';
    return 'HAMOODI SI';
  };

  // Get breadcrumb from route
  const getBreadcrumb = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    
    if (parts.length === 0) return undefined;
    
    const breadcrumb = ['Home'];
    
    const routeNames: Record<string, string> = {
      'chat': 'Chat',
      'projects': 'Projects',
      'hubs': 'Hubs',
      'files': 'Files',
      'memory': 'Memory',
      'agents': 'Agents',
      'workflows': 'Workflows',
      'integrations': 'Integrations',
      'studios': 'Studios',
      'billing': 'Billing',
      'analytics': 'Analytics',
      'settings': 'Settings',
      'builder': 'Builder',
      'custom': 'Custom',
      'new': 'New',
      'edit': 'Edit',
    };
    
    parts.forEach(part => {
      if (routeNames[part]) {
        breadcrumb.push(routeNames[part]);
      } else if (part.length > 0 && !part.match(/^[0-9a-f-]{36}$/)) {
        // Skip UUIDs, add other parts
        breadcrumb.push(part.charAt(0).toUpperCase() + part.slice(1));
      }
    });
    
    return breadcrumb.length > 1 ? breadcrumb : undefined;
  };

  // Don't show layout for auth pages
  if (location.pathname.startsWith('/auth')) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-[var(--si-bg)] overflow-hidden">
      {/* Sidebar */}
      <EnhancedSidebar
        currentRoute={location.pathname}
        onNavigate={handleNavigate}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        user={user ? { name: user.email?.split('@')[0] || 'User', email: user.email || '' } : null}
        onSignOut={handleSignOut}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <EnhancedHeader
          title={getPageTitle()}
          breadcrumb={getBreadcrumb()}
          onSearch={handleSearch}
          onCommandPalette={handleCommandPalette}
          user={user ? { 
            name: user.email?.split('@')[0] || 'User', 
            email: user.email || '',
            avatar: undefined
          } : null}
          onSignOut={handleSignOut}
          onSettings={handleSettings}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />
    </div>
  );
}
