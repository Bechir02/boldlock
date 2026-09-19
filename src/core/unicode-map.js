/**
 * PostCraft - Unicode Map Engine
 * Zero-dependency mathematical and decorative Unicode mappings for LinkedIn.
 */

// Code point offsets for standard ranges
const UNICODE_RANGES = {
  sansBold: {
    upper: 0x1D5D4 - 65,  // A-Z: 𝗔-𝗭
    lower: 0x1D5EE - 97,  // a-z: 𝗮-𝘇
    digit: 0x1D7EC - 48   // 0-9: 𝟬-𝟵
  },
  serifBold: {
    upper: 0x1D400 - 65,  // A-Z: 𝐀-𝐙
    lower: 0x1D41A - 97,  // a-z: 𝐚-𝐳
    digit: 0x1D7CE - 48   // 0-9: 𝟎-𝟗
  },
  italic: {
    upper: 0x1D608 - 65,  // A-Z: 𝘈-𝘡 (Sans Italic)
    lower: 0x1D622 - 97   // a-z: 𝘢-𝘻
  },
  serifItalic: {
    upper: 0x1D434 - 65,  // A-Z: 𝐴-𝑍
    lower: 0x1D44E - 97,  // a-z: 𝑎-𝑧 (with 'h' exception)
    exceptions: {
      'h': '\u210E'      // Planck constant symbol for mathematical italic small h
    }
  },
  monospace: {
    upper: 0x1D670 - 65,  // A-Z: 𝙰-𝚉
    lower: 0x1D68A - 97,  // a-z: 𝚊-𝚣
    digit: 0x1D7F6 - 48   // 0-9: 𝟶-𝟿
  }
};

// Combining characters
const COMBINING = {
  underline: '\u0332',    // Combining Low Line
  strike: '\u0336'        // Combining Long Stroke Overlay
};

// Bullet styles
export const BULLET_STYLES = {
  bullet: '• ',
  arrow: '➔ ',
  check: '✔ ',
  star: '★ ',
  number: (index) => {
    const keycaps = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
    return keycaps[index] ? `${keycaps[index]} ` : `${index + 1}. `;
  }
};

/**
 * Applies a specific Unicode style to a character or string.
 * @param {string} text - Plain text to format
 * @param {'sansBold'|'serifBold'|'italic'|'serifItalic'|'monospace'|'underline'|'strike'} style - Target style
 * @param {object} options - Options { preserveTags: boolean }
 * @returns {string} Formatted string
 */
