// HAMOODI SyntheTech Intelligence — Goal Interpreter
// Phase 06: Convert user objectives into structured task specifications

import { siIntelligenceService } from '../intelligence/service';
import { AgentGoal, RiskLevel } from './types';

export class SIGoalInterpreter {
  /**
   * Interpret a user objective into a structured goal specification
   */
  async interpret(
    objective: string,
    context: {
      workspaceId: string;
      hubId?: string;
      projectId?: string;
      userId: string;
    }
  ): Promise<AgentGoal> {
    // Use the intelligence service to analyze the objective
    const prompt = this.buildInterpretationPrompt(objective, context);
    
    try {
      const response = await siIntelligenceService.generate(
        {
          workspaceId: context.workspaceId,
          hubId: context.hubId,
          projectId: context.projectId,
        },
        context.userId,
        prompt,
        'gpt-4o-mini', // Use a fast model for planning
        'technical'
      );

      // Parse the structured response
      const goal = this.parseGoalResponse(response.content);
      
      // Validate the goal
      this.validateGoal(goal);
      
      return goal;
    } catch (error) {
      throw new Error(`Failed to interpret goal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildInterpretationPrompt(objective: string, context: any): string {
    return `You are a goal analysis specialist for HAMOODI SI Super Agent.

Analyze the following user objective and produce a structured goal specification.

USER OBJECTIVE:
${objective}

WORKSPACE CONTEXT:
- Workspace ID: ${context.workspaceId}
${context.hubId ? `- Hub ID: ${context.hubId}` : ''}
${context.projectId ? `- Project ID: ${context.projectId}` : ''}

INSTRUCTIONS:
1. Identify the main objective clearly
2. Define the desired outcome in concrete terms
3. List any constraints or limitations
4. Define acceptance criteria (how to know when the goal is achieved)
5. Identify required capabilities (research, analysis, creation, etc.)
6. Note any missing information that would help
7. Assess the risk level (low/medium/high)

Respond with a JSON object in this exact format:
{
  "objective": "Clear statement of the main objective",
  "desiredOutcome": "What success looks like",
  "constraints": ["List of constraints"],
  "acceptanceCriteria": ["How to verify completion"],
  "requestedCapabilities": ["research", "analysis", "creation", etc.],
  "missingInformation": ["What's unclear or missing"],
  "riskLevel": "low" | "medium" | "high"
}

Be precise and actionable. Focus on what can actually be executed.`;
  }

  private parseGoalResponse(response: string): AgentGoal {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        objective: parsed.objective || 'Unknown objective',
        desiredOutcome: parsed.desiredOutcome || 'Unknown outcome',
        constraints: Array.isArray(parsed.constraints) ? parsed.constraints : [],
        acceptanceCriteria: Array.isArray(parsed.acceptanceCriteria) ? parsed.acceptanceCriteria : [],
        requestedCapabilities: Array.isArray(parsed.requestedCapabilities) ? parsed.requestedCapabilities : [],
        missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
        riskLevel: this.validateRiskLevel(parsed.riskLevel),
      };
    } catch (error) {
      throw new Error(`Failed to parse goal response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateRiskLevel(level: any): RiskLevel {
    if (level === 'low' || level === 'medium' || level === 'high') {
      return level;
    }
    return 'medium'; // Default to medium if invalid
  }

  private validateGoal(goal: AgentGoal): void {
    if (!goal.objective || goal.objective.trim().length === 0) {
      throw new Error('Goal must have a non-empty objective');
    }

    if (!goal.desiredOutcome || goal.desiredOutcome.trim().length === 0) {
      throw new Error('Goal must have a non-empty desired outcome');
    }

    if (!Array.isArray(goal.acceptanceCriteria) || goal.acceptanceCriteria.length === 0) {
      throw new Error('Goal must have at least one acceptance criterion');
    }
  }
}

export const goalInterpreter = new SIGoalInterpreter();
