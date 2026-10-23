// HAMOODI SyntheTech Intelligence — Activity Page
// Part 01: Real local activity timeline

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FolderPlus, 
  Edit2, 
  Trash2, 
  MessageSquare, 
  Sparkles,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { ActivityRepository, ActivityEvent } from '../lib/repositories/ActivityRepository';

export function ActivityPage() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'projects' | 'conversations' | 'ai'>('all');

  const activityRepo = new ActivityRepository();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const loadedActivities = await activityRepo.getAll();
      setActivities(loadedActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'projects') return activity.type.includes('project');
    if (filter === 'conversations') return activity.type.includes('conversation');
    if (filter === 'ai') return activity.type.includes('ai');
    return true;
  });

  const getActivityIcon = (type: string) => {
    if (type.includes('project_created')) return <FolderPlus size={16} className="text-[#59d9a7]" />;
    if (type.includes('project_renamed')) return <Edit2 size={16} className="text-[#52dad5]" />;
    if (type.includes('project_deleted')) return <Trash2 size={16} className="text-[#ff6c7c]" />;
    if (type.includes('conversation_created')) return <MessageSquare size={16} className="text-[#9378ff]" />;
    if (type.includes('conversation_renamed')) return <Edit2 size={16} className="text-[#52dad5]" />;
    if (type.includes('conversation_deleted')) return <Trash2 size={16} className="text-[#ff6c7c]" />;
    if (type.includes('ai_request_started')) return <Sparkles size={16} className="text-[#c2f58d]" />;
    if (type.includes('ai_response_completed')) return <Sparkles size={16} className="text-[#59d9a7]" />;
    if (type.includes('ai_response_failed')) return <AlertCircle size={16} className="text-[#ff6c7c]" />;
    if (type.includes('ai_request_cancelled')) return <AlertCircle size={16} className="text-[#f3bd65]" />;
    return <Calendar size={16} className="text-[var(--si-text-muted)]" />;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-[var(--si-border)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--si-text-primary)]">Activity</h1>
            <p className="text-sm text-[var(--si-text-muted)] mt-1">
              Your recent workspace activity
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'projects', 'conversations', 'ai'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-[#9378ff]/20 text-[#9378ff]'
                  : 'text-[var(--si-text-muted)] hover:bg-[var(--si-surface-interactive)] hover:text-[var(--si-text-secondary)]'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#9378ff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-20">
            <Calendar size={48} className="text-[var(--si-text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--si-text-primary)] mb-2">
              {filter === 'all' ? 'No activity yet' : `No ${filter} activity`}
            </h3>
            <p className="text-sm text-[var(--si-text-muted)]">
              {filter === 'all' 
                ? 'Start creating projects and conversations to see activity here'
                : `No ${filter} activity recorded yet`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-4 p-4 bg-[var(--si-surface)] border border-[var(--si-border)] rounded-xl hover:border-[var(--si-border-hover)] transition-all"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-[var(--si-surface-interactive)] flex items-center justify-center flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--si-text-primary)] mb-1">
                    {activity.summary}
                  </p>
                  <p className="text-xs text-[var(--si-text-muted)]">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>

                {/* Metadata */}
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-[var(--si-text-muted)]">
                    {activity.metadata.projectName && (
                      <span className="px-2 py-1 bg-[var(--si-surface-interactive)] rounded-lg">
                        {activity.metadata.projectName}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
