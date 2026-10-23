// HAMOODI SyntheTech Intelligence — Enhanced Application Header
// Part 01: Dynamic header with contextual actions

import { motion } from 'framer-motion';
import { 
  Search, 
  Command,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { BrandSignature } from '../brand/BrandComponents';

interface HeaderProps {
  title?: string;
  breadcrumb?: string[];
  onSearch?: () => void;
  onCommandPalette?: () => void;
  user?: { name: string; email: string; avatar?: string } | null;
  onSignOut?: () => void;
  onSettings?: () => void;
}

export function EnhancedHeader({
  title,
  breadcrumb,
  onSearch,
  onCommandPalette,
  user,
  onSignOut,
  onSettings
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState(3); // Mock notification count

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 h-[var(--si-header-height)] bg-[var(--si-surface)]/80 backdrop-blur-xl border-b border-[var(--si-border)]"
    >
      <div className="h-full px-6 flex items-center justify-between gap-4">
        {/* Left section - Title and breadcrumb */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile brand */}
          <div className="lg:hidden">
            <BrandSignature />
          </div>

          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <nav className="hidden sm:flex items-center gap-2 text-sm">
              {breadcrumb.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <span className="text-[var(--si-text-muted)]">/</span>
                  )}
                  <span className={index === breadcrumb.length - 1 ? 'text-[var(--si-text-primary)] font-medium' : 'text-[var(--si-text-muted)]'}>
                    {item}
                  </span>
                </div>
              ))}
            </nav>
          )}

          {/* Page title */}
          {title && !breadcrumb && (
            <h1 className="text-lg font-semibold text-[var(--si-text-primary)] truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSearch}
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-[var(--si-surface-interactive)] hover:bg-[var(--si-surface-elevated)] border border-[var(--si-border)] rounded-xl text-sm text-[var(--si-text-muted)] transition-all"
            aria-label="Search"
          >
            <Search size={16} />
            <span className="hidden lg:inline">Search...</span>
            <kbd className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--si-surface)] border border-[var(--si-border)] rounded text-xs">
              <Command size={12} />
              <span>K</span>
            </kbd>
          </motion.button>

          {/* Command palette button (mobile) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCommandPalette}
            className="md:hidden p-2 bg-[var(--si-surface-interactive)] hover:bg-[var(--si-surface-elevated)] border border-[var(--si-border)] rounded-xl text-[var(--si-text-secondary)] transition-all"
            aria-label="Command palette"
          >
            <Command size={18} />
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 bg-[var(--si-surface-interactive)] hover:bg-[var(--si-surface-elevated)] border border-[var(--si-border)] rounded-xl text-[var(--si-text-secondary)] transition-all"
            aria-label={`Notifications${notifications > 0 ? ` (${notifications} unread)` : ''}`}
          >
            <Bell size={18} />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--si-danger)] text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {notifications}
              </motion.span>
            )}
          </motion.button>

          {/* User menu */}
          {user ? (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-2 py-1.5 bg-[var(--si-surface-interactive)] hover:bg-[var(--si-surface-elevated)] border border-[var(--si-border)] rounded-xl transition-all"
                aria-label="User menu"
                aria-expanded={showUserMenu}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9378ff] to-[#52dad5] flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-[var(--si-text-primary)] truncate max-w-[120px]">
                    {user.name}
                  </p>
                </div>
                <ChevronDown size={14} className={`text-[var(--si-text-muted)] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </motion.button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* User info */}
                    <div className="p-4 border-b border-[var(--si-border)]">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#9378ff] to-[#52dad5] flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--si-text-primary)] truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-[var(--si-text-muted)] truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          onSettings?.();
                          setShowUserMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--si-text-secondary)] hover:bg-[var(--si-surface-interactive)] hover:text-[var(--si-text-primary)] transition-all"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      
                      {onSignOut && (
                        <button
                          onClick={() => {
                            onSignOut();
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--si-danger)] hover:bg-[var(--si-danger)]/10 transition-all"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/auth/signin'}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9378ff] to-[#7c5cff] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <User size={16} />
              <span className="hidden sm:inline">Sign In</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
