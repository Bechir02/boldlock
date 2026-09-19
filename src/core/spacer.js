/**
 * PostCraft - Spacer Engine
 * Preserves LinkedIn line breaks and paragraph spacing across desktop and mobile.
 *
 * Problem: LinkedIn's post feed automatically collapses consecutive blank lines (\n\n),
 * crushing paragraph separation and hurting mobile readability.
 * Solution: Inject an invisible zero-width character (\u200B) on empty lines.
 */

export const INVISIBLE_SPACE = '\u200B'; // Zero-Width Space
export const BRAILLE_BLANK = '\u2800';   // Braille Pattern Blank (alternative spacer)

/**
 * Preserves empty line breaks for LinkedIn by injecting invisible characters on blank lines.
 * @param {string} text - The input text
 * @param {object} options - Configuration options
 * @param {'zwsp'|'braille'} options.mode - Type of invisible spacer to use (default 'zwsp')
 * @returns {string} Text with safe line breaks
 */
export function preserveLineBreaks(text, options = {}) {
  if (!text) return '';

  const spacer = options.mode === 'braille' ? BRAILLE_BLANK : INVISIBLE_SPACE;

  // Split into lines
  const lines = text.split(/\r?\n/);

  const processed = lines.map((line) => {
    // If the line is empty or contains only whitespace / existing invisible spaces
    const trimmed = line.replace(/[\s\u200B\u2800\u3164\uFEFF]/g, '');
    if (trimmed.length === 0) {
      return spacer;
    }
    return line;
  });

  return processed.join('\n');
}

/**
 * Strips invisible spacers from lines to allow clean editing and prevent artifact buildup.
 * @param {string} text - Text containing invisible spacers
 * @returns {string} Clean text
 */
export function cleanLineBreaks(text) {
  if (!text) return '';

  const lines = text.split(/\r?\n/);

  const processed = lines.map((line) => {
    // If the line contains only invisible spacers and whitespace, make it truly empty
    const withoutInvisible = line.replace(/[\u200B\u2800\u3164\uFEFF]/g, '');
    if (withoutInvisible.trim().length === 0) {
      return '';
    }
    // Also strip standalone invisible spaces from lines
    return line.replace(/[\u200B\u2800\u3164\uFEFF]/g, '');
  });

  return processed.join('\n');
}

/**
 * Checks if a line is a preserved blank line.
 * @param {string} line
 * @returns {boolean}
 */
export function isPreservedBlankLine(line) {
  if (!line) return false;
  const hasInvisible = /[\u200B\u2800\u3164\uFEFF]/.test(line);
  const withoutInvisible = line.replace(/[\s\u200B\u2800\u3164\uFEFF]/g, '');
  return hasInvisible && withoutInvisible.length === 0;
}
