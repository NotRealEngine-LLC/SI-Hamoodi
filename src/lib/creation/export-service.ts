// HAMOODI SyntheTech Intelligence — Artifact Export Service
// Phase 09: Import/Export gateway for artifacts

import { getSupabaseClient } from '../supabase/client';
import { artifactService } from './artifact-service';
import {
  Artifact,
  ArtifactExport,
  ExportFormat,
  ExportStatus,
  ExportError,
  DocumentContent,
  SpreadsheetContent,
  PresentationContent,
} from './types';

export class SIArtifactExportService {
  /**
   * Export an artifact to a specific format
   */
  async exportArtifact(
    userId: string,
    artifactId: string,
    format: ExportFormat,
    version?: number
  ): Promise<ArtifactExport> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ExportError('Supabase not configured');

    // Get artifact
    const artifact = await artifactService.getArtifact(userId, artifactId);
    if (!artifact) throw new ExportError('Artifact not found');

    // Get content
    const content = await artifactService.getArtifactContent(artifactId, version);

    // Create export job
    const { data: exportJob, error: jobError } = await supabase
      .from('si_artifact_exports')
      .insert({
        artifact_id: artifactId,
        version_number: version || artifact.current_version,
        export_format: format,
        status: 'pending',
        created_by: userId,
      })
      .select()
      .single();

    if (jobError || !exportJob) {
      throw new ExportError('Failed to create export job');
    }

    const job = exportJob as ArtifactExport;

