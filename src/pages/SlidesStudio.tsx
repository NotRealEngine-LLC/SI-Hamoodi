// HAMOODI SyntheTech Intelligence — Slides Studio
// Phase 09: Presentation creation with editable slides

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Download, Save, Loader2,
  Presentation, ChevronLeft, ChevronRight, Type, Image as ImageIcon,
  Layout, Palette
} from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { artifactService } from '../lib/creation/artifact-service';
import { artifactExportService } from '../lib/creation/export-service';
import type { PresentationContent, Slide, SlideElement, SlideLayout } from '../lib/creation/types';

interface SlidesStudioProps {
  artifactId?: string;
}

export function SlidesStudio({ artifactId }: SlidesStudioProps) {
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const [title, setTitle] = useState('Untitled Presentation');
  const [isSaving, setIsSaving] = useState(false);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(artifactId || null);
  
  const [content, setContent] = useState<PresentationContent>({
    theme: {
      id: 'default',
      name: 'Default Theme',
      colors: {
        primary: '#7c3aed',
        secondary: '#4f46e5',
        background: '#ffffff',
        text: '#18181b',
        accent: '#a78bfa',
      },
      fonts: {
        heading: 'Inter',
        body: 'Inter',
      },
    },
    slides: [
      {
        id: 'slide-1',
        layout: 'title',
        elements: [
          {
            id: 'title-1',
            type: 'text',
            x: 100,
            y: 200,
            width: 800,
            height: 100,
            zIndex: 1,
            content: 'Presentation Title',
            style: { fontSize: 48, color: '#18181b', bold: true },
          },
          {
            id: 'subtitle-1',
            type: 'text',
            x: 100,
            y: 320,
            width: 800,
            height: 50,
            zIndex: 2,
            content: 'Subtitle goes here',
            style: { fontSize: 24, color: '#71717a' },
          },
        ],
      },
    ],
  });

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Load existing artifact
  useEffect(() => {
    if (artifactId && user) {
      loadArtifact(artifactId);
    }
  }, [artifactId, user]);

  const loadArtifact = async (id: string) => {
    if (!user) return;

    try {
      const artifact = await artifactService.getArtifact(user.id, id);
      if (artifact) {
        setTitle(artifact.title);
        const loadedContent = await artifactService.getArtifactContent(id);
        if (loadedContent) {
          setContent(loadedContent);
        }
        setCurrentArtifactId(id);
      }
    } catch (error) {
      console.error('Failed to load artifact:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !currentWorkspace) return;

    setIsSaving(true);
    try {
      if (currentArtifactId) {
        await artifactService.updateArtifact(user.id, currentArtifactId, {
          title,
          content,
          change_summary: 'Manual save',
        });
      } else {
        const artifact = await artifactService.createArtifact(user.id, {
          workspace_id: currentWorkspace.id,
          artifact_type: 'presentation',
          title,
          content,
        });
        setCurrentArtifactId(artifact.id);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!currentArtifactId || !user) return;

    try {
      const exportJob = await artifactExportService.exportArtifact(user.id, currentArtifactId, 'pptx');
      const downloadUrl = await artifactExportService.getExportDownloadUrl(exportJob.id);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${title}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const activeSlide = content.slides[activeSlideIndex];

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      layout: 'content',
      elements: [
        {
          id: `title-${Date.now()}`,
          type: 'text',
          x: 50,
          y: 50,
          width: 900,
          height: 80,
          zIndex: 1,
          content: 'Slide Title',
          style: { fontSize: 36, color: content.theme.colors.text, bold: true },
        },
        {
          id: `content-${Date.now()}`,
          type: 'text',
          x: 50,
          y: 150,
          width: 900,
          height: 400,
          zIndex: 2,
          content: 'Slide content goes here',
          style: { fontSize: 18, color: content.theme.colors.text },
        },
      ],
    };

    const newSlides = [...content.slides];
    newSlides.splice(activeSlideIndex + 1, 0, newSlide);
    setContent({ ...content, slides: newSlides });
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleDeleteSlide = () => {
    if (content.slides.length === 1) return;

    const newSlides = content.slides.filter((_, i) => i !== activeSlideIndex);
    setContent({ ...content, slides: newSlides });
    setActiveSlideIndex(Math.min(activeSlideIndex, newSlides.length - 1));
  };

  const handleAddElement = (type: 'text' | 'shape' | 'image') => {
    const newElement: SlideElement = {
      id: `element-${Date.now()}`,
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 400 : 200,
      height: type === 'text' ? 100 : 200,
      zIndex: activeSlide.elements.length + 1,
      content: type === 'text' ? 'New text element' : undefined,
      style: {
        fontSize: 18,
        color: content.theme.colors.text,
        backgroundColor: type === 'shape' ? content.theme.colors.primary : undefined,
      },
    };

    const newSlides = [...content.slides];
    newSlides[activeSlideIndex] = {
      ...activeSlide,
      elements: [...activeSlide.elements, newElement],
    };
    setContent({ ...content, slides: newSlides });
    setSelectedElement(newElement.id);
  };

  const handleUpdateElement = (elementId: string, updates: Partial<SlideElement>) => {
    const newSlides = [...content.slides];
    newSlides[activeSlideIndex] = {
      ...activeSlide,
      elements: activeSlide.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      ),
    };
    setContent({ ...content, slides: newSlides });
  };

  const handleDeleteElement = (elementId: string) => {
    const newSlides = [...content.slides];
    newSlides[activeSlideIndex] = {
      ...activeSlide,
      elements: activeSlide.elements.filter(el => el.id !== elementId),
    };
    setContent({ ...content, slides: newSlides });
    setSelectedElement(null);
  };

  const selectedElementData = activeSlide.elements.find(el => el.id === selectedElement);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Presentation size={20} className="text-orange-400" />
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
            placeholder="Presentation Title"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
          >
            <Download size={14} />
            <span>PPTX</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Slide Navigator */}
        <div className="w-48 border-r border-zinc-800/50 overflow-y-auto p-4 space-y-2">
          {content.slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`relative aspect-video bg-zinc-800 border-2 rounded-lg cursor-pointer overflow-hidden ${
                index === activeSlideIndex
                  ? 'border-orange-500'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
              onClick={() => setActiveSlideIndex(index)}
            >
              <div className="absolute inset-0 bg-white/5" />
              <div className="absolute bottom-1 left-1 text-xs text-zinc-400 bg-zinc-900/80 px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </motion.div>
          ))}
          <button
            onClick={handleAddSlide}
            className="w-full aspect-video bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-all"
          >
            <Plus size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Slide Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-zinc-800/50 flex items-center gap-2">
            <button
              onClick={() => handleAddElement('text')}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
            >
              <Type size={14} />
              <span>Text</span>
            </button>
            <button
              onClick={() => handleAddElement('shape')}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
            >
              <Layout size={14} />
              <span>Shape</span>
            </button>
            <button
              onClick={() => handleAddElement('image')}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
            >
              <ImageIcon size={14} />
              <span>Image</span>
            </button>
            <div className="w-px h-6 bg-zinc-700 mx-2" />
            <button
              onClick={handleDeleteSlide}
              disabled={content.slides.length === 1}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 text-red-400 text-sm rounded-lg transition-all"
            >
              <Trash2 size={14} />
              <span>Delete Slide</span>
            </button>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-zinc-900/30">
            <div
              className="relative bg-white shadow-2xl"
              style={{
                width: '1000px',
                height: '562.5px', // 16:9 aspect ratio
                backgroundColor: content.theme.colors.background,
              }}
            >
              {activeSlide.elements.map(element => (
                <motion.div
                  key={element.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`absolute cursor-move ${
                    selectedElement === element.id ? 'ring-2 ring-orange-500' : ''
                  }`}
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    zIndex: element.zIndex,
                  }}
                  onClick={() => setSelectedElement(element.id)}
                >
                  {element.type === 'text' && (
                    <div
                      style={{
                        fontSize: element.style?.fontSize,
                        color: element.style?.color,
                        fontWeight: element.style?.bold ? 'bold' : 'normal',
                        fontStyle: element.style?.italic ? 'italic' : 'normal',
                        textDecoration: element.style?.underline ? 'underline' : 'none',
                      }}
                    >
                      {element.content}
                    </div>
                  )}
                  {element.type === 'shape' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: element.style?.backgroundColor,
                        borderRadius: element.style?.borderRadius,
                      }}
                    />
                  )}
                  {element.type === 'image' && (
                    <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                      <ImageIcon size={32} className="text-zinc-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Element Properties */}
          <AnimatePresence>
            {selectedElementData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="border-t border-zinc-800/50 p-4 bg-zinc-900/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white">Element Properties</h3>
                  <button
                    onClick={() => handleDeleteElement(selectedElementData.id)}
                    className="p-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Position X</label>
                    <input
                      type="number"
                      value={selectedElementData.x}
                      onChange={e => handleUpdateElement(selectedElementData.id, { x: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Position Y</label>
                    <input
                      type="number"
                      value={selectedElementData.y}
                      onChange={e => handleUpdateElement(selectedElementData.id, { y: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Width</label>
                    <input
                      type="number"
                      value={selectedElementData.width}
                      onChange={e => handleUpdateElement(selectedElementData.id, { width: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Height</label>
                    <input
                      type="number"
                      value={selectedElementData.height}
                      onChange={e => handleUpdateElement(selectedElementData.id, { height: Number(e.target.value) })}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                    />
                  </div>
                  {selectedElementData.type === 'text' && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs text-zinc-500 mb-1">Content</label>
                        <textarea
                          value={selectedElementData.content || ''}
                          onChange={e => handleUpdateElement(selectedElementData.id, { content: e.target.value })}
                          className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white resize-none"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Font Size</label>
                        <input
                          type="number"
                          value={selectedElementData.style?.fontSize || 18}
                          onChange={e => handleUpdateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, fontSize: Number(e.target.value) },
                          })}
                          className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Color</label>
                        <input
                          type="color"
                          value={selectedElementData.style?.color || '#000000'}
                          onChange={e => handleUpdateElement(selectedElementData.id, {
                            style: { ...selectedElementData.style, color: e.target.value },
                          })}
                          className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
