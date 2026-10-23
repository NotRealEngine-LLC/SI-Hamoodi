// HAMOODI SyntheTech Intelligence — Creative Studio
// Phase 09: AI image generation and asset management

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, Download, Trash2, Loader2, Sparkles,
  Plus, Grid, List, Search, Filter
} from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { artifactService } from '../lib/creation/artifact-service';
import { useFiles } from '../contexts/FileContext';
import type { ImageContent } from '../lib/creation/types';

interface CreativeStudioProps {
  artifactId?: string;
}

export function CreativeStudio({ artifactId }: CreativeStudioProps) {
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const { uploadFile } = useFiles();
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Load existing assets
  useEffect(() => {
    if (user && currentWorkspace) {
      loadAssets();
    }
  }, [user, currentWorkspace]);

  const loadAssets = async () => {
    if (!user || !currentWorkspace) return;

    try {
      const imageArtifacts = await artifactService.listArtifacts(user.id, {
        workspace_id: currentWorkspace.id,
        artifact_type: 'image',
        limit: 50,
      });
      setAssets(imageArtifacts);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user || !currentWorkspace) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      // Check if Puter is available
      if (typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter.js not available');
      }

      // Check if user is signed in to Puter
      const isSignedIn = await window.puter.auth.isSignedIn();
      if (!isSignedIn) {
        await window.puter.auth.signIn();
      }

      // Generate image using Puter AI
      // Note: Puter.js image generation API may vary by version
      // Using a placeholder implementation for now
      const response = await (window.puter.ai as any).txt2img?.(prompt);
      
      if (response && response.src) {
        setGeneratedImage(response.src);
        
        // Save as artifact
        const imageContent: ImageContent = {
          storage_path: response.src,
          width: response.width || 1024,
          height: response.height || 1024,
          mime_type: 'image/png',
          prompt,
          model: 'dall-e-3',
        };

        await artifactService.createArtifact(user.id, {
          workspace_id: currentWorkspace.id,
          artifact_type: 'image',
          title: prompt.substring(0, 50),
          description: prompt,
          content: imageContent,
        });

        // Reload assets
        await loadAssets();
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      alert(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (asset: any) => {
    try {
      const content = await artifactService.getArtifactContent(asset.id);
      if (content && content.storage_path) {
        const a = document.createElement('a');
        a.href = content.storage_path;
        a.download = `${asset.title}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await artifactService.deleteArtifact(user.id, assetId);
      await loadAssets();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-zinc-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SI Creative Studio</h1>
            <p className="text-sm text-zinc-500">AI-powered image generation and asset management</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Generation */}
        <div className="w-96 border-r border-zinc-800/50 flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Image Prompt
              </label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="w-full h-32 px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-pink-500/25"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Generate Image</span>
                </>
              )}
            </button>

            {/* Generated Image Preview */}
            <AnimatePresence>
              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="space-y-3"
                >
                  <div className="aspect-square bg-zinc-800 rounded-lg overflow-hidden">
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={generatedImage}
                      download="generated-image.png"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm rounded-lg transition-all"
                    >
                      <Download size={14} />
                      <span>Download</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel - Asset Library */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search assets..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-pink-500/20 text-pink-400' : 'text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-pink-500/20 text-pink-400' : 'text-zinc-500 hover:bg-zinc-800'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Asset Grid/List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredAssets.length === 0 ? (
              <div className="text-center py-16">
                <ImageIcon size={48} className="text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-zinc-400 mb-2">
                  {searchQuery ? 'No assets match your search' : 'No assets yet'}
                </h3>
                <p className="text-sm text-zinc-500">
                  {searchQuery ? 'Try a different search term' : 'Generate your first image to get started'}
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAssets.map(asset => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative aspect-square bg-zinc-800 rounded-lg overflow-hidden"
                  >
                    {asset.content?.storage_path && (
                      <img
                        src={asset.content.storage_path}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-medium text-white truncate mb-1">
                          {asset.title}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownload(asset)}
                            className="flex-1 px-2 py-1 bg-pink-600 hover:bg-pink-500 text-white text-xs rounded transition-all"
                          >
                            <Download size={12} className="inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id)}
                            className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-all"
                          >
                            <Trash2 size={12} className="inline" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map(asset => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-4 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg transition-all"
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0">
                      {asset.content?.storage_path && (
                        <img
                          src={asset.content.storage_path}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{asset.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{asset.description}</p>
                      <p className="text-xs text-zinc-600 mt-1">
                        {new Date(asset.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(asset)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                      >
                        <Download size={14} className="text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-all"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
