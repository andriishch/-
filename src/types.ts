/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParsedItem {
  id: string;
  originalName: string;
  cleanName: string; // Name without extension if requested
  extension: string;
  fileSize: number;
  fileType: 'image' | 'text' | 'other';
  columns: string[]; // [Col A (before space), Col B (after space/rest)]
  thumbnailUrl?: string; // Quick URL for rendering image preview, if it's an image
  contentSnippet?: string; // Quick snippet for text preview
  folderName?: string;
}

export type SplittingStrategy = 'first-space' | 'all-spaces' | 'custom-delimiter' | 'smart-digits-letters';

export interface ParseSettings {
  strategy: SplittingStrategy;
  customDelimiter: string;
  stripExtension: boolean;
  lowercaseNames: boolean;
}
