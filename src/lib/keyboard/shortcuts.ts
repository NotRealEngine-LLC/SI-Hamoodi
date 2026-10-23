// HAMOODI SyntheTech Intelligence — Keyboard Shortcuts System
// Part 02: Centralized keyboard shortcut registry

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  id: string;
  description: string;
  keys: string[];
  action: () => void;
  scope?: 'global' | 'chat' | 'projects' | 'settings';
  condition?: () => boolean;
}

class KeyboardShortcutRegistry {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  register(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut);
  }

  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  getAll(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcut(id: string): KeyboardShortcut | undefined {
    return this.shortcuts.get(id);
  }

  private matchesKeyCombination(event: KeyboardEvent, keys: string[]): boolean {
    const requiredModifiers = {
      ctrl: false,
      shift: false,
      alt: false,
      meta: false,
    };

    const requiredKey = keys.find(k => !['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(k.toLowerCase()));

    keys.forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'ctrl') requiredModifiers.ctrl = true;
      if (lowerKey === 'shift') requiredModifiers.shift = true;
      if (lowerKey === 'alt') requiredModifiers.alt = true;
      if (lowerKey === 'meta' || lowerKey === 'cmd') requiredModifiers.meta = true;
    });

    const matchesModifiers = 
      event.ctrlKey === requiredModifiers.ctrl &&
      event.shiftKey === requiredModifiers.shift &&
      event.altKey === requiredModifiers.alt &&
      (this.isMac ? event.metaKey : event.ctrlKey) === requiredModifiers.meta;

    const matchesKey = requiredKey && event.key.toLowerCase() === requiredKey.toLowerCase();

    return matchesModifiers && !!matchesKey;
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable;

    this.shortcuts.forEach(shortcut => {
      // Check scope
      if (shortcut.scope && shortcut.scope !== 'global') {
        // Could add scope checking logic here
        return;
      }

      // Check condition
      if (shortcut.condition && !shortcut.condition()) {
        return;
      }

      // Check if shortcut requires modifiers or is a simple key
      const hasModifiers = shortcut.keys.some(k => 
        ['ctrl', 'shift', 'alt', 'meta', 'cmd'].includes(k.toLowerCase())
      );

      // Only trigger simple keys (like '/') when not in input
      if (!hasModifiers && isInput) {
        return;
      }

      if (this.matchesKeyCombination(event, shortcut.keys)) {
        event.preventDefault();
        shortcut.action();
      }
    });
  };

  getFormattedKey(keys: string[]): string {
    const modifier = this.isMac ? '⌘' : 'Ctrl';
    return keys.map(key => {
      const lower = key.toLowerCase();
      if (lower === 'ctrl' || lower === 'meta' || lower === 'cmd') return modifier;
      if (lower === 'shift') return '⇧';
      if (lower === 'alt') return this.isMac ? '⌥' : 'Alt';
      return key.toUpperCase();
    }).join(' + ');
  }
}

export const keyboardRegistry = new KeyboardShortcutRegistry();

export function useKeyboardShortcuts() {
  useEffect(() => {
    window.addEventListener('keydown', keyboardRegistry.handleKeyDown);
    return () => {
      window.removeEventListener('keydown', keyboardRegistry.handleKeyDown);
    };
  }, []);
}

// Default shortcuts registration
export function registerDefaultShortcuts(actions: {
  openCommandPalette: () => void;
  newChat: () => void;
  toggleSidebar: () => void;
  focusSearch: () => void;
  closeOverlay: () => void;
}): void {
  keyboardRegistry.register({
    id: 'command-palette',
    description: 'Open command palette',
    keys: ['ctrl', 'k'],
    action: actions.openCommandPalette,
    scope: 'global',
  });

  keyboardRegistry.register({
    id: 'new-chat',
    description: 'Start new chat',
    keys: ['ctrl', 'shift', 'o'],
    action: actions.newChat,
    scope: 'global',
  });

  keyboardRegistry.register({
    id: 'toggle-sidebar',
    description: 'Toggle sidebar',
    keys: ['ctrl', 'b'],
    action: actions.toggleSidebar,
    scope: 'global',
  });

  keyboardRegistry.register({
    id: 'focus-search',
    description: 'Focus search',
    keys: ['/'],
    action: actions.focusSearch,
    scope: 'global',
    condition: () => {
      const target = document.activeElement as HTMLElement;
      return target.tagName !== 'INPUT' && 
             target.tagName !== 'TEXTAREA' && 
             !target.isContentEditable;
    },
  });

  keyboardRegistry.register({
    id: 'close-overlay',
    description: 'Close overlay',
    keys: ['escape'],
    action: actions.closeOverlay,
    scope: 'global',
  });
}
