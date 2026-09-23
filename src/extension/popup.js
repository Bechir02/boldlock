/**
 * ScrollStop Chrome Extension Popup Logic
 * Lightweight, fast popup powered by the zero-dependency ScrollStop core engine.
 */

import { applyStyle, toPlainAscii, toggleStyle, toggleBullets, renumberNumberedList } from './core/unicode-map.js';
import { preserveLineBreaks } from './core/spacer.js';
import { parseMarkdown, parseHtml } from './core/parser.js';
import { analyzePost } from './core/linter.js';
import { organizePostStructure } from './core/organizer.js';

const editor = document.getElementById('popup-editor');
const statChars = document.getElementById('stat-chars');
const statDensityBadge = document.getElementById('stat-density-badge');
const statWords = document.getElementById('stat-words');
const hookAlert = document.getElementById('hook-alert');
const btnCopy = document.getElementById('btn-copy-popup');
const btnUnformat = document.getElementById('btn-unformat');
const btnOrganize = document.getElementById('btn-organize-popup');
const toast = document.getElementById('popup-toast');

// Restore previous popup state
if (typeof chrome !== 'undefined' && chrome.storage?.local) {
  chrome.storage.local.get(['scrollstop_popup_text', 'boldlock_popup_text'], (result) => {
    const text = result.scrollstop_popup_text || result.boldlock_popup_text;
    if (text) {
      editor.value = text;
      updateStats();
    }
  });
}

// Auto-renumbering on input
editor.addEventListener('input', () => {
  const renumbered = renumberNumberedList(editor.value);
  if (renumbered !== editor.value) {
    const selStart = editor.selectionStart;
    const selEnd = editor.selectionEnd;
    const diff = renumbered.length - editor.value.length;
    editor.value = renumbered;
    editor.setSelectionRange(Math.max(0, selStart + diff), Math.max(0, selEnd + diff));
  }
  updateStats();
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ scrollstop_popup_text: editor.value });
  }
});

// Smart rich paste handler
editor.addEventListener('paste', (e) => {
  const clipboardData = e.clipboardData;
  if (!clipboardData) return;

  const htmlData = clipboardData.getData('text/html');
  const textData = clipboardData.getData('text/plain');

  let converted = '';
  if (htmlData && /<(strong|b|em|i|u|s|strike|del|li|p|code)[^>]*>/i.test(htmlData)) {
    e.preventDefault();
    converted = parseHtml(htmlData);
  } else if (textData && /(\*\*|__|~~|`|^[-*]\s)/m.test(textData)) {
    e.preventDefault();
    converted = parseMarkdown(textData);
  }

  if (converted) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const val = editor.value;
    editor.value = val.substring(0, start) + converted + val.substring(end);
    editor.setSelectionRange(start + converted.length, start + converted.length);
    updateStats();
    showToast('✨ Converted rich text!');
  }
});

// Formatting buttons (supports toggle)
document.querySelectorAll('[data-style]').forEach(btn => {
  btn.addEventListener('click', () => {
    const style = btn.getAttribute('data-style');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const val = editor.value;

    if (start !== end) {
      const selected = val.substring(start, end);
      const formatted = toggleStyle(selected, style);
      editor.value = val.substring(0, start) + formatted + val.substring(end);
      editor.setSelectionRange(start, start + formatted.length);
    } else {
      editor.value = toggleStyle(val, style);
    }
    editor.focus();
    updateStats();
  });
});

// Bullets & numbers with double-click toggle
document.querySelectorAll('[data-bullet]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-bullet');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const val = editor.value;

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    const selected = val.substring(lineStart, lineEnd);
    const replacement = toggleBullets(selected, type);

    editor.value = val.substring(0, lineStart) + replacement + val.substring(lineEnd);
    editor.setSelectionRange(lineStart, lineStart + replacement.length);
    editor.focus();
    updateStats();
  });
});

// Auto-Format
btnOrganize?.addEventListener('click', () => {
  const current = editor.value;
  if (!current.trim()) {
    showToast('Type or paste text first!');
    return;
  }
  const organized = organizePostStructure(current);
  editor.value = organized;
  editor.focus();
  updateStats();
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ scrollstop_popup_text: organized });
  }
  showToast('Formatted for LinkedIn! ⚡');
});

// Unformat back to ASCII
btnUnformat?.addEventListener('click', () => {
  editor.value = toPlainAscii(editor.value);
  editor.focus();
  updateStats();
  showToast('Reverted to plain text');
});

// Copy for LinkedIn with zero-width line breaks
btnCopy?.addEventListener('click', async () => {
  const text = preserveLineBreaks(editor.value);
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied for LinkedIn! 🚀');
  } catch (err) {
    showToast('Failed to copy', true);
  }
});

function updateStats() {
  const text = editor.value;
  const audit = analyzePost(text);

  statChars.textContent = audit.metrics.charCount;
  statWords.textContent = `${audit.metrics.wordCount} words`;

  const density = audit.seo.unicodeDensity;
  statDensityBadge.textContent = `${density}% ${audit.seo.unicodeStatus}`;
  if (audit.seo.unicodeStatus === 'danger') {
    statDensityBadge.className = 'badge badge-danger';
  } else if (audit.seo.unicodeStatus === 'warning') {
    statDensityBadge.className = 'badge badge-warn';
  } else {
    statDensityBadge.className = 'badge badge-safe';
  }

  const activeCutoff = audit.cutoff.mobile;
  if (activeCutoff.isCutoff) {
    hookAlert.innerHTML = `<span>⚠️ <strong>Hook Cutoff:</strong> First 3 lines / ~${activeCutoff.visibleSnippet.length} chars visible before fold</span>`;
    hookAlert.style.borderColor = '#f59e0b';
  } else {
    hookAlert.innerHTML = `<span>✅ <strong>Above Fold:</strong> Entire post fits before fold on mobile</span>`;
    hookAlert.style.borderColor = '#10b981';
  }
}

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2200);
}

updateStats();
