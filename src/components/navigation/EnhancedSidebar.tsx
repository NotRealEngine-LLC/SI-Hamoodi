// HAMOODI SyntheTech Intelligence — Premium Sidebar Navigation
// Polished for MVP Demo - GenSpark-inspired design

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
  Sparkles,
  Plus
} from 'lucide-react';
import { BrandWordmark, BrandSignature } from '../brand/BrandComponents';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  isCollapsed = false,
  onToggleCollapse,
  user,
  onSignOut 
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isExpanded = !isCollapsed;

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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-xl shadow-lg hover:bg-[var(--si-surface-hover)] transition-all duration-200"
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
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
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
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`
          fixed lg:relative top-0 left-0 h-full z-40
          bg-[var(--si-surface)] border-r border-[var(--si-border)]
          flex flex-col overflow-hidden
          shadow-xl
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ width: isExpanded ? '260px' : '72px' }}
      >
        {/* Brand area */}
        <div className="p-5 border-b border-[var(--si-border)]">
          {isExpanded ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
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
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center p-2 mx-3 mt-3 rounded-lg hover:bg-[var(--si-surface-hover)] transition-all duration-200 group"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isExpanded ? (
                <ChevronLeft size={16} className="text-[var(--si-text-muted)] group-hover:text-[var(--si-text-primary)] transition-colors" />
              ) : (
                <ChevronRight size={16} className="text-[var(--si-text-muted)] group-hover:text-[var(--si-text-primary)] transition-colors" />
              )}
            </motion.div>
          </button>
        )}

        {/* Primary navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {primaryNav.map((item) => {
            const isActive = currentRoute === item.route;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.route}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNavClick(item.route)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-200 relative group
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#8B5CF6]/20 to-[#06B6D4]/10 text-[#8B5CF6] border border-[#8B5CF6]/30 shadow-lg shadow-[#8B5CF6]/10' 
                    : 'text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-hover)] hover:text-[var(--si-text-primary)]'
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
                    className="ml-auto px-2.5 py-0.5 text-xs font-semibold bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white rounded-full shadow-md"
                  >
                    {item.badge}
                  </motion.span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#8B5CF6] to-[#06B6D4] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}

          {/* Recent conversations section */}
          {isExpanded && recentConversations.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--si-border)]">
              <h3 className="px-3 mb-3 text-xs font-semibold text-[var(--si-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={12} />
                Recent Chats
              </h3>
              <div className="space-y-1">
                {recentConversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleNavClick(`/chat/${conv.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--si-surface-hover)] transition-all duration-200 group"
                  >
                    <MessageSquare size={14} className="text-[var(--si-text-muted)] group-hover:text-[#8B5CF6] transition-colors flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--si-text-secondary)] group-hover:text-[var(--si-text-primary)] truncate transition-colors">
                        {conv.title}
                      </p>
                      <p className="text-xs text-[var(--si-text-muted)] mt-0.5">
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
              <h3 className="px-3 mb-3 text-xs font-semibold text-[var(--si-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <FolderKanban size={12} />
                Recent Projects
              </h3>
              <div className="space-y-1">
                {recentProjects.map((project) => (
                  <motion.button
                    key={project.id}
                    whileHover={{ x: 4 }}
                    onClick={() => handleNavClick(`/projects/${project.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--si-surface-hover)] transition-all duration-200 group"
                  >
                    <FolderKanban size={14} className="text-[var(--si-text-muted)] group-hover:text-[#06B6D4] transition-colors flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--si-text-secondary)] group-hover:text-[var(--si-text-primary)] truncate transition-colors">
                        {project.title}
                      </p>
                      <p className="text-xs text-[var(--si-text-muted)] mt-0.5">
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
        <div className="p-3 border-t border-[var(--si-border)] space-y-1">
          {/* New chat button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavClick('/chat')}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#6D28D9] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus size={20} className="flex-shrink-0" />
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="text-sm font-semibold whitespace-nowrap overflow-hidden"
              >
                New Chat
              </motion.span>
            )}
          </motion.button>

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-hover)] hover:text-[var(--si-text-primary)] transition-all duration-200"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <Sun size={20} className="flex-shrink-0 text-[#F59E0B]" />
            ) : (
              <Moon size={20} className="flex-shrink-0 text-[#8B5CF6]" />
            )}
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-hover)] hover:text-[var(--si-text-primary)] transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#06B6D4] flex items-center justify-center flex-shrink-0 shadow-md">
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--si-text-muted)] hover:bg-[var(--si-danger)]/10 hover:text-[var(--si-danger)] transition-all duration-200"
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
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shadow-lg shadow-[#10B981]/50" />
              <span className="text-xs text-[var(--si-text-muted)] font-medium">
                AI Connected
              </span>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