export function applyStyle(text, style = 'sansBold', options = {}) {
  if (!text) return '';

  const preserveTags = options.preserveTags ?? true;

  // If preserving tags, separate hashtags and @mentions so they stay plain ASCII
  if (preserveTags) {
    // Regex splits by hashtags (#word), mentions (@word), and URLs (http...)
    const tokenRegex = /(#[a-zA-Z0-9_\u00C0-\u017F]+|@[a-zA-Z0-9_.-]+|https?:\/\/[^\s]+|[^\s#@]+|\s+|[#@])/g;
    const tokens = text.match(tokenRegex) || [text];

    return tokens.map(token => {
      // Don't format hashtags, mentions, or URLs
      if (token.startsWith('#') || token.startsWith('@') || token.startsWith('http://') || token.startsWith('https://')) {
        return token;
      }
      return convertToken(token, style);
    }).join('');
  }

  return convertToken(text, style);
}

/**
 * Converts a raw string token to the target unicode style.
 */
function convertToken(text, style) {
  if (style === 'underline' || style === 'strike') {
    const mark = COMBINING[style];
    // Split by graphemes/characters safely
    return Array.from(text).map(char => {
      // Don't combine with existing combining marks or newlines/spaces
      if (char === '\n' || char === '\r' || char === '\t') return char;
      return `${char}${mark}`;
    }).join('');
  }

  const range = UNICODE_RANGES[style];
  if (!range) return text;

  return Array.from(text).map(char => {
    if (range.exceptions && range.exceptions[char]) {
      return range.exceptions[char];
    }

    const code = char.charCodeAt(0);

    // Uppercase A-Z
    if (code >= 65 && code <= 90 && range.upper !== undefined) {
      return String.fromCodePoint(code + range.upper);
    }
    // Lowercase a-z
    if (code >= 97 && code <= 122 && range.lower !== undefined) {
      return String.fromCodePoint(code + range.lower);
    }
    // Digits 0-9
    if (code >= 48 && code <= 57 && range.digit !== undefined) {
      return String.fromCodePoint(code + range.digit);
    }

    return char;
  }).join('');
}

/**
 * Reverse lookup table: Maps Unicode code points back to plain ASCII
 */
const REVERSE_MAP = new Map();

// Initialize reverse map once
function initReverseMap() {
  if (REVERSE_MAP.size > 0) return;

  // Populate from UNICODE_RANGES
  for (const style of Object.values(UNICODE_RANGES)) {
    // Uppercase
    if (style.upper !== undefined) {
      for (let i = 65; i <= 90; i++) {
        REVERSE_MAP.set(i + style.upper, String.fromCharCode(i));
      }
    }
    // Lowercase
    if (style.lower !== undefined) {
      for (let i = 97; i <= 122; i++) {
        REVERSE_MAP.set(i + style.lower, String.fromCharCode(i));
      }
    }
    // Digits
    if (style.digit !== undefined) {
      for (let i = 48; i <= 57; i++) {
        REVERSE_MAP.set(i + style.digit, String.fromCharCode(i));
      }
    }
    // Exceptions
    if (style.exceptions) {
      for (const [ascii, uni] of Object.entries(style.exceptions)) {
        REVERSE_MAP.set(uni.codePointAt(0), ascii);
      }
    }
  }

  // Also include double-struck, script, and gothic characters if users paste them
  // Mathematical Script:
  const scriptUpper = 0x1D49C - 65;
  const scriptLower = 0x1D4B6 - 97;
  for (let i = 65; i <= 90; i++) REVERSE_MAP.set(i + scriptUpper, String.fromCharCode(i));
  for (let i = 97; i <= 122; i++) REVERSE_MAP.set(i + scriptLower, String.fromCharCode(i));
  // Script exceptions in Unicode
  REVERSE_MAP.set(0x212C, 'B');
  REVERSE_MAP.set(0x2130, 'E');
  REVERSE_MAP.set(0x2131, 'F');
  REVERSE_MAP.set(0x210B, 'H');
  REVERSE_MAP.set(0x2110, 'I');
  REVERSE_MAP.set(0x2112, 'L');
  REVERSE_MAP.set(0x2133, 'M');
  REVERSE_MAP.set(0x211B, 'R');
  REVERSE_MAP.set(0x212F, 'e');
  REVERSE_MAP.set(0x210A, 'g');
  REVERSE_MAP.set(0x2134, 'o');
}

initReverseMap();

/**
 * Reverts any styled Unicode text back to clean, plain ASCII.
 * Removes combining underlines/strikethroughs and converts mathematical fonts back to A-Z/0-9.
 * @param {string} text - Styled text
 * @returns {string} Clean plain ASCII text
 */
export function toPlainAscii(text) {
  if (!text) return '';

  // Remove combining underline (\u0332) and combining strikethrough (\u0336)
  let cleaned = text.replace(/[\u0332\u0336]/g, '');

  // Convert code points back to ASCII
  const chars = [];
  for (const char of cleaned) {
    const cp = char.codePointAt(0);
    if (REVERSE_MAP.has(cp)) {
      chars.push(REVERSE_MAP.get(cp));
    } else {
      chars.push(char);
    }
  }

  return chars.join('');
}

/**
 * Determines if a given character or code point is a styled mathematical unicode character.
 * @param {string} char
 * @returns {boolean}
 */
export function isStyledUnicode(char) {
  if (!char) return false;
  const cp = char.codePointAt(0);
  return REVERSE_MAP.has(cp);
}

/**
 * Checks whether the given text is already styled with the specified style.
 * @param {string} text
 * @param {string} style
 * @returns {boolean}
 */
export function isStyledWith(text, style) {
  if (!text) return false;

  if (style === 'underline') {
    return text.includes(COMBINING.underline);
  }
  if (style === 'strike') {
    return text.includes(COMBINING.strike);
  }

  const range = UNICODE_RANGES[style];
  if (!range) return false;

  let styledCount = 0;
  let totalCandidates = 0;

  for (const char of text) {
    const cp = char.codePointAt(0);
    const isUpper = range.upper !== undefined && cp >= (65 + range.upper) && cp <= (90 + range.upper);
    const isLower = range.lower !== undefined && cp >= (97 + range.lower) && cp <= (122 + range.lower);
    const isDigit = range.digit !== undefined && cp >= (48 + range.digit) && cp <= (57 + range.digit);
    const isException = range.exceptions && Object.values(range.exceptions).some(ex => ex.codePointAt(0) === cp);

    if (isUpper || isLower || isDigit || isException) {
      styledCount++;
      totalCandidates++;
    } else {
      const asciiCode = char.charCodeAt(0);
      if ((asciiCode >= 65 && asciiCode <= 90) || (asciiCode >= 97 && asciiCode <= 122) || (asciiCode >= 48 && asciiCode <= 57)) {
        totalCandidates++;
      }
    }
  }

  return totalCandidates > 0 && (styledCount / totalCandidates) >= 0.5;
}

/**
 * Toggles a style on or off for the given text.
 * If the text is already styled with this style, it reverts it to plain ASCII.
 * If not, it converts it to the requested style.
 * @param {string} text
 * @param {string} style
 * @param {object} options
 * @returns {string}
 */
export function toggleStyle(text, style = 'sansBold', options = {}) {
  if (!text) return '';

  if (isStyledWith(text, style)) {
    if (style === 'underline') {
      return text.replace(/\u0332/g, '');
    }
    if (style === 'strike') {
      return text.replace(/\u0336/g, '');
    }
    return toPlainAscii(text);
  }

  // Strip existing formatting first to avoid corrupting glyphs across styles
  const clean = toPlainAscii(text);
  return applyStyle(clean, style, options);
}
