// HAMOODI SyntheTech Intelligence — Model Registry
// Phase 05: Dynamic model discovery and capability tracking

import { AIModel, ModelCapability, CapabilitySupport } from './types';
import { puterProvider } from './providers/puter';

export class ModelRegistry {
  private models: AIModel[] = [];
  private lastUpdated: string = '';
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  async initialize(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      this.models = await puterProvider.listModels();
      this.lastUpdated = new Date().toISOString();
      this.cacheTimestamp = Date.now();
    } catch (error) {
      console.error('Failed to refresh model registry:', error);
      throw error;
    }
  }

  getModels(): AIModel[] {
    return this.models;
  }

  getLastUpdated(): string {
    return this.lastUpdated;
  }

  getModel(id: string): AIModel | undefined {
    return this.models.find(m => m.id === id);
  }

  searchModels(query: string): AIModel[] {
    const lowerQuery = query.toLowerCase();
    return this.models.filter(m => 
      m.displayName.toLowerCase().includes(lowerQuery) ||
      m.providerName.toLowerCase().includes(lowerQuery) ||
      (m.description && m.description.toLowerCase().includes(lowerQuery))
    );
  }

  filterByCapability(capability: ModelCapability): AIModel[] {
    return this.models.filter(m => 
      m.capabilities[capability] === 'supported' ||
      m.capabilities[capability] === 'unknown' // Include unknown as potentially supported
    );
  }

  filterByProvider(provider: string): AIModel[] {
    return this.models.filter(m => m.providerName.toLowerCase() === provider.toLowerCase());
  }

  getAvailableModels(): AIModel[] {
    return this.models.filter(m => m.availability === 'available');
  }

  async supportsCapability(modelId: string, capability: ModelCapability): Promise<CapabilitySupport> {
    const model = this.getModel(modelId);
    if (!model) {
      return 'unknown';
    }
    return model.capabilities[capability] || 'unknown';
  }

  getModelsByCapability(capability: ModelCapability): AIModel[] {
    return this.models.filter(m => 
      m.capabilities[capability] === 'supported'
    );
  }

  getRecommendedModels(): AIModel[] {
    // Return models that are generally good for most use cases
    const recommended = ['gpt-4o-mini', 'claude-3-5-sonnet', 'gemini-2.0-flash'];
    return recommended
      .map(id => this.getModel(id))
      .filter((m): m is AIModel => m !== undefined);
  }

  getFastModels(): AIModel[] {
    // Models known for speed (smaller, optimized)
    const fast = ['gpt-4o-mini', 'claude-3-5-haiku', 'gemini-2.0-flash'];
    return fast
      .map(id => this.getModel(id))
      .filter((m): m is AIModel => m !== undefined);
  }

  getAdvancedModels(): AIModel[] {
    // Most capable models
    const advanced = ['gpt-4o', 'claude-3-5-sonnet'];
    return advanced
      .map(id => this.getModel(id))
      .filter((m): m is AIModel => m !== undefined);
  }

  getModelsWithContextWindow(minTokens: number): AIModel[] {
    return this.models.filter(m => 
      m.contextWindow && m.contextWindow >= minTokens
    );
  }

  isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  async ensureFresh(): Promise<void> {
    if (!this.isCacheValid()) {
      await this.refresh();
    }
  }
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();
