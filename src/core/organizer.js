/**
 * BoldLock - Post Structure & Organization Engine
 * Formulates raw drafts into high-performing LinkedIn posts following proven structure standards:
 * - 1-2 line scroll-stopping Hook before the fold
 * - Short, readable paragraphs (1-2 sentences with breathing room)
 * - Bolded section headers (sansBold)
 * - Clean bulleted lists
 * - Engaging closing & call-to-action
 * 
 * Works 100% locally with rule-based algorithm, plus optional Gemini API integration.
 */

import { applyStyle, toPlainAscii } from './unicode-map.js';

/**
 * Standard rule-based LinkedIn post structural organizer.
 * Preserves the user's exact wording while formatting paragraphs, section titles, and lists.
 * 
 * @param {string} text - Raw draft text
 * @param {object} options - Configuration options
 * @returns {string} Structured LinkedIn post
 */
export function organizePostStructure(text, options = {}) {
  if (!text || typeof text !== 'string') return '';

  const cleanText = text.trim();
  if (!cleanText) return '';

  const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return '';

  const structuredBlocks = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a section header (e.g. ends with ':' or starts with emoji/header keywords)
    const isHeader = isSectionHeader(line);

    // Check if line is a bullet item or part of an unformatted list
    const isBulletItem = isListItem(line, lines[i - 1]);

    if (isHeader) {
      inList = true;
      // Bold the header text (preserving any leading emojis)
      const formattedHeader = formatHeader(line);
      structuredBlocks.push({ type: 'header', content: formattedHeader });
    } else if (isBulletItem && inList) {
      // Ensure bullet prefix
      const formattedBullet = formatBulletLine(line);
      structuredBlocks.push({ type: 'bullet', content: formattedBullet });
    } else {
      // If we were in a list and this is no longer a list item, reset list state
      if (inList && isEndOfList(line)) {
        inList = false;
      }

      // Check if long paragraph should be split into 1-2 sentence bites
      const splitSentences = splitIntoShortParagraphs(line);
      for (const para of splitSentences) {
        structuredBlocks.push({ type: 'paragraph', content: para });
      }
    }
  }

  // Assemble into cohesive post with standard LinkedIn spacing
  const outputLines = [];
  for (let i = 0; i < structuredBlocks.length; i++) {
    const current = structuredBlocks[i];
    const prev = structuredBlocks[i - 1];

    if (i === 0) {
      // First block (Hook): output directly
      outputLines.push(current.content);
      continue;
    }

    if (current.type === 'bullet' && prev && prev.type === 'bullet') {
      // Consecutive bullets: single newline between items
      outputLines.push(current.content);
    } else if (current.type === 'bullet' && prev && prev.type === 'header') {
      // Bullet immediately after header: single newline
      outputLines.push(current.content);
    } else {
      // Paragraph or header: double newline (blank line for breathing room)
      outputLines.push('');
      outputLines.push(current.content);
    }
  }

  return outputLines.join('\n');
}

/**
 * Determines if a line represents a section header.
 */
function isSectionHeader(line) {
  // If it has an item description separator like " — " or " - ", it's a list item, not a header
  if (/\s+[—–-]\s+/.test(line)) return false;

  // Ends with colon or contains introductory phrasing like "including:"
  if (/:\s*$/i.test(line)) return true;

  // Common header indicators
  if (/^(Tools|Technologies|Stage \d+|Phase \d+|Key takeaways|Overview|Results|Features):/i.test(line)) {
    return true;
  }

  return false;
}

/**
 * Formats a header line by bolding the title while preserving emojis.
 */
function formatHeader(line) {
  // Extract leading emoji or symbols if present
  const emojiMatch = line.match(/^([\p{Extended_Pictographic}\uFE0F\u200D\s*•➔✔\-]+)(.*)$/u);
  let prefix = '';
  let title = line;

  if (emojiMatch) {
    prefix = emojiMatch[1];
    title = emojiMatch[2].trim();
  }

  // Apply bold to the title portion
  const boldTitle = applyStyle(title, 'sansBold');
  return prefix ? `${prefix.trim()} ${boldTitle}` : boldTitle;
}

/**
 * Determines if a line is a list item.
 */
