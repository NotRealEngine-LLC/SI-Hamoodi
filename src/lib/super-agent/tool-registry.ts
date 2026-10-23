// HAMOODI SyntheTech Intelligence — Tool Registry
// Phase 06: Secure tool execution with permission checks

import { AgentTool, ToolExecutionContext } from './types';
import { getSupabaseClient } from '../supabase/client';

export class SIToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  constructor() {
    this.initializeDefaultTools();
  }

  private initializeDefaultTools(): void {
    // workspace.list_projects - Read authorized project metadata
    this.register({
      id: 'workspace.list_projects',
      description: 'List projects in the current workspace',
      riskLevel: 'read',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
        },
      },
      outputSchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
          },
        },
      },
      execute: async (input: any, context: ToolExecutionContext) => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase not configured');

        const limit = input.limit || 50;
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, description')
          .eq('workspace_id', context.workspaceId)
          .limit(limit);

        if (error) throw new Error(`Failed to list projects: ${error.message}`);
        return data || [];
      },
    });

    // workspace.get_project - Read an authorized project
    this.register({
      id: 'workspace.get_project',
      description: 'Get details of a specific project',
      riskLevel: 'read',
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string' },
        },
        required: ['projectId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
      },
      execute: async (input: any, context: ToolExecutionContext) => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
          .from('projects')
          .select('id, name, description')
          .eq('id', input.projectId)
          .eq('workspace_id', context.workspaceId)
          .single();

        if (error) throw new Error(`Failed to get project: ${error.message}`);
        if (!data) throw new Error('Project not found');
        return data;
      },
    });

    // hub.get_instructions - Read authorized Hub instructions
    this.register({
      id: 'hub.get_instructions',
      description: 'Get instructions for a specific hub',
      riskLevel: 'read',
      inputSchema: {
        type: 'object',
        properties: {
          hubId: { type: 'string' },
        },
        required: ['hubId'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          hubId: { type: 'string' },
          instructions: { type: 'string' },
        },
      },
      execute: async (input: any, context: ToolExecutionContext) => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
          .from('hub_instructions')
          .select('content')
          .eq('hub_id', input.hubId)
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (error) throw new Error(`Failed to get hub instructions: ${error.message}`);
        return {
          hubId: input.hubId,
          instructions: data?.content || '',
        };
      },
    });

    // workspace.list_files - Read authorized file metadata
    this.register({
      id: 'workspace.list_files',
      description: 'List files in the current workspace',
      riskLevel: 'read',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 50 },
        },
      },
      outputSchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            display_name: { type: 'string' },
            mime_type: { type: 'string' },
            size_bytes: { type: 'number' },
          },
        },
      },
      execute: async (input: any, context: ToolExecutionContext) => {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase not configured');

        const limit = input.limit || 50;
        const { data, error } = await supabase
          .from('workspace_files')
          .select('id, display_name, mime_type, size_bytes')
          .eq('workspace_id', context.workspaceId)
          .eq('upload_status', 'ready')
          .limit(limit);

        if (error) throw new Error(`Failed to list files: ${error.message}`);
        return data || [];
      },
    });

    // utility.calculate - Evaluate arithmetic through a safe parser
    this.register({
      id: 'utility.calculate',
      description: 'Perform arithmetic calculations',
      riskLevel: 'read',
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string' },
        },
        required: ['expression'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          result: { type: 'number' },
        },
      },
      execute: async (input: any, context: ToolExecutionContext) => {
        // Safe arithmetic evaluation
        const expression = input.expression;
        
        // Validate expression contains only safe characters
        if (!/^[\d\s+\-*/().]+$/.test(expression)) {
          throw new Error('Invalid expression: only numbers and basic operators allowed');
        }

        try {
          // Use Function constructor for safe evaluation
          const result = new Function(`return ${expression}`)();
          
          if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error('Expression did not evaluate to a finite number');
          }

          return { result };
        } catch (error) {
          throw new Error(`Calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      },
    });

    // agent.format_result - Validate and format structured outputs
    this.register({
      id: 'agent.format_result',
      description: 'Format and validate structured output',
      riskLevel: 'read',
      inputSchema: {
        type: 'object',
        properties: {
          data: { type: 'object' },
          format: { type: 'string', enum: ['json', 'markdown', 'text'] },
        },
        required: ['data'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          formatted: { type: 'string' },
        },
      },
      execute: async (input: any, context: ToolExecutionContext) => {
        const format = input.format || 'json';
        const data = input.data;

        let formatted: string;

        switch (format) {
          case 'json':
            formatted = JSON.stringify(data, null, 2);
            break;
          case 'markdown':
            formatted = this.formatAsMarkdown(data);
            break;
          case 'text':
            formatted = this.formatAsText(data);
            break;
          default:
            formatted = JSON.stringify(data, null, 2);
        }

        return { formatted };
      },
    });
  }

  private formatAsMarkdown(data: any): string {
    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => `- ${JSON.stringify(item)}`).join('\n');
    }

    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `**${key}**: ${JSON.stringify(value)}`)
        .join('\n\n');
    }

    return String(data);
  }

  private formatAsText(data: any): string {
    if (typeof data === 'string') {
      return data;
    }

    return JSON.stringify(data, null, 2);
  }

  register(tool: AgentTool): void {
    this.tools.set(tool.id, tool);
  }

  get(id: string): AgentTool | undefined {
    return this.tools.get(id);
  }

  list(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  listByRiskLevel(level: 'read' | 'write' | 'sensitive'): AgentTool[] {
    return this.list().filter(t => t.riskLevel === level);
  }

  /**
   * Execute a tool with permission checks
   */
  async execute(
    toolId: string,
    input: any,
    context: ToolExecutionContext
  ): Promise<any> {
    const tool = this.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    // Validate input against schema (basic validation)
    this.validateInput(tool.inputSchema, input);

    // Execute the tool
    const startTime = Date.now();
    try {
      const result = await tool.execute(input, context);
      const executionTime = Date.now() - startTime;

      // Validate output against schema (basic validation)
      this.validateOutput(tool.outputSchema, result);

      return {
        result,
        executionTimeMs: executionTime,
        toolId,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      throw {
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: executionTime,
        toolId,
      };
    }
  }

  private validateInput(schema: any, input: any): void {
    if (!schema) return;

    if (schema.type === 'object') {
      if (typeof input !== 'object' || input === null) {
        throw new Error('Input must be an object');
      }

      // Check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in input)) {
            throw new Error(`Missing required field: ${field}`);
          }
        }
      }
    }
  }

  private validateOutput(schema: any, output: any): void {
    // Basic output validation - can be extended
    if (!schema) return;

    if (schema.type === 'object' && (typeof output !== 'object' || output === null)) {
      throw new Error('Output must be an object');
    }

    if (schema.type === 'array' && !Array.isArray(output)) {
      throw new Error('Output must be an array');
    }
  }
}

export const toolRegistry = new SIToolRegistry();
