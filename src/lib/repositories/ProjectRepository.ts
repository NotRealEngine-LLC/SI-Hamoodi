// HAMOODI SyntheTech Intelligence — Project Repository
// Part 01: Local-first data persistence with IndexedDB

import { openDB, IDBPDatabase } from 'idb';

export interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

const DB_NAME = 'hamoodi-si-db';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

export class ProjectRepository {
  private db: IDBPDatabase | null = null;

  async init() {
    if (this.db) return;
    
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db: any) {
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        }
      },
    });
  }

  async getAll(): Promise<Project[]> {
    await this.init();
    if (!this.db) return [];
    
    const projects = await this.db.getAll(PROJECTS_STORE);
    return projects.sort((a: Project, b: Project) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getById(id: string): Promise<Project | null> {
    await this.init();
    if (!this.db) return null;
    
    return await this.db.get(PROJECTS_STORE, id);
  }

  async create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    
    await this.db.add(PROJECTS_STORE, newProject);
    return newProject;
  }

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    const existing = await this.db.get(PROJECTS_STORE, id);
    if (!existing) throw new Error('Project not found');
    
    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await this.db.put(PROJECTS_STORE, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    
    await this.db.delete(PROJECTS_STORE, id);
  }

  async search(query: string): Promise<Project[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  }
}

export const projectRepository = new ProjectRepository();
