// HAMOODI SyntheTech Intelligence — Sheets Studio
// Phase 09: Spreadsheet editing with formula calculations

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Trash2, Download, Upload, Save, Loader2,
  FileSpreadsheet, Bold, Italic, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { useWorkspaceManagement } from '../contexts/WorkspaceManagementContext';
import { useAuth } from '../contexts/AuthContext';
import { artifactService } from '../lib/creation/artifact-service';
import { artifactExportService } from '../lib/creation/export-service';
import type { SpreadsheetContent, Worksheet, Cell, CellStyle } from '../lib/creation/types';

interface SheetsStudioProps {
  artifactId?: string;
}

export function SheetsStudio({ artifactId }: SheetsStudioProps) {
  const { currentWorkspace } = useWorkspaceManagement();
  const { user } = useAuth();
  const [title, setTitle] = useState('Untitled Spreadsheet');
  const [isSaving, setIsSaving] = useState(false);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | null>(artifactId || null);
  
  const [content, setContent] = useState<SpreadsheetContent>({
    sheets: [{
      id: 'sheet-1',
      name: 'Sheet 1',
      cells: {},
    }],
    activeSheetIndex: 0,
  });

  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Load existing artifact
  useEffect(() => {
    if (artifactId && user) {
      loadArtifact(artifactId);
    }
  }, [artifactId, user]);

  const loadArtifact = async (id: string) => {
    if (!user) return;

    try {
      const artifact = await artifactService.getArtifact(user.id, id);
      if (artifact) {
        setTitle(artifact.title);
        const loadedContent = await artifactService.getArtifactContent(id);
        if (loadedContent) {
          setContent(loadedContent);
        }
        setCurrentArtifactId(id);
      }
    } catch (error) {
      console.error('Failed to load artifact:', error);
    }
  };

  const handleSave = async () => {
    if (!user || !currentWorkspace) return;

    setIsSaving(true);
    try {
      if (currentArtifactId) {
        await artifactService.updateArtifact(user.id, currentArtifactId, {
          title,
          content,
          change_summary: 'Manual save',
        });
      } else {
        const artifact = await artifactService.createArtifact(user.id, {
          workspace_id: currentWorkspace.id,
          artifact_type: 'spreadsheet',
          title,
          content,
        });
        setCurrentArtifactId(artifact.id);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!currentArtifactId || !user) return;

    try {
      const exportJob = await artifactExportService.exportArtifact(user.id, currentArtifactId, format);
      const downloadUrl = await artifactExportService.getExportDownloadUrl(exportJob.id);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${title}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const activeSheet = content.sheets[content.activeSheetIndex];

  const getCellRef = (row: number, col: number): string => {
    let colStr = '';
    let c = col;
    while (c >= 0) {
      colStr = String.fromCharCode((c % 26) + 65) + colStr;
      c = Math.floor(c / 26) - 1;
    }
    return `${colStr}${row + 1}`;
  };

  const parseCellRef = (ref: string): [number, number] => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return [0, 0];
    const col = match[1].split('').reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;
    const row = parseInt(match[2]) - 1;
    return [row, col];
  };

  const evaluateFormula = (formula: string): any => {
    try {
      // Simple formula evaluation (SUM, AVERAGE, etc.)
      if (formula.startsWith('=')) {
        const expr = formula.substring(1).toUpperCase();
        
        // Handle SUM
        if (expr.startsWith('SUM(')) {
          const range = expr.match(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/);
          if (range) {
            const [startRow, startCol] = parseCellRef(range[1]);
            const [endRow, endCol] = parseCellRef(range[2]);
            let sum = 0;
            for (let r = startRow; r <= endRow; r++) {
              for (let c = startCol; c <= endCol; c++) {
                const cellRef = getCellRef(r, c);
                const cell = activeSheet.cells[cellRef];
                if (cell && !isNaN(Number(cell.value))) {
                  sum += Number(cell.value);
                }
              }
            }
            return sum;
          }
        }
        
        // Handle AVERAGE
        if (expr.startsWith('AVERAGE(')) {
          const range = expr.match(/AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)/);
          if (range) {
            const [startRow, startCol] = parseCellRef(range[1]);
            const [endRow, endCol] = parseCellRef(range[2]);
            let sum = 0;
            let count = 0;
            for (let r = startRow; r <= endRow; r++) {
              for (let c = startCol; c <= endCol; c++) {
                const cellRef = getCellRef(r, c);
                const cell = activeSheet.cells[cellRef];
                if (cell && !isNaN(Number(cell.value))) {
                  sum += Number(cell.value);
                  count++;
                }
              }
            }
            return count > 0 ? sum / count : 0;
          }
        }
      }
      return formula;
    } catch {
      return '#ERROR';
    }
  };

  const handleCellClick = (cellRef: string) => {
    setSelectedCell(cellRef);
  };

  const handleCellDoubleClick = (cellRef: string) => {
    setEditingCell(cellRef);
    const cell = activeSheet.cells[cellRef];
    setEditValue(cell?.formula || cell?.value?.toString() || '');
  };

  const handleCellEdit = () => {
    if (!editingCell) return;

    const newCells = { ...activeSheet.cells };
    
    if (editValue.startsWith('=')) {
      newCells[editingCell] = {
        value: evaluateFormula(editValue),
        formula: editValue,
      };
    } else {
      newCells[editingCell] = {
        value: editValue,
      };
    }

    const newSheets = [...content.sheets];
    newSheets[content.activeSheetIndex] = {
      ...activeSheet,
      cells: newCells,
    };

    setContent({ ...content, sheets: newSheets });
    setEditingCell(null);
    setEditValue('');
  };

  const handleAddSheet = () => {
    const newSheet: Worksheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet ${content.sheets.length + 1}`,
      cells: {},
    };
    setContent({
      ...content,
      sheets: [...content.sheets, newSheet],
    });
  };

  const handleDeleteSheet = (index: number) => {
    if (content.sheets.length === 1) return;
    
    const newSheets = content.sheets.filter((_, i) => i !== index);
    setContent({
      ...content,
      sheets: newSheets,
      activeSheetIndex: Math.min(content.activeSheetIndex, newSheets.length - 1),
    });
  };

  // Render grid (10 rows x 10 cols for demo)
  const rows = 10;
  const cols = 10;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <FileSpreadsheet size={20} className="text-emerald-400" />
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="text-lg font-semibold text-white bg-transparent border-none focus:outline-none focus:ring-0 flex-1"
            placeholder="Spreadsheet Title"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-all"
          >
            <Download size={14} />
            <span>XLSX</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 border-b border-zinc-800/50 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-all">
            <Bold size={16} />
          </button>
          <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-all">
            <Italic size={16} />
          </button>
        </div>
        <div className="w-px h-6 bg-zinc-700 mx-2" />
        <div className="flex items-center gap-1">
          <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-all">
            <AlignLeft size={16} />
          </button>
          <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-all">
            <AlignCenter size={16} />
          </button>
          <button className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-lg transition-all">
            <AlignRight size={16} />
          </button>
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-12 h-8 bg-zinc-800 border border-zinc-700 text-xs text-zinc-500"></th>
                {Array.from({ length: cols }, (_, i) => (
                  <th key={i} className="w-24 h-8 bg-zinc-800 border border-zinc-700 text-xs text-zinc-500 font-medium">
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-12 h-8 bg-zinc-800 border border-zinc-700 text-xs text-zinc-500 text-center font-medium">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const cellRef = getCellRef(rowIndex, colIndex);
                    const cell = activeSheet.cells[cellRef];
                    const isSelected = selectedCell === cellRef;
                    const isEditing = editingCell === cellRef;

                    return (
                      <td
                        key={colIndex}
                        className={`w-24 h-8 border border-zinc-700 text-sm cursor-cell ${
                          isSelected ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-900/50'
                        }`}
                        onClick={() => handleCellClick(cellRef)}
                        onDoubleClick={() => handleCellDoubleClick(cellRef)}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onBlur={handleCellEdit}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleCellEdit();
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                                setEditValue('');
                              }
                            }}
                            className="w-full h-full px-1 bg-transparent border-none focus:outline-none text-white"
                          />
                        ) : (
                          <span className="px-1 text-zinc-300">
                            {cell?.value?.toString() || ''}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="px-6 py-3 border-t border-zinc-800/50 flex items-center gap-2">
        {content.sheets.map((sheet, index) => (
          <div
            key={sheet.id}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
              index === content.activeSheetIndex
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800'
            }`}
            onClick={() => setContent({ ...content, activeSheetIndex: index })}
          >
            <span className="text-sm">{sheet.name}</span>
            {content.sheets.length > 1 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteSheet(index);
                }}
                className="p-0.5 hover:bg-zinc-700 rounded"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAddSheet}
          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
        >
          <Plus size={14} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
}
