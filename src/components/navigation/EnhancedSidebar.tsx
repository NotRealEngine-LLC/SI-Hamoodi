// HAMOODI SyntheTech Intelligence — Enhanced Sidebar Navigation
// Part 01: Professional interactive sidebar with animations

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MessageSquare, 
  FolderKanban, 
  Activity, 
  Wrench, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { BrandWordmark, BrandSignature } from '../brand/BrandComponents';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  user?: { name: string; email: string } | null;
  onSignOut?: () => void;
}

interface NavItem {
  icon: any;
  label: string;
  route: string;
  badge?: string;
}

export function EnhancedSidebar({ 
  currentRoute, 
  onNavigate, 
  isDark, 
  onToggleTheme,
  user,
  onSignOut 
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const primaryNav: NavItem[] = [
    { icon: Home, label: 'Home', route: '/' },
    { icon: MessageSquare, label: 'New Chat', route: '/chat', badge: 'New' },
    { icon: FolderKanban, label: 'Projects', route: '/projects' },
    { icon: Activity, label: 'Activity', route: '/activity' },
    { icon: Wrench, label: 'Tools', route: '/tools' },
    { icon: Settings, label: 'Settings', route: '/settings' },
  ];

  const recentConversations = [
    { id: '1', title: 'AI Architecture Discussion', time: '2h ago' },
    { id: '2', title: 'Code Review Session', time: '5h ago' },
    { id: '3', title: 'Project Planning', time: '1d ago' },
  ];

  const recentProjects = [
    { id: '1', title: 'HAMOODI SI Platform', status: 'Active' },
    { id: '2', title: 'Research Dashboard', status: 'Draft' },
  ];

  const handleNavClick = (route: string) => {
    onNavigate(route);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isExpanded ? 'var(--si-sidebar-expanded)' : 'var(--si-sidebar-collapsed)',
          x: 0
        }}
        className={`
          fixed lg:relative top-0 left-0 h-full z-40
          bg-[var(--si-surface)] border-r border-[var(--si-border)]
          flex flex-col overflow-hidden
          transition-all duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: isExpanded ? '256px' : '72px' }}
      >
        {/* Brand area */}
        <div className="p-4 border-b border-[var(--si-border)]">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <BrandWordmark />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center"
            >
              <BrandSignature />
            </motion.div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="hidden lg:flex items-center justify-center p-2 mx-2 mt-2 rounded-lg hover:bg-[var(--si-surface-interactive)] transition-colors"
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Primary navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {primaryNav.map((item) => {
            const isActive = currentRoute === item.route;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.route}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavClick(item.route)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#9378ff]/20 to-[#52dad5]/10 text-[#9378ff] border border-[#9378ff]/30' 
                    : 'text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] hover:text-[var(--si-text-primary)]'
                  }
                `}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon size={20} className="flex-shrink-0" />
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && isExpanded && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto px-2 py-0.5 text-xs font-medium bg-[#9378ff] text-white rounded-full"
                  >
                    {item.badge}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#9378ff] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Recent conversations section */}
          {isExpanded && recentConversations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--si-border)]">
              <h3 className="px-3 mb-2 text-xs font-semibold text-[var(--si-text-muted)] uppercase tracking-wider">
                Recent Chats
              </h3>
              <div className="space-y-1">
                {recentConversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    whileHover={{ x: 2 }}
                    onClick={() => handleNavClick(`/chat/${conv.id}`)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-[var(--si-surface-interactive)] transition-colors group"
                  >
                    <MessageSquare size={14} className="text-[var(--si-text-muted)] group-hover:text-[#9378ff] transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--si-text-secondary)] group-hover:text-[var(--si-text-primary)] truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-[var(--si-text-muted)]">
                        {conv.time}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Recent projects section */}
          {isExpanded && recentProjects.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--si-border)]">
              <h3 className="px-3 mb-2 text-xs font-semibold text-[var(--si-text-muted)] uppercase tracking-wider">
                Recent Projects
              </h3>
              <div className="space-y-1">
                {recentProjects.map((project) => (
                  <motion.button
                    key={project.id}
                    whileHover={{ x: 2 }}
                    onClick={() => handleNavClick(`/projects/${project.id}`)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-[var(--si-surface-interactive)] transition-colors group"
                  >
                    <FolderKanban size={14} className="text-[var(--si-text-muted)] group-hover:text-[#52dad5] transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--si-text-secondary)] group-hover:text-[var(--si-text-primary)] truncate">
                        {project.title}
                      </p>
                      <p className="text-xs text-[var(--si-text-muted)]">
                        {project.status}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-[var(--si-border)] space-y-1">
          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] hover:text-[var(--si-text-primary)] transition-all"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={20} className="flex-shrink-0" /> : <Moon size={20} className="flex-shrink-0" />}
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User account */}
          {user && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavClick('/settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] hover:text-[var(--si-text-primary)] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9378ff] to-[#52dad5] flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 min-w-0 text-left overflow-hidden"
                  >
                    <p className="text-sm font-medium text-[var(--si-text-primary)] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--si-text-muted)] truncate">
                      {user.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Sign out */}
          {user && onSignOut && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--si-text-muted)] hover:bg-[var(--si-danger)]/10 hover:text-[var(--si-danger)] transition-all"
              title="Sign out"
            >
              <LogOut size={20} className="flex-shrink-0" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Puter connection status */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-3 py-2 mt-2"
            >
              <div className="w-2 h-2 rounded-full bg-[#59d9a7] animate-pulse" />
              <span className="text-xs text-[var(--si-text-muted)]">
                AI Connected
              </span>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
