// HAMOODI SyntheTech Intelligence — Agent Registry
// Phase 06: Manage specialized agent roles and configurations

import { AgentConfiguration, AgentRole } from './types';

export class SIAgentRegistry {
  private agents: Map<string, AgentConfiguration> = new Map();

  constructor() {
    this.initializeDefaultAgents();
  }

  private initializeDefaultAgents(): void {
    // Planner Agent
    this.register({
      id: 'planner',
      name: 'Planner Agent',
      description: 'Analyzes goals, decomposes tasks, and creates execution strategies',
      specialization: 'planner',
      systemInstructions: `You are a planning specialist for HAMOODI SI Super Agent.

Your responsibilities:
- Analyze complex objectives
- Break down goals into executable tasks
- Identify dependencies and execution order
- Create efficient execution strategies
- Optimize for parallelization where possible

Guidelines:
- Be methodical and systematic
- Consider constraints and limitations
- Prioritize critical path tasks
- Ensure all acceptance criteria are covered
- Create verifiable, atomic tasks`,
      allowedCapabilities: ['planning', 'analysis', 'decomposition'],
      allowedTools: [],
      preferredModelPolicy: 'advanced',
      maxIterations: 1,
      maxExecutionTimeMs: 60000,
      riskProfile: 'low',
      enabled: true,
    });

    // Research Agent
    this.register({
      id: 'research',
      name: 'Research Agent',
      description: 'Analyzes materials, organizes evidence, and summarizes information',
      specialization: 'research',
      systemInstructions: `You are a research specialist for HAMOODI SI Super Agent.

Your responsibilities:
- Analyze provided materials and data
- Organize information logically
- Summarize key findings
- Identify information gaps
- Structure evidence for decision-making

Guidelines:
- Be thorough and accurate
- Cite sources when available
- Distinguish facts from opinions
- Identify missing information
- Present findings clearly`,
      allowedCapabilities: ['research', 'analysis', 'summarization'],
      allowedTools: ['workspace.list_projects', 'workspace.get_project', 'workspace.list_files'],
      preferredModelPolicy: 'balanced',
      maxIterations: 3,
      maxExecutionTimeMs: 120000,
      riskProfile: 'low',
      enabled: true,
    });

    // Analyst Agent
    this.register({
      id: 'analyst',
      name: 'Analyst Agent',
      description: 'Compares alternatives, structures findings, and identifies risks',
      specialization: 'analyst',
      systemInstructions: `You are an analysis specialist for HAMOODI SI Super Agent.

Your responsibilities:
- Compare alternatives and options
- Structure findings systematically
- Identify risks and opportunities
- Generate reasoned recommendations
- Perform calculations when needed

Guidelines:
- Be objective and data-driven
- Consider multiple perspectives
- Quantify when possible
- Identify trade-offs clearly
- Support conclusions with evidence`,
      allowedCapabilities: ['analysis', 'comparison', 'risk_assessment'],
      allowedTools: ['utility.calculate'],
      preferredModelPolicy: 'balanced',
      maxIterations: 3,
      maxExecutionTimeMs: 120000,
      riskProfile: 'low',
      enabled: true,
    });

    // Creator Agent
    this.register({
      id: 'creator',
      name: 'Creator Agent',
      description: 'Drafts deliverables, creates content, and generates outputs',
      specialization: 'creator',
      systemInstructions: `You are a creation specialist for HAMOODI SI Super Agent.

Your responsibilities:
- Draft useful textual deliverables
- Create structured plans and documents
- Prepare outlines and frameworks
- Generate project-ready content
- Format outputs appropriately

Guidelines:
- Be clear and actionable
- Follow established formats
- Ensure completeness
- Use appropriate tone and style
- Make content ready for use`,
      allowedCapabilities: ['creation', 'writing', 'formatting'],
      allowedTools: ['agent.format_result'],
      preferredModelPolicy: 'balanced',
      maxIterations: 3,
      maxExecutionTimeMs: 180000,
      riskProfile: 'low',
      enabled: true,
    });

    // Reviewer Agent
    this.register({
      id: 'reviewer',
      name: 'Reviewer Agent',
      description: 'Evaluates outputs, checks criteria, and requests revisions',
      specialization: 'reviewer',
      systemInstructions: `You are a review specialist for HAMOODI SI Super Agent.

Your responsibilities:
- Evaluate outputs against acceptance criteria
- Check for completeness and accuracy
- Identify missing requirements
- Request revisions when justified
- Verify quality standards

Guidelines:
- Be thorough and critical
- Focus on acceptance criteria
- Provide actionable feedback
- Distinguish critical from minor issues
- Ensure quality before approval`,
      allowedCapabilities: ['review', 'verification', 'quality_assurance'],
      allowedTools: [],
      preferredModelPolicy: 'advanced',
      maxIterations: 3,
      maxExecutionTimeMs: 120000,
      riskProfile: 'low',
      enabled: true,
    });

    // Coordinator Agent (optional, often handled by orchestrator)
    this.register({
      id: 'coordinator',
      name: 'Coordinator Agent',
      description: 'Coordinates multi-agent workflows and manages dependencies',
      specialization: 'coordinator',
      systemInstructions: `You are a coordination specialist for HAMOODI SI Super Agent.

Your responsibilities:
- Coordinate multi-agent workflows
- Manage task dependencies
- Resolve conflicts between agents
- Ensure smooth execution flow
- Monitor progress and adjust as needed

Guidelines:
- Be proactive in identifying issues
- Communicate clearly with other agents
- Prioritize critical path tasks
- Adapt to changing conditions
- Ensure overall workflow success`,
      allowedCapabilities: ['coordination', 'management', 'optimization'],
      allowedTools: [],
      preferredModelPolicy: 'advanced',
      maxIterations: 5,
      maxExecutionTimeMs: 300000,
      riskProfile: 'low',
      enabled: true,
    });
  }

  register(agent: AgentConfiguration): void {
    this.agents.set(agent.id, agent);
  }

  get(id: string): AgentConfiguration | undefined {
    return this.agents.get(id);
  }

  getByRole(role: AgentRole): AgentConfiguration | undefined {
    for (const agent of this.agents.values()) {
      if (agent.specialization === role && agent.enabled) {
        return agent;
      }
    }
    return undefined;
  }

  list(): AgentConfiguration[] {
    return Array.from(this.agents.values());
  }

  listEnabled(): AgentConfiguration[] {
    return this.list().filter(a => a.enabled);
  }

  listByRole(role: AgentRole): AgentConfiguration[] {
    return this.list().filter(a => a.specialization === role && a.enabled);
  }

  enable(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.enabled = true;
    }
  }

  disable(id: string): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.enabled = false;
    }
  }

  /**
   * Select the best agent for a task based on role and capabilities
   */
  selectForTask(role: AgentRole, requiredCapabilities: string[]): AgentConfiguration | undefined {
    const candidates = this.listByRole(role);
    
    if (candidates.length === 0) {
      return undefined;
    }

    // Filter by capabilities
    const capable = candidates.filter(agent => {
      return requiredCapabilities.every(cap => 
        agent.allowedCapabilities.includes(cap)
      );
    });

    if (capable.length === 0) {
      // Fall back to any agent with the right role
      return candidates[0];
    }

    // Return the first capable agent
    return capable[0];
  }
}

export const agentRegistry = new SIAgentRegistry();
