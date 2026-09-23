/**
 * ScrollStop — LinkedIn Post Styling & Algorithm Reach Studio
 */

import { applyStyle, toPlainAscii, toggleStyle, toggleBullets, renumberNumberedList, BULLET_STYLES } from '../core/unicode-map.js';
import { preserveLineBreaks } from '../core/spacer.js';
import { parseMarkdown, parseHtml } from '../core/parser.js';
import { analyzePost } from '../core/linter.js';
import { organizePostStructure, formulateWithAI } from '../core/organizer.js';

// ─── State ───────────────────────────────────────────────────────────
const state = {
  content: '',
  foldEnabled: true,
  foldExpanded: false
};

// ─── DOM refs ────────────────────────────────────────────────────────
// Editor
const editor = document.getElementById('editor');

// Emojis
const emojiTray = document.getElementById('emoji-tray');
const btnToggleEmojis = document.getElementById('btn-toggle-emojis');
const btnCloseEmojis = document.getElementById('btn-close-emojis');

// Stats
const statChars = document.getElementById('stat-chars');
const statWords = document.getElementById('stat-words');
const statReadtimeVal = document.getElementById('stat-readtime-val');
const statDensity = document.getElementById('stat-density');
const statDensityWrap = document.getElementById('stat-density-wrap');
const statCutoff = document.getElementById('stat-cutoff');
const statAutosave = document.getElementById('stat-autosave');
const healthBanner = document.getElementById('health-banner');
const healthMessage = document.getElementById('health-message');

// Mockup
const mockupBody = document.getElementById('mockup-body');
const mockupSeeMore = document.getElementById('mockup-see-more');

// Controls
const btnCopy = document.getElementById('btn-copy');
const btnClear = document.getElementById('btn-clear');
const btnUnformat = document.getElementById('btn-unformat');

// Toast
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

// Organize & AI Formulate
const btnOrganize = document.getElementById('btn-organize');
const btnAiFormulate = document.getElementById('btn-ai-formulate');
const modalAiFormulate = document.getElementById('modal-ai-formulate');
const btnCloseAi = document.getElementById('btn-close-ai');
const btnRunAutoOrganize = document.getElementById('btn-run-auto-organize');
const aiApiKey = document.getElementById('ai-api-key');
const btnRunAi = document.getElementById('btn-run-ai');
const aiSpinner = document.getElementById('ai-spinner');
const aiBtnText = document.getElementById('ai-btn-text');
const aiPreviewWrap = document.getElementById('ai-preview-wrap');
const aiPreviewContent = document.getElementById('ai-preview-content');
const btnApplyAi = document.getElementById('btn-apply-ai');

// Engagement & Algorithm Coach
const btnEngagementPill = document.getElementById('btn-engagement-pill');
const statEngagementScore = document.getElementById('stat-engagement-score');
const engagementDot = document.getElementById('engagement-dot');
const modalEngagement = document.getElementById('modal-engagement');
const btnCloseEngagement = document.getElementById('btn-close-engagement');
const coachScore = document.getElementById('coach-score');
const coachStatus = document.getElementById('coach-status');
const coachBtnFix = document.getElementById('coach-btn-fix');

const factorHookStatus = document.getElementById('factor-hook-status');
const factorHookDetail = document.getElementById('factor-hook-detail');
const factorReadStatus = document.getElementById('factor-read-status');
const factorReadDetail = document.getElementById('factor-read-detail');
const factorLinkStatus = document.getElementById('factor-link-status');
const factorLinkDetail = document.getElementById('factor-link-detail');
const factorCommentStatus = document.getElementById('factor-comment-status');
const factorCommentDetail = document.getElementById('factor-comment-detail');
const factorHashStatus = document.getElementById('factor-hash-status');
const factorHashDetail = document.getElementById('factor-hash-detail');
const factorContextStatus = document.getElementById('factor-context-status');
const factorContextDetail = document.getElementById('factor-context-detail');

let lastFormulatedText = '';

// ─── Init ────────────────────────────────────────────────────────────
function init() {
  const savedDraft = localStorage.getItem('scrollstop_draft') || localStorage.getItem('boldlock_draft');
  if (savedDraft) {
    state.content = savedDraft;
    editor.value = savedDraft;
  }
  setupEvents();
  render();
  editor.focus();
}

