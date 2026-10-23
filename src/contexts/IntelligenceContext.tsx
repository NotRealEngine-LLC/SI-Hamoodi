// HAMOODI SyntheTech Intelligence — Intelligence Context
// Phase 05: React context for AI service access

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { siIntelligenceService } from '../lib/intelligence/service';
import { modelRegistry } from '../lib/intelligence/model-registry';
import { puterProvider } from '../lib/intelligence/providers/puter';
import { AIModel, GenerationEvent, AIPreset, ContextScope } from '../lib/intelligence/types';
import { useAuth } from './AuthContext';

interface IntelligenceContextValue {
  // Models
  models: AIModel[];
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  refreshModels: () => Promise<void>;
  
  // Generation
  isGenerating: boolean;
  streamingContent: string;
  generate: (
    scope: ContextScope,
    userMessage: string,
    preset?: AIPreset
  ) => Promise<void>;
  stream: (
    scope: ContextScope,
    userMessage: string,
    preset?: AIPreset
  ) => AsyncIterable<GenerationEvent>;
  cancelGeneration: () => void;
  
  // Presets
  selectedPreset: AIPreset;
  setSelectedPreset: (preset: AIPreset) => void;
  
  // Status
  isPuterAuthenticated: boolean;
  authenticatePuter: () => Promise<void>;
  error: string | null;
}

const IntelligenceContext = createContext<IntelligenceContextValue | null>(null);

export function IntelligenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [selectedPreset, setSelectedPreset] = useState<AIPreset>('general');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isPuterAuthenticated, setIsPuterAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        await siIntelligenceService.initialize();
        setModels(modelRegistry.getModels());
        
        const authenticated = await puterProvider.isAuthenticated();
        setIsPuterAuthenticated(authenticated);
      } catch (err) {
        console.error('Intelligence service initialization failed:', err);
        setError('Failed to initialize AI service');
      }
    };

    init();
  }, []);

  // Check Puter auth status periodically
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await puterProvider.isAuthenticated();
      setIsPuterAuthenticated(authenticated);
    };

    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshModels = useCallback(async () => {
    try {
      await modelRegistry.refresh();
      setModels(modelRegistry.getModels());
    } catch (err) {
      setError('Failed to refresh models');
    }
  }, []);

  const generate = useCallback(async (
    scope: ContextScope,
    userMessage: string,
    preset?: AIPreset
  ) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsGenerating(true);
    setStreamingContent('');
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const result = await siIntelligenceService.generate(
        scope,
        user.id,
        userMessage,
        selectedModel,
        preset || selectedPreset,
        controller.signal
      );

      setStreamingContent(result.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [user, selectedModel, selectedPreset]);

  const stream = useCallback(async function* (
    scope: ContextScope,
    userMessage: string,
    preset?: AIPreset
  ): AsyncIterable<GenerationEvent> {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsGenerating(true);
    setStreamingContent('');
    setError(null);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      for await (const event of siIntelligenceService.stream(
        scope,
        user.id,
        userMessage,
        selectedModel,
        preset || selectedPreset,
        controller.signal
      )) {
        if (event.type === 'generation.text_delta') {
          setStreamingContent(prev => prev + event.delta);
        }
        yield event;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed';
      setError(message);
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  }, [user, selectedModel, selectedPreset]);

  const cancelGeneration = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsGenerating(false);
    }
  }, [abortController]);

  const authenticatePuter = useCallback(async () => {
    try {
      await puterProvider.authenticate();
      setIsPuterAuthenticated(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    }
  }, []);

  return (
    <IntelligenceContext.Provider value={{
      models,
      selectedModel,
      setSelectedModel,
      refreshModels,
      isGenerating,
      streamingContent,
      generate,
      stream,
      cancelGeneration,
      selectedPreset,
      setSelectedPreset,
      isPuterAuthenticated,
      authenticatePuter,
      error,
    }}>
      {children}
    </IntelligenceContext.Provider>
  );
}

export function useIntelligence(): IntelligenceContextValue {
  const context = useContext(IntelligenceContext);
  if (!context) {
    throw new Error('useIntelligence must be used within IntelligenceProvider');
  }
  return context;
}
