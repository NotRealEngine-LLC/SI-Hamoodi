// HAMOODI SyntheTech Intelligence — Conversation Repository
// Part 01: Local-first data persistence with IndexedDB

import { openDB, IDBPDatabase } from 'idb';

export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  summary?: string;
  modelId?: string;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'hamoodi-si-db';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';

export class ConversationRepository {
  private db: IDBPDatabase | null = null;

  async init() {
    if (this.db) return;
    
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db: any) {
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
        }
      },
    });
  }

  async getAll(): Promise<Conversation[]> {
    await this.init();
    if (!this.db) return [];
    
    const conversations = await this.db.getAll(CONVERSATIONS_STORE);
    return conversations.sort((a: Conversation, b: Conversation) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getById(id: string): Promise<Conversation | null> {
    await this.init();
    if (!this.db) return null;
    
    return await this.db.get(CONVERSATIONS_STORE, id);
  }

  async create(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Conversation> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const newConversation: Conversation = {
      ...conversation,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    
    await this.db.add(CONVERSATIONS_STORE, newConversation);
    return newConversation;
  }

  async update(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const existing = await this.db.get(CONVERSATIONS_STORE, id);
    if (!existing) throw new Error('Conversation not found');
    
    const updated: Conversation = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.db.put(CONVERSATIONS_STORE, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.delete(CONVERSATIONS_STORE, id);
  }

  async search(query: string): Promise<Conversation[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) ||
      c.summary?.toLowerCase().includes(lowerQuery)
    );
  }

  async getByProject(projectId: string): Promise<Conversation[]> {
    const all = await this.getAll();
    return all.filter(c => c.projectId === projectId);
  }
}

export const conversationRepository = new ConversationRepository();
