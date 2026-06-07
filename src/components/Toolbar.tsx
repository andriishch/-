/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ListFilter,
  Trash2,
  Download,
  Copy,
  Plus,
  Settings,
  CaseSensitive,
  HelpCircle,
} from 'lucide-react';
import { ParseSettings, SplittingStrategy } from '../types';

interface ToolbarProps {
  settings: ParseSettings;
  onSettingsChange: (settings: ParseSettings) => void;
  onClearAll: () => void;
  onAddManualRow: () => void;
  onExportCSV: () => void;
  onCopyToClipboard: () => void;
  copyFeedback: boolean;
  itemCount: number;
}

export default function Toolbar({
  settings,
  onSettingsChange,
  onClearAll,
  onAddManualRow,
  onExportCSV,
  onCopyToClipboard,
  copyFeedback,
  itemCount,
}: ToolbarProps) {
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (confirmClear) {
      const timer = setTimeout(() => {
        setConfirmClear(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmClear]);

  const handleClearClick = () => {
    if (!confirmClear) {
      setConfirmClear(true);
    } else {
      onClearAll();
      setConfirmClear(false);
    }
  };

  const setStrategy = (strategy: SplittingStrategy) => {
    onSettingsChange({ ...settings, strategy });
  };

  const toggleStripExtension = () => {
    onSettingsChange({ ...settings, stripExtension: !settings.stripExtension });
  };

  const toggleLowercase = () => {
    onSettingsChange({ ...settings, lowercaseNames: !settings.lowercaseNames });
  };

  return (
    <div id="toolbar-panel" className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Settings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Parsing strategy selection */}
        <div className="lg:col-span-2 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-zinc-500" />
            Варіант Поділу Назв
          </label>
          <div className="flex flex-wrap bg-zinc-100 p-1 rounded-xl gap-1">
            <button
              id="set-strategy-smart"
              type="button"
              onClick={() => setStrategy('smart-digits-letters')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all min-w-[120px] ${
                settings.strategy === 'smart-digits-letters'
                  ? 'bg-white text-emerald-800 shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
              }`}
            >
              Букви та Цифри (Smart)
            </button>
            <button
              id="set-strategy-first-space"
              type="button"
              onClick={() => setStrategy('first-space')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all min-w-[120px] ${
                settings.strategy === 'first-space'
                  ? 'bg-white text-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
              }`}
            >
              Перший пробіл (А & B)
            </button>
            <button
              id="set-strategy-all-spaces"
              type="button"
              onClick={() => setStrategy('all-spaces')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all min-w-[120px] ${
                settings.strategy === 'all-spaces'
                  ? 'bg-white text-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
              }`}
            >
              Усі пробіли (Мульти)
            </button>
            <button
              id="set-strategy-custom"
              type="button"
              onClick={() => setStrategy('custom-delimiter')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg transition-all min-w-[120px] ${
                settings.strategy === 'custom-delimiter'
                  ? 'bg-white text-zinc-800 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
              }`}
            >
              Свій роздільник
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 italic">
            {settings.strategy === 'smart-digits-letters' && 'Smart: Групує разом початкові цифри та букви (як-от "4 ББАК ВЗВ") в Колонку А, а наступні групи цифр розносить у кожну подальшу комірку (Колонка B, C тощо).'}
            {settings.strategy === 'first-space' && 'Все до першого пробілу — Колонка А, все після нього — Колонка B.'}
            {settings.strategy === 'all-spaces' && 'Кожне слово, на яке розділяє пробіл, потрапляє у свою власну колонку.'}
            {settings.strategy === 'custom-delimiter' && 'Поділ відбудеться за веденим символом (наприклад, дефіс чи нижнє підкреслення).'}
          </p>
        </div>

        {/* Custom delimiter input */}
        {settings.strategy === 'custom-delimiter' && (
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Символ роздільника
            </label>
            <input
              id="custom-delimiter-input"
              type="text"
              value={settings.customDelimiter}
              onChange={(e) => onSettingsChange({ ...settings, customDelimiter: e.target.value })}
              className="w-full text-xs font-medium bg-zinc-50 text-zinc-800 px-3 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="_ або - або ,"
              maxLength={10}
            />
          </div>
        )}

        {/* Dynamic toggles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 text-zinc-500" />
            Опції Очищення
          </label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-600 hover:text-zinc-800">
              <input
                id="checkbox-strip-extension"
                type="checkbox"
                checked={settings.stripExtension}
                onChange={toggleStripExtension}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              Прибрати розширення (.png, .txt)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-600 hover:text-zinc-800">
              <input
                id="checkbox-lowercase"
                type="checkbox"
                checked={settings.lowercaseNames}
                onChange={toggleLowercase}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              Перетворити на нижній регістр
            </label>
          </div>
        </div>

        {/* Workflow Tips */}
        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 flex gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-[11px] font-semibold text-amber-800 uppercase tracking-tight">
              Розумний Експорт
            </h4>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Кнопка <strong>Скопіювати</strong> формує Tab-Separated копію. Ви можете просто відкрити Google Таблицю й натиснути <strong>Ctrl+V</strong> — усі дані автоматично розділяться в клітинки без налаштувань!
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Primary Row actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Adding & Clearing */}
        <div className="flex items-center gap-2">
          <button
            id="toolbar-add-row-btn"
            type="button"
            onClick={onAddManualRow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Додати рядок
          </button>
          <button
            id="toolbar-clear-all-btn"
            type="button"
            onClick={handleClearClick}
            disabled={itemCount === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95 ${
              confirmClear
                ? 'bg-red-600 text-white border border-red-700 hover:bg-red-700 shadow-sm font-bold animate-pulse'
                : 'bg-zinc-100 text-zinc-500 border border-zinc-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {confirmClear ? 'Ви впевнені? Клікніть ще раз' : 'Очистити список'}
          </button>
        </div>

        {/* Right Side: Copy & Exporting spreadsheet data */}
        <div className="flex items-center gap-2">
          <button
            id="toolbar-copy-btn"
            type="button"
            onClick={onCopyToClipboard}
            disabled={itemCount === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-95 ${
              copyFeedback
                ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300'
                : 'bg-zinc-800 text-white hover:bg-zinc-900'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            {copyFeedback ? 'Скопійовано!' : 'Скопіювати для Google Таблиць (TSV)'}
          </button>
          <button
            id="toolbar-csv-btn"
            type="button"
            onClick={onExportCSV}
            disabled={itemCount === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 rounded-xl text-xs font-semibold transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Скачати CSV
          </button>
        </div>
      </div>
    </div>
  );
}
