// HAMOODI SyntheTech Intelligence — Projects Page
// Part 01: Project Management with local-first persistence

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  FolderKanban,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectRepository } from '../lib/repositories/ProjectRepository';

interface Project {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updatedAt'>('updatedAt');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const projectRepo = new ProjectRepository();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const loadedProjects = await projectRepo.getAll();
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await projectRepo.create(project);
      await loadProjects();
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleUpdateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await projectRepo.update(id, updates);
      await loadProjects();
      setEditingProject(null);
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await projectRepo.delete(id);
      await loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-[var(--si-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--si-text-primary)]">Projects</h1>
            <p className="text-sm text-[var(--si-text-muted)] mt-1">
              Organize your work and ideas
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#9378ff] to-[#7c5cff] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={18} />
            <span>New Project</span>
          </motion.button>
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--si-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--si-surface-interactive)] border border-[var(--si-border)] rounded-xl text-sm text-[var(--si-text-primary)] placeholder-[var(--si-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#9378ff]/50"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-[var(--si-surface-interactive)] border border-[var(--si-border)] rounded-xl text-sm text-[var(--si-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#9378ff]/50"
          >
            <option value="updatedAt">Sort by: Recent</option>
            <option value="name">Sort by: Name</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#9378ff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <FolderKanban size={48} className="text-[var(--si-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-sm text-[var(--si-text-muted)] mb-6">
              {searchQuery ? 'Try a different search term' : 'Create your first project to get started'}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreateDialog(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#9378ff] to-[#7c5cff] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Create Project
              </motion.button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredProjects.map(project => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-6 hover:border-[var(--si-border-hover)] transition-all cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  {/* Project Icon/Color */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: project.color || '#9378ff' }}
                  >
                    <span className="text-2xl">{project.icon || '📁'}</span>
                  </div>

                  {/* Project Info */}
                  <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2 group-hover:text-[#9378ff] transition-colors">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-[var(--si-text-muted)] line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-[var(--si-text-muted)]">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                      }}
                      className="p-2 bg-[var(--si-surface-interactive)] hover:bg-[var(--si-surface-elevated)] rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} className="text-[var(--si-text-secondary)]" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <AnimatePresence>
        {(showCreateDialog || editingProject) && (
          <ProjectDialog
            project={editingProject}
            onClose={() => {
              setShowCreateDialog(false);
              setEditingProject(null);
            }}
            onSave={async (project: any) => {
              if (editingProject) {
                await handleUpdateProject(editingProject.id, project);
              } else {
                await handleCreateProject(project);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Project Dialog Component
function ProjectDialog({
  project,
  onClose,
  onSave
}: {
  project: Project | null;
  onClose: () => void;
  onSave: (project: any) => void;
}) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [icon, setIcon] = useState(project?.icon || '📁');
  const [color, setColor] = useState(project?.color || '#9378ff');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(project ? { id: project.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color,
    });
  };

  const icons = ['📁', '💼', '🎨', '🔬', '📊', '🚀', '💡', '🎯', '📝', '🔧'];
  const colors = ['#9378ff', '#52dad5', '#c2f58d', '#f3bd65', '#ff6c7c', '#59d9a7'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--si-surface)] border border-[var(--si-border)] rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[var(--si-text-primary)] mb-6">
          {project ? 'Edit Project' : 'Create Project'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--si-text-secondary)] mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Project name"
              required
              className="w-full px-4 py-2 bg-[var(--si-surface-interactive)] border border-[var(--si-border)] rounded-xl text-sm text-[var(--si-text-primary)] placeholder-[var(--si-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#9378ff]/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--si-text-secondary)] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={3}
              className="w-full px-4 py-2 bg-[var(--si-surface-interactive)] border border-[var(--si-border)] rounded-xl text-sm text-[var(--si-text-primary)] placeholder-[var(--si-text-muted)] focus:outline-none focus:ring-2 focus:ring-[#9378ff]/50 resize-none"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-[var(--si-text-secondary)] mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {icons.map(iconOption => (
                <button
                  key={iconOption}
                  type="button"
                  onClick={() => setIcon(iconOption)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    icon === iconOption
                      ? 'bg-[#9378ff]/20 border-2 border-[#9378ff]'
                      : 'bg-[var(--si-surface-interactive)] border border-[var(--si-border)] hover:border-[var(--si-border-hover)]'
                  }`}
                >
                  {iconOption}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[var(--si-text-secondary)] mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map(colorOption => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === colorOption ? 'ring-2 ring-offset-2 ring-offset-[var(--si-surface)] ring-[#9378ff]' : ''
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[var(--si-surface-interactive)] hover:bg-[var(--si-surface-elevated)] text-[var(--si-text-secondary)] font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#9378ff] to-[#7c5cff] text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {project ? 'Save Changes' : 'Create Project'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
