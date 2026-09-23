/**
 * ScrollStop - Parser Engine
 * Handles rich text formatting and Markdown syntax conversion into LinkedIn-safe Unicode text.
 */

import { applyStyle, BULLET_STYLES } from './unicode-map.js';

/**
 * Parses markdown syntax into LinkedIn Unicode styled text.
 * Syntax supported:
 *  - **bold text** -> Sans-Serif Bold
 *  - *italic text* or _italic text_ -> Sans-Serif Italic
 *  - ~~strike~~ or ~strike~ -> Strikethrough
 *  - __underline__ -> Underline
 *  - `code` -> Monospace
 *  - Lines starting with "- " or "* " -> "• "
 *  - Lines starting with "> " -> Arrow or Quote
 *
 * @param {string} text - Markdown input text
 * @param {object} options - Configuration options
 * @param {'sansBold'|'serifBold'} options.boldStyle - Style for **bold** (default 'sansBold')
 * @param {boolean} options.convertBullets - Whether to convert list dashes to bullet points
 * @param {'bullet'|'arrow'|'check'} options.bulletStyle - Bullet style to apply
 * @returns {string} Formatted LinkedIn post text
 */
export function parseMarkdown(text, options = {}) {
  if (!text) return '';

  const boldStyle = options.boldStyle || 'sansBold';
  const convertBullets = options.convertBullets ?? true;
  const bulletSymbol = BULLET_STYLES[options.bulletStyle] || BULLET_STYLES.bullet;

  const lines = text.split(/\r?\n/);

  const processedLines = lines.map(line => {
    let current = line;

    // 1. Bullet list items: "- text" or "* text" (avoid matching "**bold**")
    if (convertBullets) {
      if (/^(\s*)[-*]\s+(?!\*)/.test(current)) {
        current = current.replace(/^(\s*)[-*]\s+/, `$1${bulletSymbol}`);
      } else if (/^(\s*)>\s+/.test(current)) {
        current = current.replace(/^(\s*)>\s+/, `$1➔ `);
      }
    }

    // 2. Bold: **text**
    current = current.replace(/\*\*(.+?)\*\*/g, (_, match) => {
      return applyStyle(match, boldStyle);
    });

    // 3. Underline: __text__
    current = current.replace(/__(.+?)__/g, (_, match) => {
      return applyStyle(match, 'underline');
    });

    // 4. Strikethrough: ~~text~~ or ~text~
    current = current.replace(/~~(.+?)~~/g, (_, match) => {
      return applyStyle(match, 'strike');
    });
    current = current.replace(/(?<!~)\~([^~\s].*?[^~\s]|\w)\~(?!~)/g, (_, match) => {
      return applyStyle(match, 'strike');
    });

    // 5. Italic: *text* (single asterisk not followed/preceded by asterisk)
    current = current.replace(/(?<!\*)\*([^*\s].*?[^*\s]|[^*\s])\*(?!\*)/g, (_, match) => {
      return applyStyle(match, 'italic');
    });

    // 6. Italic: _text_ (single underscore not preceded/followed by underscore)
    current = current.replace(/(?<!_)_([^_\s].*?[^_\s]|[^_\s])_(?!_)/g, (_, match) => {
      return applyStyle(match, 'italic');
    });

    // 7. Monospace: `code`
    current = current.replace(/`([^`]+)`/g, (_, match) => {
      return applyStyle(match, 'monospace');
    });

    return current;
  });

  return processedLines.join('\n');
}

/**
 * Extracts and translates rich formatted HTML text.
 * Works in both browser DOM and fallback environments.
 * @param {string} html - Raw HTML
 * @param {object} options
 * @returns {string} Plain text with Unicode formatting
 */
export function parseHtml(html, options = {}) {
  if (!html || typeof html !== 'string') return '';

  const boldStyle = options.boldStyle || 'sansBold';

  // Check if browser DOMParser is available
  if (typeof DOMParser !== 'undefined') {
    return parseHtmlWithDOM(html, boldStyle);
  }

  // Fallback regex-based parser for Node / non-DOM environments
  return parseHtmlWithRegex(html, boldStyle);
}

/**
 * DOM-based parser for Browser and Chrome Extension environments.
 */
function parseHtmlWithDOM(html, boldStyle) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function walk(node, state = { bold: false, italic: false, strike: false, underline: false, monospace: false }) {
    if (node.nodeType === Node.TEXT_NODE) {
      let text = node.textContent;
      if (!text) return '';

      // Determine active style
      if (state.bold) text = applyStyle(text, boldStyle);
      if (state.italic) text = applyStyle(text, 'italic');
      if (state.strike) text = applyStyle(text, 'strike');
      if (state.underline) text = applyStyle(text, 'underline');
      if (state.monospace) text = applyStyle(text, 'monospace');

      return text;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tagName = node.tagName.toLowerCase();
    const style = node.getAttribute('style') || '';

    // Detect inline CSS styles from Google Docs/Word/Notion
    const isBold = tagName === 'b' || tagName === 'strong' ||
      /font-weight:\s*(bold|[6-9]00)/i.test(style) || state.bold;

    const isItalic = tagName === 'i' || tagName === 'em' ||
      /font-style:\s*italic/i.test(style) || state.italic;

    const isStrike = tagName === 's' || tagName === 'strike' || tagName === 'del' ||
      /text-decoration.*line-through/i.test(style) || state.strike;

    const isUnderline = tagName === 'u' ||
      /text-decoration.*underline/i.test(style) || state.underline;

    const isMonospace = tagName === 'code' || tagName === 'pre' || tagName === 'kbd' || state.monospace;

    const nextState = {
      bold: isBold,
      italic: isItalic,
      strike: isStrike,
      underline: isUnderline,
      monospace: isMonospace
    };

    let result = '';

    // Handle block element spacing
    const isBlock = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'tr'].includes(tagName);
    const isListItem = tagName === 'li';

    if (isListItem) {
      result += '• ';
    }

    for (const child of node.childNodes) {
      result += walk(child, nextState);
    }

    if (tagName === 'br') {
      result += '\n';
    } else if (isBlock || isListItem) {
      result += '\n';
    }

    return result;
  }

  const rawResult = walk(doc.body);
  // Clean up excessive trailing/multiple newlines
  return rawResult
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Robust regex-based fallback for Node tests or environments without DOM.
 */
function parseHtmlWithRegex(html, boldStyle) {
  let text = html;

  // Normalize line breaks
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<li[^>]*>/gi, '• ');
  text = text.replace(/<\/li>/gi, '\n');

  // Strip head, scripts, and styles
  text = text.replace(/<head[\s\S]*?<\/head>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Bold: <b> and <strong>
  text = text.replace(/<(?:strong|b)(?:\s+[^>]*)?>([\s\S]*?)<\/(?:strong|b)>/gi, (_, inner) => {
    return applyStyle(stripTags(inner), boldStyle);
  });

  // Italic: <i> and <em>
  text = text.replace(/<(?:em|i)(?:\s+[^>]*)?>([\s\S]*?)<\/(?:em|i)>/gi, (_, inner) => {
    return applyStyle(stripTags(inner), 'italic');
  });

  // Strikethrough: <s>, <strike>, <del>
  text = text.replace(/<(?:s|strike|del)(?:\s+[^>]*)?>([\s\S]*?)<\/(?:s|strike|del)>/gi, (_, inner) => {
    return applyStyle(stripTags(inner), 'strike');
  });

  // Underline: <u>
  text = text.replace(/<u(?:\s+[^>]*)?>([\s\S]*?)<\/u>/gi, (_, inner) => {
    return applyStyle(stripTags(inner), 'underline');
  });

  // Monospace: <code>, <pre>
  text = text.replace(/<(?:code|pre)(?:\s+[^>]*)?>([\s\S]*?)<\/(?:code|pre)>/gi, (_, inner) => {
    return applyStyle(stripTags(inner), 'monospace');
  });

  // Strip any remaining HTML tags
  text = stripTags(text);

  // Decode common HTML entities
  text = decodeEntities(text);

  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
