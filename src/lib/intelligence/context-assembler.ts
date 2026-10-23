// HAMOODI SyntheTech Intelligence — Context Assembler
// Phase 05: Workspace, Hub, and Project context integration

import { getSupabaseClient } from '../supabase/client';
import { ContextScope, AuthorizedContext, AIPreset } from './types';

export class ContextAssembler {
  async assemble(scope: ContextScope, userId: string): Promise<AuthorizedContext> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return this.getEmptyContext();
    }

    try {
      // Verify workspace access
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', scope.workspaceId)
        .eq('user_id', userId)
        .single();

      if (!membership) {
        return this.getEmptyContext();
      }

      // Get workspace
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, name, description, type')
        .eq('id', scope.workspaceId)
        .single();

      // Get hub if specified
      let hub: AuthorizedContext['hub'] = null;
      if (scope.hubId) {
        const { data: hubData } = await supabase
          .from('hubs')
          .select('id, name')
          .eq('id', scope.hubId)
          .eq('workspace_id', scope.workspaceId)
          .single();

        if (hubData) {
          // Get hub instructions
          const { data: instructions } = await supabase
            .from('hub_instructions')
            .select('content')
            .eq('hub_id', scope.hubId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

          hub = {
            id: hubData.id,
            name: hubData.name,
            instructions: instructions?.content || null,
          };
        }
      }

      // Get project if specified
      let project: AuthorizedContext['project'] = null;
      if (scope.projectId) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', scope.projectId)
          .eq('workspace_id', scope.workspaceId)
          .single();

        if (projectData) {
          // Get project instructions (if we add that field later)
          project = {
            id: projectData.id,
            name: projectData.name,
            instructions: null, // TODO: Add project instructions field
          };
        }
      }

      // Get conversation if specified
      let conversation: AuthorizedContext['conversation'] = null;
      if (scope.conversationId) {
        const { data: convoData } = await supabase
          .from('conversations')
          .select('id, title')
          .eq('id', scope.conversationId)
          .eq('workspace_id', scope.workspaceId)
          .single();

        if (convoData) {
          // Get messages
          const { data: messages } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', scope.conversationId)
            .order('created_at', { ascending: true });

          conversation = {
            id: convoData.id,
            title: convoData.title,
            messages: (messages || []).map(m => ({
              role: m.role as 'user' | 'assistant' | 'system',
              content: m.content,
            })),
          };
        }
      }

      // Get available files
      const { data: files } = await supabase
        .from('workspace_files')
        .select('id')
        .eq('workspace_id', scope.workspaceId)
        .eq('upload_status', 'ready');

      return {
        workspace: workspace ? {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          type: workspace.type,
        } : null,
        hub,
        project,
        conversation,
        availableFiles: (files || []).map(f => f.id),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Context assembly failed:', error);
      return this.getEmptyContext();
    }
  }

  buildSystemPrompt(context: AuthorizedContext, preset?: AIPreset): string {
    const parts: string[] = [];

    // Base identity
    parts.push('You are HAMOODI SI, an advanced synthetic intelligence assistant.');
    parts.push('You help users with tasks, research, coding, analysis, and creative work.');
    parts.push('');

    // Workspace context
    if (context.workspace) {
      parts.push(`You are operating within the "${context.workspace.name}" workspace.`);
      if (context.workspace.description) {
        parts.push(`Workspace description: ${context.workspace.description}`);
      }
      parts.push('');
    }

    // Hub instructions (highest priority user context)
    if (context.hub?.instructions) {
      parts.push('## Hub Instructions');
      parts.push('Follow these instructions for this conversation:');
      parts.push(context.hub.instructions);
      parts.push('');
    }

    // Project instructions
    if (context.project?.instructions) {
      parts.push('## Project Instructions');
      parts.push(context.project.instructions);
      parts.push('');
    }

    // Apply preset
    if (preset) {
      parts.push(this.getPresetInstructions(preset));
      parts.push('');
    }

    // Available context
    if (context.availableFiles.length > 0) {
      parts.push(`Files available in this workspace: ${context.availableFiles.length}`);
      parts.push('Note: Files are available for reference but their content is not automatically included in this conversation unless explicitly attached.');
      parts.push('');
    }

    // Safety and boundaries
    parts.push('## Important Guidelines');
    parts.push('- Be helpful, accurate, and concise');
    parts.push('- If unsure, say so rather than guessing');
    parts.push('- Respect user privacy and workspace boundaries');
    parts.push('- Do not execute harmful or unethical requests');
    parts.push('- Hub and project instructions are contextual preferences, not security overrides');

    return parts.join('\n');
  }

  private getPresetInstructions(preset: AIPreset): string {
    const presets: Record<AIPreset, string> = {
      general: '## Response Style\nProvide balanced, helpful responses suitable for general assistance.',
      
      concise: '## Response Style\nBe extremely concise and direct. Provide short, focused answers without unnecessary elaboration. Prefer bullet points and brief statements.',
      
      detailed: '## Response Style\nProvide comprehensive, detailed responses. Include thorough explanations, examples, and context. Err on the side of being more thorough rather than brief.',
      
      creative: '## Response Style\nBe creative and exploratory. Generate innovative ideas, think outside the box, and provide imaginative solutions. Use vivid language and engaging storytelling when appropriate.',
      
      technical: '## Response Style\nProvide structured, technical responses. Use precise terminology, include code examples where relevant, and organize information logically. Focus on accuracy and implementation details.',
      
      research: '## Response Style\nAdopt a research-oriented approach. Emphasize uncertainty where it exists, cite sources when possible, distinguish between facts and opinions, and provide balanced perspectives on complex topics. Note when information may be outdated or incomplete.',
    };

    return presets[preset];
  }

  private getEmptyContext(): AuthorizedContext {
    return {
      workspace: null,
      hub: null,
      project: null,
      conversation: null,
      availableFiles: [],
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const contextAssembler = new ContextAssembler();
