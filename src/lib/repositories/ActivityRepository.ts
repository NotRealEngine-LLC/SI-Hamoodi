// HAMOODI SyntheTech Intelligence — Activity Repository
// Part 01: Local-first activity tracking with IndexedDB

import { openDB, IDBPDatabase } from 'idb';

export interface ActivityEvent {
  id: string;
  type: string;
  subjectId?: string;
  summary: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

const DB_NAME = 'hamoodi-si-db';
const DB_VERSION = 1;
const ACTIVITY_STORE = 'activity';

export class ActivityRepository {
  private db: IDBPDatabase | null = null;

  async init() {
    if (this.db) return;
    
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db: any) {
        if (!db.objectStoreNames.contains(ACTIVITY_STORE)) {
          db.createObjectStore(ACTIVITY_STORE, { keyPath: 'id' });
        }
      },
    });
  }

  async getAll(): Promise<ActivityEvent[]> {
    await this.init();
    if (!this.db) return [];
    
    const activities = await this.db.getAll(ACTIVITY_STORE);
    return activities.sort((a: ActivityEvent, b: ActivityEvent) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async create(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const newEvent: ActivityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    
    await this.db.add(ACTIVITY_STORE, newEvent);
    
    // Keep only last 1000 activities
    const all = await this.db.getAll(ACTIVITY_STORE);
    if (all.length > 1000) {
      const sorted = all.sort((a: ActivityEvent, b: ActivityEvent) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const toDelete = sorted.slice(0, all.length - 1000);
      for (const event of toDelete) {
        await this.db.delete(ACTIVITY_STORE, event.id);
      }
    }
    
    return newEvent;
  }

  async delete(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.delete(ACTIVITY_STORE, id);
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.clear(ACTIVITY_STORE);
  }

  async getByType(type: string): Promise<ActivityEvent[]> {
    const all = await this.getAll();
    return all.filter(a => a.type === type);
  }

  async getBySubject(subjectId: string): Promise<ActivityEvent[]> {
    const all = await this.getAll();
    return all.filter(a => a.subjectId === subjectId);
  }
}

export const activityRepository = new ActivityRepository();