// ─── Event Wiring ────────────────────────────────────────────────────
function setupEvents() {

  // Editor input (with auto-renumbering when list items are deleted or rearranged)
  editor.addEventListener('input', () => {
    const renumbered = renumberNumberedList(editor.value);
    if (renumbered !== editor.value) {
      const selStart = editor.selectionStart;
      const selEnd = editor.selectionEnd;
      const diff = renumbered.length - editor.value.length;
      editor.value = renumbered;
      editor.setSelectionRange(Math.max(0, selStart + diff), Math.max(0, selEnd + diff));
    }
    state.content = editor.value;
    state.foldExpanded = false;
    saveDraft();
    render();
  });

  // Smart paste (Markdown & rich formatting)
  editor.addEventListener('paste', handlePaste);

  // Keyboard shortcuts
  editor.addEventListener('keydown', handleShortcuts);

  // Format buttons (supports toggle on/off)
  document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => applyFormatting(btn.dataset.style));
  });

  // Bullet buttons
  document.querySelectorAll('.bullet-btn').forEach(btn => {
    btn.addEventListener('click', () => applyBullets(btn.dataset.bullet));
  });

  // Quick Emojis
  document.querySelectorAll('.quick-emoji').forEach(btn => {
    btn.addEventListener('click', () => {
      insertAtCursor(btn.dataset.emoji);
    });
  });

  // Emoji Tray Toggle & Picker
  btnToggleEmojis?.addEventListener('click', () => {
    emojiTray.classList.toggle('hidden');
  });

  btnCloseEmojis?.addEventListener('click', () => {
    emojiTray.classList.add('hidden');
  });

  document.querySelectorAll('.picker-emoji').forEach(btn => {
    btn.addEventListener('click', () => {
      insertAtCursor(btn.dataset.emoji);
    });
  });

  // Unformat / Plain ASCII
  btnUnformat.addEventListener('click', unformatText);

  // Clear
  btnClear.addEventListener('click', () => {
    if (!editor.value.trim() || confirm('Clear your draft?')) {
      editor.value = '';
      state.content = '';
      state.foldExpanded = false;
      saveDraft();
      render();
    }
  });

  // Copy
  btnCopy.addEventListener('click', copyForLinkedIn);

  // See more click
  mockupSeeMore.addEventListener('click', () => {
    state.foldExpanded = true;
    render();
  });

  // 1-Click Instant Organize
  btnOrganize?.addEventListener('click', () => {
    const current = editor.value;
    if (!current.trim()) {
      showToast('Type or paste a draft first!');
      return;
    }
    const organized = organizePostStructure(current);
    editor.value = organized;
    state.content = organized;
    state.foldExpanded = false;
    saveDraft();
    render();
    showToast('Post organized for LinkedIn! ⚡');
  });

  // AI Formulate Modal Open/Close
  btnAiFormulate?.addEventListener('click', () => {
    const savedKey = localStorage.getItem('scrollstop_gemini_key') || localStorage.getItem('boldlock_gemini_key') || '';
    if (aiApiKey) aiApiKey.value = savedKey;
    modalAiFormulate?.classList.remove('hidden');
    modalAiFormulate?.classList.add('flex');
  });
  btnCloseAi?.addEventListener('click', closeAiModal);
  modalAiFormulate?.addEventListener('click', (e) => {
    if (e.target === modalAiFormulate) closeAiModal();
  });

  // Run instant auto-organize from modal
  btnRunAutoOrganize?.addEventListener('click', () => {
    const current = editor.value;
    if (!current.trim()) {
      showToast('Type or paste a draft first!');
      return;
    }
    const organized = organizePostStructure(current);
    editor.value = organized;
    state.content = organized;
    state.foldExpanded = false;
    saveDraft();
    render();
    closeAiModal();
    showToast('Post organized for LinkedIn! ⚡');
  });

  // Gemini API Key auto-save
  aiApiKey?.addEventListener('change', () => {
    localStorage.setItem('scrollstop_gemini_key', aiApiKey.value.trim());
  });

  // Run Gemini AI Formulate
  btnRunAi?.addEventListener('click', async () => {
    const current = editor.value;
    if (!current.trim()) {
      showToast('Type or paste a draft first!');
      return;
    }
    const key = aiApiKey ? aiApiKey.value.trim() : '';
    if (!key) {
      showToast('Please enter your Gemini API key');
      aiApiKey?.focus();
      return;
    }
    localStorage.setItem('scrollstop_gemini_key', key);

    aiSpinner?.classList.remove('hidden');
    if (aiBtnText) aiBtnText.textContent = 'Formulating...';
    btnRunAi.disabled = true;

    try {
      const formulated = await formulateWithAI(current, key);
      // Parse markdown bold (**text**) to Unicode Bold to ensure LinkedIn compatibility
      const parsed = parseMarkdown(formulated, { boldStyle: 'sansBold', convertBullets: true });
      lastFormulatedText = parsed;
      if (aiPreviewContent) aiPreviewContent.textContent = parsed;
      aiPreviewWrap?.classList.remove('hidden');
      showToast('Post formulated! Click Apply below ✨');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      aiSpinner?.classList.add('hidden');
      if (aiBtnText) aiBtnText.textContent = '✨ Formulate with Gemini AI';
      btnRunAi.disabled = false;
    }
  });

  // Apply formulated text to editor
  btnApplyAi?.addEventListener('click', () => {
    if (!lastFormulatedText) return;
    editor.value = lastFormulatedText;
    state.content = lastFormulatedText;
    state.foldExpanded = false;
    saveDraft();
    render();
    closeAiModal();
    showToast('Applied to post editor! 🚀');
  });

  // Engagement & Algorithm Coach Modal
  btnEngagementPill?.addEventListener('click', () => {
    modalEngagement?.classList.remove('hidden');
    modalEngagement?.classList.add('flex');
  });
  btnCloseEngagement?.addEventListener('click', closeEngagementModal);
  modalEngagement?.addEventListener('click', (e) => {
    if (e.target === modalEngagement) closeEngagementModal();
  });
  coachBtnFix?.addEventListener('click', () => {
    const current = editor.value;
    if (!current.trim()) {
      showToast('Type or paste a draft first!');
      return;
    }
    const organized = organizePostStructure(current);
    editor.value = organized;
    state.content = organized;
    state.foldExpanded = false;
    saveDraft();
    render();
    closeEngagementModal();
    showToast('Post organized for maximum reach! ⚡');
  });
}

