// HAMOODI SyntheTech Intelligence — Docs Studio
// Phase 09: Rich text document editing with Tiptap

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { motion } from 'framer-motion';
import { 
  Save, Download, Loader2, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Heading1, Heading2, Heading3, Quote, Link2,
  Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, Table as TableIcon,
  Undo, Redo, FileText
} from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { artifactService } from '../lib/creation/artifact-service';
import { artifactExportService } from '../lib/creation/export-service';

interface DocsStudioProps {
  artifactId?: string;
}

export function DocsStudio({ artifactId }: DocsStudioProps) {
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const [title, setTitle] = useState('Untitled Document');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(artifactId || null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
    ],
    content: '<p>Start writing your document...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[500px] p-6',
      },
    },
  });

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
        const content = await artifactService.getArtifactContent(id);
        if (editor && content) {
          editor.commands.setContent(content);
        }
        setCurrentArtifactId(id);
      }
    } catch (error) {
      console.error('Failed to load artifact:', error);
    }
  };

  const handleSave = async () => {
    if (!editor || !user || !currentWorkspace) return;

    setIsSaving(true);
    try {
      const content = editor.getJSON();

      if (currentArtifactId) {
        // Update existing artifact
        await artifactService.updateArtifact(user.id, currentArtifactId, {
          title,
          content,
          change_summary: 'Manual save',
        });
      } else {
        // Create new artifact
        const artifact = await artifactService.createArtifact(user.id, {
          workspace_id: currentWorkspace.id,
          artifact_type: 'document',
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

  const handleExport = async (format: 'docx' | 'pdf' | 'md') => {
    if (!currentArtifactId) return;

    setIsExporting(true);
    try {
      const exportJob = await artifactExportService.exportArtifact(user!.id, currentArtifactId, format);
      const downloadUrl = await artifactExportService.getExportDownloadUrl(exportJob.id);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${title}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <FileText size={20} className="text-blue-400" />
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
            placeholder="Document Title"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('md')}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-sm rounded-lg transition-all"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-zinc-800/50 flex items-center gap-1 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          title="Link"
        >
          <Link2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter image URL:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          title="Image"
        >
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          title="Table"
        >
          <TableIcon size={16} />
        </ToolbarButton>

        <div className="w-px h-6 bg-zinc-700 mx-2" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={16} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto bg-zinc-900/30">
        <div className="max-w-4xl mx-auto py-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-all ${
        active
          ? 'bg-blue-500/20 text-blue-400'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
