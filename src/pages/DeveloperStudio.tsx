// HAMOODI SyntheTech Intelligence — Developer Studio
// Phase 09: Code editing and project management

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { 
  Code2, Plus, Trash2, Download, Save, Loader2,
  File, Folder, ChevronRight, ChevronDown, FileText
} from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { artifactService } from '../lib/creation/artifact-service';
import { artifactExportService } from '../lib/creation/export-service';
import type { CodeProjectContent, CodeFile } from '../lib/creation/types';

interface DeveloperStudioProps {
  artifactId?: string;
}

export function DeveloperStudio({ artifactId }: DeveloperStudioProps) {
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const [title, setTitle] = useState('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(artifactId || null);
  
  const [content, setContent] = useState<CodeProjectContent>({
    files: [
      {
        id: 'file-1',
        path: '/index.js',
        language: 'javascript',
        content: '// Welcome to HAMOODI Developer Studio\n\nconsole.log("Hello, World!");',
        version: 1,
        updated_at: new Date().toISOString(),
      },
    ],
    activeFileId: 'file-1',
  });

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

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
          artifact_type: 'code_project',
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
      const exportJob = await artifactExportService.exportArtifact(user.id, currentArtifactId, 'zip');
      const downloadUrl = await artifactExportService.getExportDownloadUrl(exportJob.id);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${title}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const activeFile = content.files.find(f => f.id === content.activeFileId);

  const handleAddFile = () => {
    const fileName = prompt('Enter file name (e.g., /src/app.js):');
    if (!fileName) return;

    const language = getLanguageFromPath(fileName);
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      path: fileName,
      language,
      content: `// ${fileName}\n`,
      version: 1,
      updated_at: new Date().toISOString(),
    };

    setContent({
      ...content,
      files: [...content.files, newFile],
      activeFileId: newFile.id,
    });
  };

  const handleDeleteFile = (fileId: string) => {
    if (content.files.length === 1) {
      alert('Cannot delete the last file');
      return;
    }

    const newFiles = content.files.filter(f => f.id !== fileId);
    const newActiveId = content.activeFileId === fileId ? newFiles[0].id : content.activeFileId;

    setContent({
      ...content,
      files: newFiles,
      activeFileId: newActiveId,
    });
  };

  const handleFileChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;

    const newFiles = content.files.map(f =>
      f.id === activeFile.id
        ? { ...f, content: value, version: f.version + 1, updated_at: new Date().toISOString() }
        : f
    );

    setContent({ ...content, files: newFiles });
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell',
      bash: 'shell',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  // Build file tree
  const fileTree = buildFileTree(content.files);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Code2 size={20} className="text-zinc-400" />
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
            placeholder="Project Title"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
          >
            <Download size={14} />
            <span>Export ZIP</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 border-r border-zinc-800/50 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-zinc-800/50 flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 uppercase">Files</span>
            <button
              onClick={handleAddFile}
              className="p-1 hover:bg-zinc-800 rounded transition-all"
            >
              <Plus size={14} className="text-zinc-400" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <FileTreeView
              tree={fileTree}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
              onFileClick={(fileId) => setContent({ ...content, activeFileId: fileId })}
              onFileDelete={handleDeleteFile}
              activeFileId={content.activeFileId}
            />
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeFile ? (
            <>
              {/* File Tabs */}
              <div className="px-4 py-2 border-b border-zinc-800/50 flex items-center gap-2 overflow-x-auto">
                {content.files.map(file => (
                  <button
                    key={file.id}
                    onClick={() => setContent({ ...content, activeFileId: file.id })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                      file.id === content.activeFileId
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:bg-zinc-800/50'
                    }`}
                  >
                    <File size={12} />
                    <span>{file.path.split('/').pop()}</span>
                  </button>
                ))}
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={activeFile.language}
                  value={activeFile.content}
                  onChange={handleFileChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Code2 size={48} className="text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Select a file to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// File Tree Types
interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  fileId?: string;
  children?: FileTreeNode[];
}

// Build file tree from flat file list
function buildFileTree(files: CodeFile[]): FileTreeNode {
  const root: FileTreeNode = {
    name: '/',
    path: '/',
    type: 'folder',
    children: [],
  };

  files.forEach(file => {
    const parts = file.path.split('/').filter(p => p);
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const path = '/' + parts.slice(0, index + 1).join('/');

      if (isFile) {
        current.children!.push({
          name: part,
          path,
          type: 'file',
          fileId: file.id,
        });
      } else {
        let folder = current.children!.find(c => c.name === part && c.type === 'folder');
        if (!folder) {
          folder = {
            name: part,
            path,
            type: 'folder',
            children: [],
          };
          current.children!.push(folder);
        }
        current = folder;
      }
    });
  });

  return root;
}

// File Tree View Component
function FileTreeView({
  tree,
  expandedFolders,
  onToggleFolder,
  onFileClick,
  onFileDelete,
  activeFileId,
  level = 0,
}: {
  tree: FileTreeNode;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onFileClick: (fileId: string) => void;
  onFileDelete: (fileId: string) => void;
  activeFileId?: string;
  level?: number;
}) {
  if (!tree.children) return null;

  return (
    <div className="space-y-0.5">
      {tree.children.map(node => (
        <div key={node.path}>
          {node.type === 'folder' ? (
            <>
              <button
                onClick={() => onToggleFolder(node.path)}
                className="w-full flex items-center gap-2 px-2 py-1 hover:bg-zinc-800/50 rounded text-left transition-all"
                style={{ paddingLeft: `${level * 12 + 8}px` }}
              >
                {expandedFolders.has(node.path) ? (
                  <ChevronDown size={12} className="text-zinc-500" />
                ) : (
                  <ChevronRight size={12} className="text-zinc-500" />
                )}
                <Folder size={14} className="text-blue-400" />
                <span className="text-sm text-zinc-300">{node.name}</span>
              </button>
              {expandedFolders.has(node.path) && (
                <FileTreeView
                  tree={node}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onFileClick={onFileClick}
                  onFileDelete={onFileDelete}
                  activeFileId={activeFileId}
                  level={level + 1}
                />
              )}
            </>
          ) : (
            <div className="flex items-center group">
              <button
                onClick={() => node.fileId && onFileClick(node.fileId)}
                className={`flex-1 flex items-center gap-2 px-2 py-1 hover:bg-zinc-800/50 rounded text-left transition-all ${
                  node.fileId === activeFileId ? 'bg-zinc-800' : ''
                }`}
                style={{ paddingLeft: `${level * 12 + 20}px` }}
              >
                <FileText size={14} className="text-zinc-400" />
                <span className="text-sm text-zinc-300 truncate">{node.name}</span>
              </button>
              <button
                onClick={() => node.fileId && onFileDelete(node.fileId)}
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600/20 rounded transition-all"
              >
                <Trash2 size={12} className="text-red-400" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