function closeAiModal() {
  modalAiFormulate?.classList.add('hidden');
  modalAiFormulate?.classList.remove('flex');
}

function closeEngagementModal() {
  modalEngagement?.classList.add('hidden');
  modalEngagement?.classList.remove('flex');
}

// ─── Smart Paste ─────────────────────────────────────────────────────
function handlePaste(e) {
  const clip = e.clipboardData;
  if (!clip) return;

  const html = clip.getData('text/html');
  const text = clip.getData('text/plain');
  let converted = '';

  if (html && /<(strong|b|em|i|u|s|strike|del|li|p|code)[^>]*>/i.test(html)) {
    e.preventDefault();
    converted = parseHtml(html, { boldStyle: 'sansBold' });
  } else if (text && /(\*\*|__|~~|`|^[-*]\s)/m.test(text)) {
    e.preventDefault();
    converted = parseMarkdown(text, { boldStyle: 'sansBold', convertBullets: true });
  }

  if (converted) {
    insertAtCursor(converted);
    showToast('Text formatted ✨');
  }
}

// ─── Keyboard Shortcuts ──────────────────────────────────────────────
function handleShortcuts(e) {
  const mod = e.metaKey || e.ctrlKey;
  if (!mod) return;

  const map = { b: 'sansBold', i: 'italic', u: 'underline' };
  const style = map[e.key.toLowerCase()];
  if (style) {
    e.preventDefault();
    applyFormatting(style);
  }
}

// ─── Formatting (Supports Toggling On & Off!) ─────────────────────────
function applyFormatting(style) {
  const { selectionStart: s, selectionEnd: e, value: v } = editor;

  if (s !== e) {
    const selected = v.substring(s, e);
    const formatted = toggleStyle(selected, style);
    editor.value = v.substring(0, s) + formatted + v.substring(e);
    editor.setSelectionRange(s, s + formatted.length);
  } else {
    const wb = wordBounds(v, s);
    if (wb) {
      const selected = v.substring(wb.s, wb.e);
      const formatted = toggleStyle(selected, style);
      editor.value = v.substring(0, wb.s) + formatted + v.substring(wb.e);
      editor.setSelectionRange(wb.s, wb.s + formatted.length);
    }
  }
  editor.focus();
  state.content = editor.value;
  saveDraft();
  render();
}

function applyBullets(type) {
  const { selectionStart: s, selectionEnd: e, value: v } = editor;
  const ls = v.lastIndexOf('\n', s - 1) + 1;
  let le = v.indexOf('\n', e);
  if (le === -1) le = v.length;

  const targetBlock = v.substring(ls, le);
  const updatedBlock = toggleBullets(targetBlock, type);

  editor.value = v.substring(0, ls) + updatedBlock + v.substring(le);
  editor.setSelectionRange(ls, ls + updatedBlock.length);
  editor.focus();
  state.content = editor.value;
  saveDraft();
  render();
}

function unformatText() {
  const { selectionStart: s, selectionEnd: e, value: v } = editor;
  if (s !== e) {
    const plain = toPlainAscii(v.substring(s, e));
    editor.value = v.substring(0, s) + plain + v.substring(e);
    editor.setSelectionRange(s, s + plain.length);
  } else {
    editor.value = toPlainAscii(v);
  }
  editor.focus();
  state.content = editor.value;
  saveDraft();
  render();
  showToast('Reverted to plain text');
}

// ─── Helpers ─────────────────────────────────────────────────────────
function insertAtCursor(text) {
  const { selectionStart: s, selectionEnd: e, value: v } = editor;
  editor.value = v.substring(0, s) + text + v.substring(e);
  editor.setSelectionRange(s + text.length, s + text.length);
  editor.focus();
  state.content = editor.value;
  saveDraft();
  render();
}

function wordBounds(str, pos) {
  if (!str) return null;
  let s = pos, e = pos;
  while (s > 0 && !/\s/.test(str[s - 1])) s--;
  while (e < str.length && !/\s/.test(str[endIndex(str, e)])) e++;
  return s !== e ? { s, e } : null;
}

function endIndex(str, idx) {
  return idx < str.length ? idx : str.length - 1;
}

function saveDraft() {
  localStorage.setItem('scrollstop_draft', state.content);
  statAutosave.textContent = 'Saved';
}

// ─── Copy ────────────────────────────────────────────────────────────
async function copyForLinkedIn() {
  let text = editor.value;
  if (!text.trim()) {
    showToast('Nothing to copy');
    return;
  }
  text = preserveLineBreaks(text);
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  showToast('Copied for LinkedIn ✓');
}

// ─── Render ──────────────────────────────────────────────────────────
function render() {
  const text = state.content;
  const audit = analyzePost(text);

  renderStats(audit);
  renderMockup(text, audit);
}

function renderStats(audit) {
  const { metrics, seo, cutoff, warnings } = audit;

  // Characters
  statChars.textContent = metrics.charCount;
  statChars.className = metrics.isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-600 font-semibold';

  // Words
  statWords.textContent = metrics.wordCount;

  // Read time
  statReadtimeVal.textContent = metrics.readingTimeSeconds < 60
    ? `${metrics.readingTimeSeconds}s`
    : `${Math.round(metrics.readingTimeSeconds / 60)}m`;

  // Unicode density
  const dot = statDensityWrap.querySelector('span:first-child');
  if (seo.unicodeStatus === 'danger') {
    dot.className = 'w-1.5 h-1.5 rounded-full bg-red-400';
    statDensity.className = 'text-red-500 font-medium';
  } else if (seo.unicodeStatus === 'warning') {
    dot.className = 'w-1.5 h-1.5 rounded-full bg-amber-400';
    statDensity.className = 'text-amber-600';
  } else {
    dot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
    statDensity.className = 'text-gray-500';
  }
  statDensity.textContent = `${seo.unicodeDensity}% styled`;

  // Cutoff (always use desktop cutoff — single standard view)
  const activeCutoff = cutoff.desktop;
  statCutoff.textContent = activeCutoff.isCutoff ? 'Fold at line 5' : 'No fold';

  // Health banner
  if (warnings.length > 0) {
    healthBanner.classList.remove('hidden');
    healthMessage.textContent = warnings[0];
  } else {
    healthBanner.classList.add('hidden');
  }

  // Algorithm & Engagement Score
  const eng = audit.engagement || { score: audit.score, status: audit.status };
  if (statEngagementScore) {
    statEngagementScore.textContent = `${eng.score}%`;
  }
  if (engagementDot && btnEngagementPill) {
    if (eng.score >= 85) {
      engagementDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-500';
      btnEngagementPill.className = 'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer';
    } else if (eng.score >= 65) {
      engagementDot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500';
      btnEngagementPill.className = 'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer';
    } else {
      engagementDot.className = 'w-1.5 h-1.5 rounded-full bg-red-500';
      btnEngagementPill.className = 'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition cursor-pointer';
    }
  }

  // Update Coach Modal
  if (coachScore) coachScore.textContent = `${eng.score}%`;
  if (coachStatus) {
    coachStatus.textContent = eng.status;
    coachStatus.className = eng.score >= 85 ? 'text-xs font-semibold text-emerald-600' : (eng.score >= 65 ? 'text-xs font-semibold text-amber-600' : 'text-xs font-semibold text-red-600');
  }

  if (eng.factors) {
    if (factorHookStatus) factorHookStatus.textContent = eng.factors.hook.status;
    if (factorHookDetail) factorHookDetail.textContent = eng.factors.hook.label;
    if (factorReadStatus) factorReadStatus.textContent = eng.factors.readability.status;
    if (factorReadDetail) factorReadDetail.textContent = eng.factors.readability.label;
    if (factorLinkStatus) {
      factorLinkStatus.textContent = eng.factors.linkSafety.status;
      factorLinkStatus.className = eng.factors.linkSafety.isSafe ? 'font-semibold text-emerald-600 text-[11px]' : 'font-semibold text-red-600 text-[11px]';
    }
    if (factorLinkDetail) factorLinkDetail.textContent = eng.factors.linkSafety.label;
    if (factorCommentStatus) factorCommentStatus.textContent = eng.factors.conversation.status;
    if (factorCommentDetail) factorCommentDetail.textContent = eng.factors.conversation.label;
    if (factorHashStatus) factorHashStatus.textContent = eng.factors.hashtags.status;
    if (factorHashDetail) factorHashDetail.textContent = eng.factors.hashtags.label;
    if (factorContextStatus && eng.factors.tokenContext) {
      factorContextStatus.textContent = eng.factors.tokenContext.status;
      factorContextStatus.className = eng.factors.tokenContext.isOptimal ? 'font-semibold text-emerald-600 text-[11px]' : 'font-semibold text-amber-600 text-[11px]';
    }
    if (factorContextDetail && eng.factors.tokenContext) factorContextDetail.textContent = eng.factors.tokenContext.label;
  }
}

function renderMockup(text, audit) {
  const activeCutoff = audit.cutoff.desktop;

  if (!text.trim()) {
    mockupBody.innerHTML = '<span class="text-gray-400 italic text-sm">Your post preview will appear here...</span>';
    mockupSeeMore.classList.add('hidden');
    return;
  }

  const shouldCut = state.foldEnabled && activeCutoff.isCutoff && !state.foldExpanded;
  const display = shouldCut ? activeCutoff.visibleSnippet : text;

  mockupSeeMore.classList.toggle('hidden', !shouldCut);

  // Render with hashtag/mention highlighting
  mockupBody.innerHTML = escapeHtml(display)
    .replace(/(#[a-zA-Z0-9_\u00C0-\u017F]+)/g, '<span class="text-[#0a66c2] font-medium cursor-pointer hover:underline">$1</span>')
    .replace(/(@[a-zA-Z0-9_.-]+)/g, '<span class="text-[#0a66c2] font-medium cursor-pointer hover:underline">$1</span>');
}

function escapeHtml(str) {
  const el = document.createElement('div');
  el.textContent = str;
  return el.innerHTML;
}

// ─── Toast ───────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  clearTimeout(toastTimer);
  toastText.textContent = msg;
  toast.classList.remove('hidden');
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2500);
}

// ─── Boot ────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