function isListItem(line, prevLine) {
  // Already starts with bullet symbol
  if (/^[•➔✔★\-*]\s+/u.test(line) || /^\d+️⃣|\d+\.\s+/.test(line)) return true;

  // Has item separator like " — " or " - " (e.g. "🐍 Python — Data cleaning...")
  if (/\s+[—–]\s+/.test(line)) return true;

  // Starts with an emoji followed by text (e.g. "🐍 Python...")
  if (/^[\p{Extended_Pictographic}]\s+\S+/u.test(line) && !/:\s*$/.test(line)) return true;

  // Previous line was a header ending with colon, and this line is short and unpunctuated
  if (prevLine && /:\s*$/.test(prevLine)) return true;

  // Short items without ending period
  if (line.length < 80 && !/[.!?]$/.test(line)) return true;

  return false;
}

/**
 * Checks if a line signifies the end of a bulleted list.
 */
function isEndOfList(line) {
  // A long sentence with concluding tone or ending punctuation
  return line.length > 70 && /[.!?]$/.test(line);
}

/**
 * Formats a line into a clean bullet point.
 */
function formatBulletLine(line) {
  // If already starts with a bullet symbol, keep it clean
  if (/^[•➔✔★]\s+/u.test(line)) return line;

  // If starts with dash or asterisk, replace with bullet
  if (/^[-*]\s+/u.test(line)) {
    return `• ${line.replace(/^[-*]\s+/, '')}`;
  }

  // If starts with emoji like "🐍 Python", prefix with bullet for alignment
  if (/^[\p{Extended_Pictographic}]\s+/u.test(line)) {
    return `• ${line}`;
  }

  // Standard line
  return `• ${line}`;
}

/**
 * Splits a dense prose block into short 1-2 sentence paragraphs for mobile readability.
 */
function splitIntoShortParagraphs(text) {
  // If already short, keep intact
  if (text.length <= 150) return [text];

  // Match sentences
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  if (!sentences || sentences.length <= 2) return [text];

  const paragraphs = [];
  let current = [];
  let currentLen = 0;

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    current.push(trimmed);
    currentLen += trimmed.length;

    // Split every 1-2 sentences or when reaching ~140 chars
    if (current.length >= 2 || currentLen >= 140) {
      paragraphs.push(current.join(' '));
      current = [];
      currentLen = 0;
    }
  }

  if (current.length > 0) {
    paragraphs.push(current.join(' '));
  }

  return paragraphs;
}

/**
 * Calls Gemini API to formulate the post according to LinkedIn best practices
 * without altering the user's authentic wording or core facts.
 * 
 * @param {string} rawText - The user's unformatted draft
 * @param {string} apiKey - Google Gemini API Key
 * @param {object} options - Custom options
 * @returns {Promise<string>}
 */
export async function formulateWithAI(rawText, apiKey, options = {}) {
  if (!rawText || !rawText.trim()) {
    throw new Error('Please enter some text before formulating.');
  }

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Gemini API key is required. Get a free API key at aistudio.google.com.');
  }

  const model = options.model || 'gemini-3.6-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  const systemInstruction = `You are an elite LinkedIn content architect and copy formatter.
Your task is to take the user's draft post and re-structure it to follow top-performing LinkedIn readability and engagement standards.

CRITICAL RULES:
1. PRESERVE THE WORDING: Do not change the author's voice, facts, terminology, project details, or core sentences. Keep their authentic text intact.
2. THE HOOK: The first 1-2 sentences must be isolated on their own line followed by a blank line, so it displays prominently before the mobile "...see more" fold cutoff (~180 chars).
3. SHORT PARAGRAPHS: Group narrative thoughts into short 1-2 sentence paragraphs with double line breaks between them. Never leave walls of text.
4. STRUCTURED SECTIONS: When tools, stages, metrics, or points are listed:
   - Make section titles clear with markdown bold: e.g. **Tools & Technologies:** or **Stage 1: Overview:**
   - Format list items with clean bullet points (•) and consistent indentation.
5. CLOSING & OUTRO: Separate the concluding thought or call-to-action with a blank line. If suitable, add a brief, natural closing question to prompt comments.
6. HASHTAGS: Add 3-5 relevant, focused hashtags at the very bottom preceded by a blank line.
7. OUTPUT ONLY THE POST: Do not add conversational intro/outro (e.g. do not say "Here is your post:"). Output only the raw post content.`;

  const prompt = `${systemInstruction}\n\nUSER'S DRAFT:\n${rawText.trim()}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `API error: HTTP ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidate) {
    throw new Error('No content returned from AI formulation.');
  }

  return candidate.trim();
}