    try {
      // Update status to processing
      await supabase
        .from('si_artifact_exports')
        .update({ status: 'processing' })
        .eq('id', job.id);

      // Generate export based on artifact type and format
      let exportData: Blob;
      let fileName: string;

      switch (artifact.artifact_type) {
        case 'document':
          exportData = await this.exportDocument(content as DocumentContent, format);
          fileName = `${artifact.title}.${format}`;
          break;
        case 'spreadsheet':
          exportData = await this.exportSpreadsheet(content as SpreadsheetContent, format);
          fileName = `${artifact.title}.${format}`;
          break;
        case 'presentation':
          exportData = await this.exportPresentation(content as PresentationContent, format);
          fileName = `${artifact.title}.${format}`;
          break;
        default:
          throw new ExportError(`Export not supported for artifact type: ${artifact.artifact_type}`);
      }

      // Upload to storage
      const storagePath = `exports/${artifactId}/${job.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('si-artifacts')
        .upload(storagePath, exportData, {
          contentType: this.getContentType(format),
          upsert: true,
        });

      if (uploadError) {
        throw new ExportError(`Failed to upload export: ${uploadError.message}`);
      }

      // Update export job
      await supabase
        .from('si_artifact_exports')
        .update({
          status: 'completed',
          storage_path: storagePath,
          file_size_bytes: exportData.size,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      return { ...job, status: 'completed', storage_path: storagePath, file_size_bytes: exportData.size };
    } catch (error) {
      // Mark job as failed
      await supabase
        .from('si_artifact_exports')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', job.id);

      throw error;
    }
  }

  /**
   * Get download URL for an export
   */
  async getExportDownloadUrl(exportId: string): Promise<string> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new ExportError('Supabase not configured');

    const { data: exportData, error } = await supabase
      .from('si_artifact_exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (error || !exportData) {
      throw new ExportError('Export not found');
    }

    const exportJob = exportData as ArtifactExport;

    if (exportJob.status !== 'completed') {
      throw new ExportError('Export not completed');
    }

    const { data } = await supabase.storage
      .from('si-artifacts')
      .createSignedUrl(exportJob.storage_path, 3600); // 1 hour

    if (!data?.signedUrl) {
      throw new ExportError('Failed to generate download URL');
    }

    return data.signedUrl;
  }

  /**
   * Export document to various formats
   */
  private async exportDocument(content: DocumentContent, format: ExportFormat): Promise<Blob> {
    switch (format) {
      case 'txt':
        return this.documentToText(content);
      case 'md':
        return this.documentToMarkdown(content);
      case 'docx':
        return this.documentToDocx(content);
      case 'pdf':
        return this.documentToPdf(content);
      default:
        throw new ExportError(`Unsupported format for document: ${format}`);
    }
  }

  /**
   * Export spreadsheet to various formats
   */
  private async exportSpreadsheet(content: SpreadsheetContent, format: ExportFormat): Promise<Blob> {
    switch (format) {
      case 'csv':
        return this.spreadsheetToCsv(content);
      case 'xlsx':
        return this.spreadsheetToXlsx(content);
      default:
        throw new ExportError(`Unsupported format for spreadsheet: ${format}`);
    }
  }

  /**
   * Export presentation to various formats
   */
  private async exportPresentation(content: PresentationContent, format: ExportFormat): Promise<Blob> {
    switch (format) {
      case 'pptx':
        return this.presentationToPptx(content);
      default:
        throw new ExportError(`Unsupported format for presentation: ${format}`);
    }
  }

  /**
   * Convert document to plain text
   */
  private async documentToText(content: DocumentContent): Promise<Blob> {
    const text = this.extractTextFromNodes(content.content);
    return new Blob([text], { type: 'text/plain' });
  }

  /**
   * Convert document to Markdown
   */
  private async documentToMarkdown(content: DocumentContent): Promise<Blob> {
    const md = this.nodesToMarkdown(content.content);
    return new Blob([md], { type: 'text/markdown' });
  }

  /**
   * Convert document to DOCX
   */
  private async documentToDocx(content: DocumentContent): Promise<Blob> {
    // Use docx library
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

    const paragraphs = content.content.map(node => {
      if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        return new Paragraph({
          text: node.content?.map(c => c.text).join('') || '',
          heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
        });
      }
      return new Paragraph({
        children: [new TextRun(node.content?.map(c => c.text).join('') || '')],
      });
    });

    const doc = new Document({ sections: [{ children: paragraphs }] });
    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  /**
   * Convert document to PDF
   */
  private async documentToPdf(content: DocumentContent): Promise<Blob> {
    // Use jsPDF
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    let y = 20;
    content.content.forEach(node => {
      const text = node.content?.map(c => c.text).join('') || '';
      if (node.type === 'heading') {
        doc.setFontSize(16);
        doc.text(text, 20, y);
        y += 10;
      } else {
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(text, 170);
        doc.text(lines, 20, y);
        y += lines.length * 7;
      }

      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    const buffer = doc.output('arraybuffer');
    return new Blob([buffer], { type: 'application/pdf' });
  }

  /**
   * Convert spreadsheet to CSV
   */
  private async spreadsheetToCsv(content: SpreadsheetContent): Promise<Blob> {
    const sheet = content.sheets[content.activeSheetIndex];
    if (!sheet) throw new ExportError('No active sheet');

    const rows: string[][] = [];
    const cellKeys = Object.keys(sheet.cells).sort((a, b) => {
      const [rowA, colA] = this.parseCellRef(a);
      const [rowB, colB] = this.parseCellRef(b);
      return rowA - rowB || colA - colB;
    });

    let maxRow = 0;
    let maxCol = 0;
    cellKeys.forEach(key => {
      const [row, col] = this.parseCellRef(key);
      maxRow = Math.max(maxRow, row);
      maxCol = Math.max(maxCol, col);
    });

    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cellRef = this.getCellRef(r, c);
        const cell = sheet.cells[cellRef];
        row.push(cell ? String(cell.value || '') : '');
      }
      rows.push(row);
    }

    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    return new Blob([csv], { type: 'text/csv' });
  }

  /**
   * Convert spreadsheet to XLSX
   */
  private async spreadsheetToXlsx(content: SpreadsheetContent): Promise<Blob> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    content.sheets.forEach(sheet => {
      const ws = workbook.addWorksheet(sheet.name);

      Object.entries(sheet.cells).forEach(([ref, cell]) => {
        const [row, col] = this.parseCellRef(ref);
        const wsCell = ws.getCell(row + 1, col + 1);
        wsCell.value = cell.value;

        if (cell.style) {
          wsCell.font = {
            bold: cell.style.bold,
            italic: cell.style.italic,
            underline: cell.style.underline ? 'single' : undefined,
            size: cell.style.fontSize,
            name: cell.style.fontFamily,
            color: cell.style.color ? { argb: cell.style.color.replace('#', 'FF') } : undefined,
          };
          if (cell.style.backgroundColor) {
            wsCell.fill = {
              type: 'pattern' as const,
              pattern: 'solid' as const,
              fgColor: { argb: cell.style.backgroundColor.replace('#', 'FF') },
            };
          }
          wsCell.alignment = {
            horizontal: cell.style.alignment,
            vertical: cell.style.verticalAlignment,
          };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Convert presentation to PPTX
   */
  private async presentationToPptx(content: PresentationContent): Promise<Blob> {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const pres = new PptxGenJS();

    content.slides.forEach(slide => {
      const pptxSlide = pres.addSlide();

      slide.elements.forEach(element => {
        if (element.type === 'text') {
          pptxSlide.addText(element.content || '', {
            x: element.x / 96,
            y: element.y / 96,
            w: element.width / 96,
            h: element.height / 96,
            fontSize: element.style?.fontSize || 18,
            color: element.style?.color || '000000',
          });
        } else if (element.type === 'shape') {
          pptxSlide.addShape(pres.ShapeType.rect, {
            x: element.x / 96,
            y: element.y / 96,
            w: element.width / 96,
            h: element.height / 96,
            fill: { color: element.style?.backgroundColor?.replace('#', '') || 'FFFFFF' },
          });
        }
      });
    });

    const buffer = await pres.write({ outputType: 'arraybuffer' }) as ArrayBuffer;
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  }

  /**
   * Extract text from document nodes
   */
  private extractTextFromNodes(nodes: any[]): string {
    return nodes
      .map(node => {
        if (node.text) return node.text;
        if (node.content) return this.extractTextFromNodes(node.content);
        return '';
      })
      .join('\n');
  }

  /**
   * Convert nodes to Markdown
   */
  private nodesToMarkdown(nodes: any[]): string {
    return nodes
      .map(node => {
        if (node.type === 'heading') {
          const level = node.attrs?.level || 1;
          const text = node.content?.map((c: any) => c.text).join('') || '';
          return `${'#'.repeat(level)} ${text}`;
        }
        if (node.type === 'paragraph') {
          return node.content?.map((c: any) => c.text).join('') || '';
        }
        if (node.type === 'bulletList' || node.type === 'orderedList') {
          return node.content?.map((item: any, i: number) => {
            const text = item.content?.map((p: any) => p.content?.map((c: any) => c.text).join('')).join('') || '';
            return node.type === 'bulletList' ? `- ${text}` : `${i + 1}. ${text}`;
          }).join('\n') || '';
        }
        return '';
      })
      .join('\n\n');
  }

  /**
   * Parse cell reference (e.g., "A1" -> [0, 0])
   */
  private parseCellRef(ref: string): [number, number] {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return [0, 0];
    const col = match[1].split('').reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;
    const row = parseInt(match[2]) - 1;
    return [row, col];
  }

  /**
   * Get cell reference from row/col (e.g., [0, 0] -> "A1")
   */
  private getCellRef(row: number, col: number): string {
    let colStr = '';
    let c = col;
    while (c >= 0) {
      colStr = String.fromCharCode((c % 26) + 65) + colStr;
      c = Math.floor(c / 26) - 1;
    }
    return `${colStr}${row + 1}`;
  }

  /**
   * Get content type for format
   */
  private getContentType(format: ExportFormat): string {
    const types: Record<ExportFormat, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      csv: 'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      png: 'image/png',
      zip: 'application/zip',
    };
    return types[format] || 'application/octet-stream';
  }
}

export const artifactExportService = new SIArtifactExportService();
