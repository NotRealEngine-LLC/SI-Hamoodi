// HAMOODI SyntheTech Intelligence — Preferences Repository
// Part 01: Local-first preferences persistence with localStorage

export interface Preferences {
  theme: 'dark' | 'light' | 'system';
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
  defaultModel: string;
  streamResponses: boolean;
}

const STORAGE_KEY = 'hamoodi-si-preferences';

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  reducedMotion: false,
  sidebarCollapsed: false,
  defaultModel: 'gpt-4o-mini',
  streamResponses: true,
};

export class PreferencesRepository {
  async get(): Promise<Preferences | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  }

  async save(preferences: Preferences): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  async update(updates: Partial<Preferences>): Promise<Preferences> {
    const current = (await this.get()) || DEFAULT_PREFERENCES;
    const updated = { ...current, ...updates };
    await this.save(updated);
    return updated;
  }

  async reset(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
      throw error;
    }
  }

  async exportAll(): Promise<any> {
    const preferences = await this.get();
    return {
      preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  async clearAll(): Promise<void> {
    try {
      localStorage.clear();
      if (window.indexedDB) {
        // Clear IndexedDB databases
        const databases = await window.indexedDB.databases();
        for (const db of databases) {
          if (db.name && db.name.startsWith('hamoodi-si-')) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

export const preferencesRepository = new PreferencesRepository();
