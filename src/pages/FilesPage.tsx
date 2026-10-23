// HAMOODI SyntheTech Intelligence — Files Page
// Phase 04: Cloud file management interface

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FolderPlus, File as FileIcon, Image, FileText,
  Download, Trash2, Grid, List, Search, MoreVertical,
  FolderOpen, File, Loader2, AlertCircle
} from 'lucide-react';
import { useFiles } from '../contexts/FileContext';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesPage() {
  const { currentWorkspace } = useWorkspaceManagement();
  const { files, folders, isLoading, uploadFile, deleteFile, getFileUrl, createFolder, loadFiles, loadFolders } = useFiles();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      loadFiles(currentWorkspace.id);
      loadFolders(currentWorkspace.id);
    }
  }, [currentWorkspace, loadFiles, loadFolders]);

  const handleFileSelect = async (fileList: FileList | null) => {
    if (!fileList || !currentWorkspace) return;
    setUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < fileList.length; i++) {
        await uploadFile(fileList[i], { workspace_id: currentWorkspace.id });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentWorkspace) return;
    await createFolder(currentWorkspace.id, newFolderName.trim());
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const handleDownload = async (file: typeof files[0]) => {
    const url = await getFileUrl(file);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = file.display_name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const filteredFiles = files.filter(f =>
    f.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentWorkspace) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-zinc-500">Select a workspace to view files</p>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 p-6 overflow-y-auto transition-colors ${dragOver ? 'bg-violet-500/5' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Files</h2>
          <p className="text-sm text-zinc-500 mt-1">{files.length} files in workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Upload
          </button>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-xl transition-all border border-zinc-700/50"
          >
            <FolderPlus size={16} />
          </button>
          <div className="flex items-center bg-zinc-800 rounded-lg border border-zinc-700/50">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-l-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-r-lg transition-all ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => handleFileSelect(e.target.files)}
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-9 pr-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        />
      </div>

      {/* Upload error */}
      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2"
          >
            <AlertCircle size={14} />
            {uploadError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag overlay */}
      {dragOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-violet-500/10 border-2 border-dashed border-violet-500/50 rounded-xl pointer-events-none z-10"
        >
          <div className="text-center">
            <Upload size={32} className="text-violet-400 mx-auto mb-2" />
            <p className="text-violet-300 font-medium">Drop files to upload</p>
          </div>
        </motion.div>
      )}

      {/* New folder */}
      <AnimatePresence>
        {showNewFolder && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
          >
            <div className="flex gap-2">
              <input
                autoFocus
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Folder name..."
                className="flex-1 px-3 py-1.5 bg-zinc-900/50 border border-zinc-700/50 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
              <button onClick={handleCreateFolder} className="px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg">Create</button>
              <button onClick={() => setShowNewFolder(false)} className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs rounded-lg">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Folders</h3>
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3' : 'space-y-1'}>
            {folders.map(folder => (
              <div
                key={folder.id}
                className={`flex items-center gap-2 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg cursor-pointer transition-all ${
                  viewMode === 'list' ? 'px-3 py-2' : ''
                }`}
              >
                <FolderOpen size={16} className="text-amber-400 shrink-0" />
                <span className="text-sm text-zinc-300 truncate">{folder.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-violet-400" />
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-16">
          <FileIcon size={48} className="text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">
            {searchQuery ? 'No files match your search' : 'No files yet'}
          </h3>
          <p className="text-sm text-zinc-500">
            {searchQuery ? 'Try a different search term' : 'Upload files or drag and drop them here'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredFiles.map(file => {
            const Icon = getFileIcon(file.mime_type);
            return (
              <motion.div
                key={file.id}
                whileHover={{ scale: 1.03 }}
                className="group p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl cursor-pointer transition-all"
              >
                <div className="aspect-square flex items-center justify-center mb-2 bg-zinc-900/50 rounded-lg">
                  <Icon size={28} className="text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-300 truncate font-medium">{file.display_name}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">{formatFileSize(file.size_bytes)}</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                    className="p-1 bg-zinc-800 rounded hover:bg-zinc-700"
                  >
                    <Download size={10} className="text-zinc-300" />
                  </button>
                  <button
                    onClick={async (e) => { e.stopPropagation(); await deleteFile(file.id); }}
                    className="p-1 bg-zinc-800 rounded hover:bg-red-900/50"
                  >
                    <Trash2 size={10} className="text-red-400" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {filteredFiles.map(file => {
            const Icon = getFileIcon(file.mime_type);
            return (
              <div
                key={file.id}
                className="group flex items-center gap-3 p-3 bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/30 rounded-lg cursor-pointer transition-all"
              >
                <Icon size={18} className="text-zinc-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300 truncate">{file.display_name}</p>
                  <p className="text-[10px] text-zinc-600">{formatFileSize(file.size_bytes)} • {new Date(file.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                    className="p-1.5 hover:bg-zinc-700 rounded"
                  >
                    <Download size={12} className="text-zinc-400" />
                  </button>
                  <button
                    onClick={async (e) => { e.stopPropagation(); await deleteFile(file.id); }}
                    className="p-1.5 hover:bg-red-900/50 rounded"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
