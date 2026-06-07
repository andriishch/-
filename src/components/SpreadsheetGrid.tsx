/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Trash2, ImageIcon, FileText, FileCode, SquareEqual, HelpCircle, Eye } from 'lucide-react';
import { ParsedItem } from '../types';

interface SpreadsheetGridProps {
  items: ParsedItem[];
  onRemoveItem: (id: string) => void;
  onUpdateItemColumn: (id: string, colIndex: number, value: string) => void;
  onUpdateOriginalName: (id: string, value: string) => void;
}

export default function SpreadsheetGrid({
  items,
  onRemoveItem,
  onUpdateItemColumn,
  onUpdateOriginalName,
}: SpreadsheetGridProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; colIndex: number } | null>(null);
  const [editingOriginal, setEditingOriginal] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Dynamic columns count - at least 4 columns (A, B, C, D) or max columns parsed
  const maxColsLength = Math.max(
    4,
    ...items.map((item) => item.columns.length)
  );

  const colLetters = Array.from({ length: maxColsLength }, (_, i) =>
    String.fromCharCode(65 + i)
  ); // ['A', 'B', 'C', 'D'...]

  const startEditing = (id: string, colIndex: number, currentVal: string) => {
    setEditingCell({ id, colIndex });
    setEditValue(currentVal);
  };

  const saveCellEdit = (id: string, colIndex: number) => {
    onUpdateItemColumn(id, colIndex, editValue);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string, colIndex: number) => {
    if (e.key === 'Enter') {
      saveCellEdit(id, colIndex);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const startEditingOriginal = (id: string, currentVal: string) => {
    setEditingOriginal(id);
    setEditValue(currentVal);
  };

  const saveOriginalEdit = (id: string) => {
    onUpdateOriginalName(id, editValue);
    setEditingOriginal(null);
  };

  const handleOriginalKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveOriginalEdit(id);
    } else if (e.key === 'Escape') {
      setEditingOriginal(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="spreadsheet-workspace" className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header Info */}
      <div className="px-6 py-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-4 bg-zinc-50/50">
        <div>
          <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
            <SquareEqual className="w-4 h-4 text-emerald-600" />
            Дані у Розділеному Списку
          </h2>
          <p className="text-xs text-zinc-500">
            Двічі клацніть на будь-яку клітинку в стовбцях A-{colLetters[colLetters.length - 1]} або назву файлу, щоб редагувати дані напряму.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-full font-semibold">
            Рядків: {items.length}
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" title="Double click to edit" />
            Редагування у таблиці активне
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        /* Gorgeous empty state */
        <div id="sheets-empty-state" className="flex flex-col items-center justify-center py-16 px-6 text-center bg-zinc-50/20">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-400 border border-zinc-100">
            <FileCode className="w-8 h-8" />
          </div>
          <h3 className="text-zinc-700 font-semibold mb-1 text-sm md:text-base">Таблиця порожня</h3>
          <p className="text-zinc-500 text-xs md:text-sm max-w-sm">
            Завантажте графічні (.jpg, .png тощо) або текстові файли за допомогою зони вище для автоматичного розбиття імен та перегляду результатів у реальному часі.
          </p>
        </div>
      ) : (
        /* Real interactive spreadsheet-like structure */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                {/* Visual Row index label width */}
                <th className="w-[45px] bg-zinc-100 border-r border-zinc-200"></th>
                
                {/* Standard columns info */}
                <th className="w-[180px] p-2.5 text-xs font-semibold text-zinc-500 border-r border-zinc-200">
                  Оригінальна Назва
                </th>
                <th className="w-[100px] p-2.5 text-xs font-semibold text-zinc-500 border-r border-zinc-200 text-center">
                  Прев&apos;ю
                </th>

                {/* Splitting results columns (A, B, C...) */}
                {colLetters.map((letter, index) => (
                  <th
                    key={letter}
                    className="p-2.5 text-xs font-semibold text-zinc-600 border-r border-zinc-200 bg-emerald-50/20"
                  >
                    <div className="flex items-center justify-between">
                      <span>Стовпець {letter}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        {index === 0 ? 'Перед розділом' : `Після розділу (${index})`}
                      </span>
                    </div>
                  </th>
                ))}
                
                {/* Meta & delete column */}
                <th className="w-[90px] p-2.5 text-xs font-semibold text-zinc-500 text-center">
                  Дія
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, rowIndex) => {
                const category = item.fileType;
                return (
                  <tr
                    key={item.id}
                    className="group border-b border-zinc-150 hover:bg-zinc-50/50 transition-colors"
                  >
                    {/* Index */}
                    <td className="bg-zinc-50 font-mono text-[11px] text-zinc-400 text-center border-r border-zinc-200 select-none">
                      {rowIndex + 1}
                    </td>

                    {/* Original File Info */}
                    <td className="p-2 border-r border-zinc-200 text-xs text-zinc-700 font-medium truncate">
                      {editingOriginal === item.id ? (
                        <input
                          id={`original-edit-${item.id}`}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveOriginalEdit(item.id)}
                          onKeyDown={(e) => handleOriginalKeyDown(e, item.id)}
                          className="w-full px-1.5 py-1 bg-white border border-emerald-500 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onDoubleClick={() => startEditingOriginal(item.id, item.originalName)}
                          className="cursor-pointer hover:bg-zinc-100 hover:text-emerald-700 px-1.5 py-1 rounded transition-colors truncate"
                          title="Двічі клацніть для зміни імені"
                        >
                          {item.originalName}
                        </div>
                      )}
                    </td>

                    {/* Live Preview / Source indicators */}
                    <td className="p-1.5 border-r border-zinc-200">
                      <div className="flex items-center justify-center">
                        {category === 'image' && item.thumbnailUrl ? (
                          <div
                            className="relative group/thumb cursor-zoom-in"
                            onClick={() => setPreviewImage(item.thumbnailUrl || null)}
                          >
                            <img
                              src={item.thumbnailUrl}
                              alt={item.originalName}
                              className="w-8 h-8 object-cover rounded border border-zinc-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : category === 'text' ? (
                          <div
                            className="group/tooltip relative flex items-center gap-1 bg-zinc-50 border border-zinc-150 rounded px-2 py-1 text-[10px] text-zinc-500"
                            title={item.contentSnippet}
                          >
                            <FileText className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="font-mono text-[9px] truncate max-w-[50px]">
                              {formatSize(item.fileSize)}
                            </span>
                            {/* Hover tooltip */}
                            {item.contentSnippet && (
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-zinc-900 text-white rounded-lg p-3 text-[11px] font-normal leading-relaxed shadow-xl hidden group-hover/tooltip:block z-20 pointer-events-none">
                                <p className="font-semibold text-zinc-300 border-b border-zinc-700 pb-1 mb-1">
                                  Вміст файлу ({formatSize(item.fileSize)}):
                                </p>
                                <span className="line-clamp-4 italic">{item.contentSnippet}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-zinc-400 text-[10px]">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{formatSize(item.fileSize)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Output columns - A, B, C... */}
                    {colLetters.map((_, colIndex) => {
                      const value = item.columns[colIndex] || '';
                      const isEditing =
                        editingCell?.id === item.id && editingCell?.colIndex === colIndex;

                      return (
                        <td
                          key={colIndex}
                          className={`p-1.5 border-r border-zinc-200 text-xs transition-colors ${
                            isEditing ? 'bg-emerald-50/50' : 'hover:bg-zinc-100/30'
                          }`}
                        >
                          {isEditing ? (
                            <input
                              id={`cell-edit-${item.id}-${colIndex}`}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => saveCellEdit(item.id, colIndex)}
                              onKeyDown={(e) => handleKeyDown(e, item.id, colIndex)}
                              className="w-full px-1.5 py-1 bg-white border border-emerald-500 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              autoFocus
                            />
                          ) : (
                            <div
                              onDoubleClick={() => startEditing(item.id, colIndex, value)}
                              className="min-h-[24px] flex items-center px-1.5 py-0.5 rounded cursor-pointer font-mono hover:text-emerald-600 hover:bg-zinc-100/50 break-all"
                              title="Двічі клацніть для зміни значення"
                            >
                              {value}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Delete actions */}
                    <td className="p-1.5 text-center">
                      <button
                        id={`delete-row-${item.id}`}
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Видалити цей рядок"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Popover full screen preview style zoom modal */}
      {previewImage && (
        <div
          id="image-preview-modal"
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-2 shadow-2xl">
            <img
              src={previewImage}
              alt="Preview Zoomed"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
            <p className="text-zinc-400 text-xs text-center mt-2.5">
              Клікніть будь-де щоб закрити перегляд
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
