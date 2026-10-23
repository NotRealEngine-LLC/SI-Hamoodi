// HAMOODI SyntheTech Intelligence — Final Result Assembler
// Phase 06: Combine task outputs into coherent deliverables

import type { AgentTaskRecord, ExecutionReport } from './types';

export interface FinalResult {
  objective: string;
  summary: string;
  completedWork: string[];
  mainFindings: string[];
  artifacts: Array<{
    type: string;
    title: string;
    content: string;
    taskId: string;
  }>;
  evidence: Array<{
    source: string;
    claim: string;
    verified: boolean;
  }>;
  limitations: string[];
  unverifiedAssumptions: string[];
  recommendations: string[];
  executionReport: ExecutionReport;
}

export class SIFinalResultAssembler {
  /**
   * Assemble final result from completed tasks
   */
  assemble(
    objective: string,
    tasks: AgentTaskRecord[],
    executionReport: ExecutionReport
  ): FinalResult {
    const completedTasks = tasks.filter(t => t.status === 'completed' && t.output);
    const failedTasks = tasks.filter(t => t.status === 'failed');

    // Extract completed work
    const completedWork = completedTasks.map(t => t.title);

    // Extract main findings from task outputs
    const mainFindings = this.extractFindings(completedTasks);

    // Extract artifacts (structured outputs)
    const artifacts = this.extractArtifacts(completedTasks);

    // Extract evidence
    const evidence = this.extractEvidence(completedTasks);

    // Identify limitations
    const limitations = this.identifyLimitations(tasks, executionReport);

    // Identify unverified assumptions
    const unverifiedAssumptions = this.identifyUnverifiedAssumptions(completedTasks);

    // Generate recommendations
    const recommendations = this.generateRecommendations(tasks, executionReport);

    // Generate summary
    const summary = this.generateSummary(
      objective,
      completedTasks.length,
      failedTasks.length,
      mainFindings
    );

    return {
      objective,
      summary,
      completedWork,
      mainFindings,
      artifacts,
      evidence,
      limitations,
      unverifiedAssumptions,
      recommendations,
      executionReport,
    };
  }

  /**
   * Extract main findings from task outputs
   */
  private extractFindings(tasks: AgentTaskRecord[]): string[] {
    const findings: string[] = [];

    for (const task of tasks) {
      if (task.output?.content) {
        // Extract key points from task output
        const content = task.output.content as string;
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        // Take first few meaningful lines as findings
        const keyLines = lines
          .filter(line => !line.startsWith('#') && line.length > 20)
          .slice(0, 3);

        findings.push(...keyLines);
      }
    }

    return findings.slice(0, 10); // Limit to 10 findings
  }

  /**
   * Extract structured artifacts from task outputs
   */
  private extractArtifacts(tasks: AgentTaskRecord[]): FinalResult['artifacts'] {
    const artifacts: FinalResult['artifacts'] = [];

    for (const task of tasks) {
      if (task.output?.content) {
        const content = task.output.content as string;
        
        // Detect artifact type based on content
        let type = 'text';
        if (content.includes('```')) {
          type = 'code';
        } else if (content.includes('|') && content.includes('---')) {
          type = 'table';
        } else if (content.match(/^\s*[-*]\s/m)) {
          type = 'list';
        }

        artifacts.push({
          type,
          title: task.title,
          content,
          taskId: task.id,
        });
      }
    }

    return artifacts;
  }

  /**
   * Extract evidence from task outputs
   */
  private extractEvidence(tasks: AgentTaskRecord[]): FinalResult['evidence'] {
    const evidence: FinalResult['evidence'] = [];

    for (const task of tasks) {
      if (task.output?.content) {
        const content = task.output.content as string;
        
        // Look for claims with sources
        const claimPattern = /(?:according to|based on|source:|reference:)\s+(.+)/gi;
        const matches = content.matchAll(claimPattern);

        for (const match of matches) {
          evidence.push({
            source: match[1].trim(),
            claim: task.title,
            verified: false, // Cannot verify without live research tools
          });
        }
      }
    }

    return evidence;
  }

