// HAMOODI SyntheTech Intelligence — Creation Platform Types
// Phase 09: Artifact Management & Creation Studios

export type ArtifactType = 
  | 'research_report'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'code_project'
  | 'code_file';

export type ArtifactStatus = 'draft' | 'active' | 'archived' | 'deleted';

export type ExportFormat = 'txt' | 'md' | 'pdf' | 'docx' | 'csv' | 'xlsx' | 'pptx' | 'png' | 'zip';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type GenerationJobType =
  | 'research_report'
  | 'document_generation'
  | 'spreadsheet_generation'
  | 'presentation_generation'
  | 'image_generation'
  | 'code_generation';

export type GenerationJobStatus =
  | 'pending'
  | 'preparing'
  | 'generating'
  | 'validating'
  | 'saving'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ResearchMode = 'quick' | 'deep' | 'document';

export type ResearchSessionStatus =
  | 'planning'
  | 'researching'
  | 'analyzing'
  | 'generating'
  | 'completed'
  | 'failed';

export type SourceType = 'web' | 'document' | 'database' | 'manual';

export type VerificationStatus = 'verified' | 'unverified' | 'questionable' | 'deprecated';

// ============================================================
// ARTIFACT TYPES
// ============================================================

export interface Artifact {
  id: string;
  workspace_id: string;
  hub_id?: string;
  project_id?: string;
  created_by: string;
  
  artifact_type: ArtifactType;
  title: string;
  description?: string;
  
  status: ArtifactStatus;
  current_version: number;
  
  content_ref?: string;
  storage_path?: string;
  
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface ArtifactVersion {
  id: string;
  artifact_id: string;
  version_number: number;
  
  content_ref?: string;
  storage_path?: string;
  
  change_summary?: string;
  created_by: string;
  
  created_at: string;
}

export interface ArtifactExport {
  id: string;
  artifact_id: string;
  version_number: number;
  
  export_format: ExportFormat;
  storage_path: string;
  file_size_bytes?: number;
  
  status: ExportStatus;
  error_message?: string;
  
  created_by: string;
  
  created_at: string;
  completed_at?: string;
}

export interface ArtifactGenerationJob {
  id: string;
  artifact_id?: string;
  workspace_id: string;
  
  job_type: GenerationJobType;
  
  prompt: string;
  input_context: Record<string, any>;
  
  status: GenerationJobStatus;
  progress?: number;
  
  result_artifact_id?: string;
  result_data?: Record<string, any>;
  
  model_id?: string;
  provider_adapter?: string;
  
  error_code?: string;
  error_message?: string;
  
  created_by: string;
  
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface CreateArtifactInput {
  workspace_id: string;
  hub_id?: string;
  project_id?: string;
  artifact_type: ArtifactType;
  title: string;
  description?: string;
  content?: any;
  metadata?: Record<string, any>;
}

export interface UpdateArtifactInput {
  title?: string;
  description?: string;
  status?: ArtifactStatus;
  content?: any;
  metadata?: Record<string, any>;
  change_summary?: string;
}

// ============================================================
// RESEARCH TYPES
// ============================================================

export interface ResearchSession {
  id: string;
  workspace_id: string;
  hub_id?: string;
  project_id?: string;
  
  title: string;
  research_question: string;
  research_mode: ResearchMode;
  
  status: ResearchSessionStatus;
  
  outline?: any;
  findings?: any;
  report_artifact_id?: string;
  
  created_by: string;
  
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface ResearchSource {
  id: string;
  research_session_id: string;
  
  source_type: SourceType;
  title: string;
  url?: string;
  document_id?: string;
  
  excerpt?: string;
  full_content?: string;
  
  author?: string;
  published_at?: string;
  retrieved_at: string;
  
  verification_status: VerificationStatus;
  
  created_at: string;
}

export interface CreateResearchSessionInput {
  workspace_id: string;
  hub_id?: string;
  project_id?: string;
  title: string;
  research_question: string;
  research_mode: ResearchMode;
}

export interface CreateResearchSourceInput {
  research_session_id: string;
  source_type: SourceType;
  title: string;
  url?: string;
  document_id?: string;
  excerpt?: string;
  full_content?: string;
  author?: string;
  published_at?: string;
  verification_status?: VerificationStatus;
}

// ============================================================
// DOCUMENT TYPES
// ============================================================

export interface DocumentContent {
  type: 'doc';
  content: DocumentNode[];
}

export interface DocumentNode {
  type: string;
  content?: DocumentNode[];
  text?: string;
  attrs?: Record<string, any>;
  marks?: DocumentMark[];
}

export interface DocumentMark {
  type: string;
  attrs?: Record<string, any>;
}

// ============================================================
// SPREADSHEET TYPES
// ============================================================

export interface SpreadsheetContent {
  sheets: Worksheet[];
  activeSheetIndex: number;
}

export interface Worksheet {
  id: string;
  name: string;
  cells: Record<string, Cell>;
  columnWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
  merges?: CellMerge[];
}

export interface Cell {
  value: any;
  formula?: string;
  style?: CellStyle;
}

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  alignment?: 'left' | 'center' | 'right';
  verticalAlignment?: 'top' | 'middle' | 'bottom';
  border?: CellBorder;
}

export interface CellBorder {
  top?: BorderStyle;
  right?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
}

export interface BorderStyle {
  style: 'none' | 'thin' | 'medium' | 'thick';
  color?: string;
}

export interface CellMerge {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// ============================================================
// PRESENTATION TYPES
// ============================================================

export interface PresentationContent {
  theme: PresentationTheme;
  slides: Slide[];
}

export interface PresentationTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ThemeFonts {
  heading: string;
  body: string;
}

export interface Slide {
  id: string;
  layout: SlideLayout;
  elements: SlideElement[];
  notes?: string;
}

export type SlideLayout = 'title' | 'content' | 'section' | 'two-column' | 'blank' | 'image';

export interface SlideElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'table' | 'chart';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  content?: any;
  style?: SlideElementStyle;
}

export interface SlideElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

// ============================================================
// CODE TYPES
// ============================================================

export interface CodeProjectContent {
  files: CodeFile[];
  activeFileId?: string;
}

export interface CodeFile {
  id: string;
  path: string;
  language: string;
  content: string;
  version: number;
  updated_at: string;
}

// ============================================================
// IMAGE TYPES
// ============================================================

export interface ImageContent {
  storage_path: string;
  width: number;
  height: number;
  mime_type: string;
  prompt?: string;
  model?: string;
}

// ============================================================
// ERROR TYPES
// ============================================================

export class ArtifactError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ArtifactError';
  }
}

export class ArtifactNotFoundError extends ArtifactError {
  constructor(artifactId: string) {
    super('ARTIFACT_NOT_FOUND', `Artifact not found: ${artifactId}`);
    this.name = 'ArtifactNotFoundError';
  }
}

export class VersionConflictError extends ArtifactError {
  constructor(artifactId: string, expectedVersion: number, actualVersion: number) {
    super(
      'VERSION_CONFLICT',
      `Version conflict for artifact ${artifactId}: expected ${expectedVersion}, got ${actualVersion}`,
      { artifactId, expectedVersion, actualVersion }
    );
    this.name = 'VersionConflictError';
  }
}

export class ExportError extends ArtifactError {
  constructor(message: string, context?: any) {
    super('EXPORT_FAILED', message, context);
    this.name = 'ExportError';
  }
}

export class GenerationError extends ArtifactError {
  constructor(message: string, context?: any) {
    super('GENERATION_FAILED', message, context);
    this.name = 'GenerationError';
  }
}
