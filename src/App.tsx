/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ClipboardCheck,
} from 'lucide-react';
import { ParsedItem, ParseSettings } from './types';
import { parseFileNameToColumns } from './utils/parser';
import UploadZone from './components/UploadZone';
import Toolbar from './components/Toolbar';
import SpreadsheetGrid from './components/SpreadsheetGrid';

const DEFAULT_SETTINGS: ParseSettings = {
  strategy: 'smart-digits-letters',
  customDelimiter: '_',
  stripExtension: true,
  lowercaseNames: false,
};

export default function App() {
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [settings, setSettings] = useState<ParseSettings>(DEFAULT_SETTINGS);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Load from local storage on startup
  useEffect(() => {
    const savedItems = localStorage.getItem('filename-parser-items');
    const savedSettings = localStorage.getItem('filename-parser-settings');

    if (savedItems) {
      try {
        setItems(JSON.parse(savedItems));
      } catch (e) {
        console.error('Failed to parse saved items:', e);
      }
    }
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  // Sync state to local storage
  const saveToStorage = (updatedItems: ParsedItem[], updatedSettings: ParseSettings) => {
    localStorage.setItem('filename-parser-items', JSON.stringify(updatedItems));
    localStorage.setItem('filename-parser-settings', JSON.stringify(updatedSettings));
  };

  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  const handleItemsAdded = (newItems: ParsedItem[]) => {
    const combined = [...items, ...newItems];
    setItems(combined);
    saveToStorage(combined, settings);
    triggerNotification(`Успішно додано та оброблено ${newItems.length} філ(ів)!`);
  };

  const handleRemoveItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    saveToStorage(updated, settings);
  };

  const handleUpdateItemColumn = (id: string, colIndex: number, newValue: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const nextCols = [...item.columns];
        nextCols[colIndex] = newValue;
        return { ...item, columns: nextCols };
      }
      return item;
    });
    setItems(updated);
    saveToStorage(updated, settings);
  };

  const handleUpdateOriginalName = (id: string, newOriginal: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        // Re-calculate the columns for this item based on the new name
        const lastDotIndex = newOriginal.lastIndexOf('.');
        let nameWithoutExt = newOriginal;
        let ext = '';
        if (lastDotIndex !== -1) {
          nameWithoutExt = newOriginal.substring(0, lastDotIndex);
          ext = newOriginal.substring(lastDotIndex);
        }

        const cleanName = settings.stripExtension ? nameWithoutExt : newOriginal;
        const originalText = settings.lowercaseNames ? cleanName.toLowerCase() : cleanName;

        const cols = parseFileNameToColumns(originalText, settings);
        
        // Preserve folder name if it was set
        if (item.folderName) {
          cols.push(item.folderName);
        }

        return {
          ...item,
          originalName: newOriginal,
          cleanName: nameWithoutExt,
          extension: ext,
          columns: cols,
        };
      }
      return item;
    });
    setItems(updated);
    saveToStorage(updated, settings);
  };

  const handleSettingsChange = (newSettings: ParseSettings) => {
    setSettings(newSettings);
    // Optional: Re-process current non-edited items if setting is updated
    const updated = items.map((item) => {
      const cleanName = newSettings.stripExtension ? item.cleanName : item.originalName;
      const originalText = newSettings.lowercaseNames ? cleanName.toLowerCase() : cleanName;

      const cols = parseFileNameToColumns(originalText, newSettings);

      // Preserve folder name if it was set
      if (item.folderName) {
        cols.push(item.folderName);
      }

      return {
        ...item,
        columns: cols,
      };
    });
    setItems(updated);
    saveToStorage(updated, newSettings);
    triggerNotification('Налаштування оновлено! Таблицю перераховано.');
  };

  const handleClearAll = () => {
    setItems([]);
    saveToStorage([], settings);
    triggerNotification('Таблицю повністю очищено.');
  };

  const handleAddManualRow = () => {
    const rawName = '4 ББАК ВЗВ 12 55.jpg';
    const cleanName = settings.stripExtension ? '4 ББАК ВЗВ 12 55' : rawName;
    const processedText = settings.lowercaseNames ? cleanName.toLowerCase() : cleanName;

    const cols = parseFileNameToColumns(processedText, settings);

    const newItem: ParsedItem = {
      id: Math.random().toString(36).substring(2, 11),
      originalName: rawName,
      cleanName: '4 ББАК ВЗВ 12 55',
      extension: '.jpg',
      fileSize: 42000,
      fileType: 'image',
      columns: cols,
    };

    const updated = [...items, newItem];
    setItems(updated);
    saveToStorage(updated, settings);
    triggerNotification('Додано новий рядок-приклад. Клікніть двічі на клітинку для редагування!');
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;

    // Calculate max columns to dynamically write headers
    const maxCols = Math.max(4, ...items.map((item) => item.columns.length));
    const headers = ['Оригінал', ...Array.from({ length: maxCols }, (_, i) => `Стовпець ${String.fromCharCode(65 + i)}`)];

    let csvContent = '\uFEFF'; // UTF-8 BOM for proper ukrainian characters loading in MS Excel
    csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';

    items.forEach((item) => {
      const rowData = [
        item.originalName,
        ...Array.from({ length: maxCols }, (_, i) => item.columns[i] || ''),
      ];
      csvContent += rowData.map((val) => `"${val.replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `оброблені_назви_асистента_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification('Файл CSV згенеровано й завантажено!');
  };

  const handleCopyToClipboard = () => {
    if (items.length === 0) return;

    // Generate TSV data format
    const maxCols = Math.max(4, ...items.map((item) => item.columns.length));
    let tsvLines: string[] = [];

    // Header values
    const headers = ['Оригінал', ...Array.from({ length: maxCols }, (_, i) => `Стовпець ${String.fromCharCode(65 + i)}`)];
    tsvLines.push(headers.join('\t'));

    items.forEach((item) => {
      const rowData = [
        item.originalName,
        ...Array.from({ length: maxCols }, (_, i) => item.columns[i] || ''),
      ];
      tsvLines.push(rowData.join('\t'));
    });

    const clipboardText = tsvLines.join('\n');
    navigator.clipboard.writeText(clipboardText)
      .then(() => {
        setCopyFeedback(true);
        triggerNotification('Дані скопійовано! Просто вставте (Ctrl+V) у Google Таблиці.');
        setTimeout(() => setCopyFeedback(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to copy to clipboard:', err);
        alert('Не вдалося скопіювати у буфер обміну. Будь ласка, завантажте CSV файл.');
      });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans select-none antialiased">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 rounded-2xl shadow-xl max-w-md w-[90%]"
          >
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold tracking-tight">{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* Navigation / Header Title bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-md shadow-emerald-500/10">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Інструмент обробки
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-bold">
                  v1.2 (Офлайн-сумісний)
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-zinc-900 tracking-tight">
                Роздільник Імен Файлів
              </h1>
            </div>
          </div>

          {/* Quick Context Tip */}
          <div className="bg-white border border-zinc-200 rounded-xl p-3 flex items-center gap-3 max-w-sm">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-medium leading-normal text-zinc-600">
              <strong>Вставте миттєво</strong>: Скопійовані клітинки ідеально розбиваються по стовпчикам у Google Таблицях без налаштувань API.
            </p>
          </div>
        </header>

        {/* Informative Guidance banner */}
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 bg-[radial-gradient(circle_at_bottom_right,var(--color-emerald-500),transparent_70%)] pointer-events-none" />
          <div className="space-y-1.5 max-w-2xl">
            <h3 className="text-sm font-bold tracking-wide flex items-center gap-1.5 uppercase text-emerald-400">
              <Layers className="w-4 h-4" />
              Обробка назв графічних та текстових файлів
            </h3>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed">
              Занесіть назви файлів у таблицю. Роздільник автоматично розбиває назву: перший сегмент поміщається в <strong className="text-white">Стовпець А</strong>, а вся інша частина після пробілу — у <strong className="text-white">Стовпець В</strong>. Для зручності ви можете редагувати результати та скопіювати їх в один клік!
            </p>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[11px] text-zinc-400 italic">Користувацька Директива:</span>
            <span className="bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5">
              Безпечний Офлайн-Експорт
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </span>
          </div>
        </div>

        {/* Upload zone component */}
        <UploadZone settings={settings} onItemsAdded={handleItemsAdded} />

        {/* Toolbar controls and actions */}
        <Toolbar
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onClearAll={handleClearAll}
          onAddManualRow={handleAddManualRow}
          onExportCSV={handleExportCSV}
          onCopyToClipboard={handleCopyToClipboard}
          copyFeedback={copyFeedback}
          itemCount={items.length}
        />

        {/* Main interactive grid work area */}
        <SpreadsheetGrid
          items={items}
          onRemoveItem={handleRemoveItem}
          onUpdateItemColumn={handleUpdateItemColumn}
          onUpdateOriginalName={handleUpdateOriginalName}
        />

        {/* Visual Help Footer */}
        <footer className="text-center py-6 text-zinc-400 text-xs border-t border-zinc-200">
          <p>© 2026 Filename Parser Table • Розроблено для швидкого та безпечного імпорту в електронні таблиці</p>
          <p className="mt-1">Всі обчислення виконуються локально у вашому браузері задля конфіденційності ваших файлів.</p>
        </footer>

      </div>
    </div>
  );
}