  /**
   * Identify limitations based on execution
   */
  private identifyLimitations(tasks: AgentTaskRecord[], report: ExecutionReport): string[] {
    const limitations: string[] = [];

    // Check for failed tasks
    if (report.tasksFailed > 0) {
      limitations.push(`${report.tasksFailed} task(s) failed during execution`);
    }

    // Check for skipped tasks
    if (report.tasksSkipped > 0) {
      limitations.push(`${report.tasksSkipped} task(s) were skipped`);
    }

    // Check for tasks without verification
    const unverified = tasks.filter(t => 
      t.status === 'completed' && 
      (!t.verification_status || t.verification_status === 'unverified')
    );

    if (unverified.length > 0) {
      limitations.push(`${unverified.length} task(s) completed without verification`);
    }

    // Check for missing tools
    if (report.toolCalls === 0 && tasks.length > 0) {
      limitations.push('No tools were used — results based on model knowledge only');
    }

    // Add standard limitations
    limitations.push('Live web research was not available — external facts not verified');
    limitations.push('Results based on model knowledge and workspace context');

    return limitations;
  }

  /**
   * Identify unverified assumptions
   */
  private identifyUnverifiedAssumptions(tasks: AgentTaskRecord[]): string[] {
    const assumptions: string[] = [];

    // Look for tasks that made claims without verification
    for (const task of tasks) {
      if (task.output?.content && task.verification_status !== 'verified') {
        const content = task.output.content as string;
        
        // Look for assumption indicators
        if (content.match(/(?:assume|assumption|presumably|likely|probably)/i)) {
          assumptions.push(`Task "${task.title}" contains unverified assumptions`);
        }
      }
    }

    return assumptions;
  }

  /**
   * Generate recommendations based on execution
   */
  private generateRecommendations(tasks: AgentTaskRecord[], report: ExecutionReport): string[] {
    const recommendations: string[] = [];

    // Recommend verification if tasks were unverified
    const unverified = tasks.filter(t => 
      t.status === 'completed' && 
      (!t.verification_status || t.verification_status === 'unverified')
    );

    if (unverified.length > 0) {
      recommendations.push('Verify key findings with additional sources');
    }

    // Recommend retry if tasks failed
    if (report.tasksFailed > 0) {
      recommendations.push('Review failed tasks and retry with adjusted parameters');
    }

    // Recommend expansion if limited scope
    if (tasks.length < 5) {
      recommendations.push('Consider expanding scope for more comprehensive analysis');
    }

    // Recommend next steps
    recommendations.push('Review artifacts and integrate into your workflow');
    recommendations.push('Share results with stakeholders for feedback');

    return recommendations;
  }

  /**
   * Generate executive summary
   */
  private generateSummary(
    objective: string,
    completedCount: number,
    failedCount: number,
    findings: string[]
  ): string {
    let summary = `Objective: ${objective}\n\n`;
    summary += `Execution completed ${completedCount} task(s)`;
    
    if (failedCount > 0) {
      summary += ` with ${failedCount} failure(s)`;
    }
    summary += '.\n\n';

    if (findings.length > 0) {
      summary += 'Key findings:\n';
      findings.slice(0, 5).forEach((finding, i) => {
        summary += `${i + 1}. ${finding}\n`;
      });
    }

    return summary;
  }

  /**
   * Format result as markdown
   */
  formatAsMarkdown(result: FinalResult): string {
    let markdown = `# ${result.objective}\n\n`;
    markdown += `## Summary\n\n${result.summary}\n\n`;

    if (result.completedWork.length > 0) {
      markdown += `## Completed Work\n\n`;
      result.completedWork.forEach(work => {
        markdown += `- ${work}\n`;
      });
      markdown += '\n';
    }

    if (result.mainFindings.length > 0) {
      markdown += `## Main Findings\n\n`;
      result.mainFindings.forEach((finding, i) => {
        markdown += `${i + 1}. ${finding}\n`;
      });
      markdown += '\n';
    }

    if (result.artifacts.length > 0) {
      markdown += `## Artifacts\n\n`;
      result.artifacts.forEach(artifact => {
        markdown += `### ${artifact.title}\n\n`;
        markdown += `\`\`\`${artifact.type === 'code' ? '' : artifact.type}\n`;
        markdown += artifact.content;
        markdown += `\n\`\`\`\n\n`;
      });
    }

    if (result.limitations.length > 0) {
      markdown += `## Limitations\n\n`;
      result.limitations.forEach(limitation => {
        markdown += `- ${limitation}\n`;
      });
      markdown += '\n';
    }

    if (result.recommendations.length > 0) {
      markdown += `## Recommendations\n\n`;
      result.recommendations.forEach(rec => {
        markdown += `- ${rec}\n`;
      });
      markdown += '\n';
    }

    return markdown;
  }
}

export const finalResultAssembler = new SIFinalResultAssembler();
