/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Upload, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import { ParsedItem, ParseSettings } from '../types';
import { parseFileNameToColumns } from '../utils/parser';

interface UploadZoneProps {
  settings: ParseSettings;
  onItemsAdded: (items: ParsedItem[]) => void;
}

export default function UploadZone({ settings, onItemsAdded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const getFileCategory = (file: File): 'image' | 'text' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
      return 'text';
    }
    return 'other';
  };

  const processFiles = async (files: FileList | File[]) => {
    const newItems: ParsedItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const category = getFileCategory(file);

      // Extract original name and extension
      const lastDotIndex = file.name.lastIndexOf('.');
      let nameWithoutExt = file.name;
      let ext = '';
      if (lastDotIndex !== -1) {
        nameWithoutExt = file.name.substring(0, lastDotIndex);
        ext = file.name.substring(lastDotIndex);
      }

      const cleanName = settings.stripExtension ? nameWithoutExt : file.name;
      const originalText = settings.lowercaseNames ? cleanName.toLowerCase() : cleanName;

      // Processing columns split based on chosen strategy using the shared utility
      const cols = parseFileNameToColumns(originalText, settings);

      // Extract directory path/folder name if present
      let folderName = '';
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          folderName = parts[0]; // Top-level selected folder
        }
      }

      // If the folder name is a group of 6 digits, insert dots after every second digit
      if (/^\d{6}$/.test(folderName)) {
        folderName = `${folderName.substring(0, 2)}.${folderName.substring(2, 4)}.${folderName.substring(4, 6)}`;
      }

      // If a folder name is uploaded, place it in the columns array as the final column
      if (folderName) {
        cols.push(folderName);
      }

      // Generate visual preview elements
      let thumbnailUrl: string | undefined;
      let contentSnippet: string | undefined;

      if (category === 'image') {
        thumbnailUrl = URL.createObjectURL(file);
      } else if (category === 'text') {
        try {
          const text = await file.slice(0, 150).text();
          contentSnippet = text.trim() || '(Empty File)';
        } catch {
          contentSnippet = '(Could not read text)';
        }
      }

      newItems.push({
        id: Math.random().toString(36).substring(2, 11),
        originalName: file.name,
        cleanName: nameWithoutExt,
        extension: ext,
        fileSize: file.size,
        fileType: category,
        columns: cols,
        thumbnailUrl,
        contentSnippet,
        folderName: folderName || undefined,
      });
    }

    if (newItems.length > 0) {
      onItemsAdded(newItems);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      if (folderInputRef.current) {
        folderInputRef.current.value = ''; // Reset input
      }
    }
  };

  return (
    <div
      id="upload-zone-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all duration-300 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center min-h-[220px] group ${
        isDragging
          ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/10 scale-[0.995]'
          : 'border-zinc-200 bg-white hover:bg-zinc-50/50'
      }`}
    >
      {/* Input for files */}
      <input
        id="file-input-element"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept="image/*,text/*,.txt,.md,.csv"
      />

      {/* Input for folders (webkitdirectory) */}
      <input
        id="folder-input-element"
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        className="hidden"
        multiple
        {...{
          webkitdirectory: "",
          directory: "",
        } as any}
      />

      <div className={`p-4 rounded-full mb-3 transition-transform duration-300 group-hover:scale-110 ${
        isDragging ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
      }`}>
        <Upload className="w-6 h-6" />
      </div>

      <h3 className="text-zinc-800 font-semibold text-sm md:text-base mb-1 flex items-center gap-1.5 justify-center">
        <span>Перетягніть графічні/текстові файли або цілі папки сюди</span>
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
      </h3>
      
      <p className="text-zinc-500 text-xs md:text-sm max-w-md mb-5">
        Завантажені папки автоматично додадуть свою назву в останній стовпчик кожного розбитого файла.
      </p>

      {/* Buttons for explicit triggers */}
      <div className="flex flex-wrap gap-3 justify-center z-10">
        <button
          id="btn-upload-files"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Обрати файли з купе
        </button>

        <button
          id="btn-upload-folder"
          type="button"
          onClick={() => folderInputRef.current?.click()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          Завантажити ПАПКУ повністю
        </button>
      </div>

      <div className="flex gap-4 mt-5 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> Зображення (PNG, JPG, WebP...)
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-emerald-500" /> Тексти (TXT, MD, CSV)
        </span>
      </div>
    </div>
  );
}
