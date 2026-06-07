/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParseSettings } from '../types';

export function parseFileNameToColumns(text: string, settings: ParseSettings): string[] {
  const delimiter = settings.strategy === 'custom-delimiter' ? settings.customDelimiter : ' ';

  if (settings.strategy === 'first-space') {
    const firstSpaceIndex = text.indexOf(' ');
    if (firstSpaceIndex !== -1) {
      return [
        text.substring(0, firstSpaceIndex),
        text.substring(firstSpaceIndex + 1),
      ];
    }
    return [text, ''];
  }

  if (settings.strategy === 'all-spaces') {
    const parts = text.split(' ').map((p) => p.trim()).filter(Boolean);
    return parts.length > 0 ? parts : [text];
  }

  if (settings.strategy === 'custom-delimiter') {
    const firstDelimIndex = text.indexOf(delimiter);
    if (firstDelimIndex !== -1) {
      return [
        text.substring(0, firstDelimIndex),
        text.substring(firstDelimIndex + delimiter.length),
      ];
    }
    return [text, ''];
  }

  if (settings.strategy === 'smart-digits-letters') {
    const tokens = text.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 0) return [text];

    const colA: string[] = [];
    const otherCols: string[] = [];
    let hasSwitchedToSeparate = false;

    // A token has digits if it contains any numerical character 0-9
    const hasDigits = (token: string) => /\d/.test(token);

    // Checks if a token contains "генератор" or starts with "ген" (case-insensitive)
    const hasGen = (token: string) => {
      const lower = token.toLowerCase();
      return lower.startsWith('ген') || lower.includes('генератор');
    };

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (hasSwitchedToSeparate) {
        otherCols.push(token);
      } else {
        if (i === 0) {
          // The first token always starts Column A (even if it is a number like 4)
          colA.push(token);
        } else {
          // Switch to separate columns if:
          // 1. This token matches the generator criteria ("ген", "Генератор", etc.)
          // 2. Or this token has digits and there are no pure-letter tokens ahead (ignoring generator words).
          const remainingTokensHasLettersAhead = tokens.slice(i).some((t) => !hasDigits(t) && !hasGen(t));

          if (hasGen(token)) {
            hasSwitchedToSeparate = true;
            otherCols.push(token);
          } else if (hasDigits(token) && !remainingTokensHasLettersAhead) {
            hasSwitchedToSeparate = true;
            otherCols.push(token);
          } else {
            // It is either a word without digits, or there's still a word without digits ahead
            // (like "2" in "ДБНК 2 ЛБНК", where "ЛБНК" has no digits). Keep it in Column A.
            colA.push(token);
          }
        }
      }
    }

    return [colA.join(' '), ...otherCols];
  }

  return [text];
}
