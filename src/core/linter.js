/**
 * PostCraft - Algorithm, SEO & Readability Health Linter
 * Protects LinkedIn reach, searchability (SEO), and screen-reader accessibility.
 */

import { isStyledUnicode } from './unicode-map.js';

export const LINKEDIN_MAX_CHARS = 3000;
export const MOBILE_CUTOFF_CHARS = 210;
export const MOBILE_CUTOFF_LINES = 3;
export const DESKTOP_CUTOFF_CHARS = 300;
export const DESKTOP_CUTOFF_LINES = 5;

/**
 * Full post health audit and analysis.
 * @param {string} text
 * @returns {object} Analysis report
 */
export function analyzePost(text = '') {
  if (!text) {
    return createEmptyAnalysis();
  }

  const rawLength = text.length;
  // Code point length handling emojis and surrogate pairs
  const charLength = Array.from(text).length;
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;

  // 1. Reading Time (Average 200 words per minute)
  const readingTimeSeconds = Math.max(1, Math.round((wordCount / 200) * 60));

  // 2. Unicode Density
  const unicodeMetrics = calculateUnicodeDensity(text);

  // 3. Hashtags & Mentions Audit
  const hashtagMetrics = auditHashtags(text);
  const mentionMetrics = auditMentions(text);

  // 4. "See More" Cutoff Calculations
  const cutoffMetrics = calculateCutoff(text, lines);

  // 5. Algorithm & Engagement Health Audit
  const hasExternalLinks = /https?:\/\/[^\s]+/i.test(text);

  // Check dense paragraphs without breathing room
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  let longParagraphCount = 0;
  for (const para of paragraphs) {
    const sentences = para.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0);
    if (sentences.length > 3 || para.length > 280) {
      longParagraphCount++;
    }
  }

  // Conversation trigger (ends with question mark, possibly followed by hashtags)
  const trimmed = text.trim();
  const endsWithQuestion = /\?\s*(?:#[^\s#]+(?:\s+#[^\s#]+)*)?\s*$/m.test(trimmed);

  // 6. Hook strength analysis
  const firstLine = lines[0] || '';
  const hookWordCount = firstLine.trim().split(/\s+/).filter(Boolean).length;
  const hookHasCuriosityPattern = /\b(here'?s\s+why|the\s+truth|stop\s+doing|nobody|what\s+if|I\s+was\s+wrong|unpopular\s+opinion|hot\s+take|myth|secret|mistake|lesson|changed\s+my|thought\s+I|turns\s+out)\b/i.test(firstLine)
    || /^\d+/.test(firstLine.trim())  // starts with a number
    || /\?$/.test(firstLine.trim());  // hook is a question
  const hookIsWallOfText = hookWordCount > 40;

  // 7. 360Brew Engagement Bait & Low-Information Reply Detection (arXiv:2501.16450)
  const engagementBaitPatterns = /\b(comment\s+(yes|below|if|for\s+reach)|like\s+if\s+you|share\s+this|tag\s+someone|repost\s+if|follow\s+me\s+for|drop\s+a|type\s+yes|say\s+yes|cfbr|agree\s+or\s+disagree|thoughts\?|one\s+word)\b/i;
  const hasEngagementBait = engagementBaitPatterns.test(text);

  // 8. 360Brew Token Context Depth & Sparse Text Warning (Anti-Pattern #3)
  const isSparseTokens = charLength > 0 && charLength < 150;

  // 9. 360Brew Hashtag Dilution (Anti-Pattern #2: noise tokens >15% of total words)
  const hashtagWordsCount = hashtagMetrics.count;
  const hashtagDilutionRatio = wordCount > 0 ? Math.round((hashtagWordsCount / wordCount) * 100) : 0;
  const isHashtagDiluted = hashtagDilutionRatio > 15 && hashtagMetrics.count >= 4;

  // 10. 360Brew Clickbait Mismatch (Anti-Pattern #4: sensational hook with shallow body)
  const clickbaitHookPattern = /\b(insane|shocking|you\s+won'?t\s+believe|mind-blowing|magic\s+trick|hidden\s+secret)\b/i;
  const hasClickbaitHook = clickbaitHookPattern.test(firstLine);
  const hasMismatchedHook = hasClickbaitHook && charLength < 350;

  // 11. Emoji count
  const emojiMatches = text.match(/[\p{Extended_Pictographic}]/gu) || [];
  const emojiCount = emojiMatches.length;

  // 12. White space ratio (blank lines / total lines)
  const blankLineCount = lines.filter(l => l.trim().length === 0).length;
  const whiteSpaceRatio = lineCount > 1 ? Math.round((blankLineCount / lineCount) * 100) : 0;

  // 13. Overall Health & Engagement Score (0 - 100) and Recommendations
  const { score, status, warnings, suggestions, engagement } = calculateHealthScore({
    charLength,
    unicodeDensity: unicodeMetrics.density,
    hashtags: hashtagMetrics,
    cutoff: cutoffMetrics,
    hasExternalLinks,
    longParagraphCount,
    endsWithQuestion,
    lineCount,
    wordCount,
    hookWordCount,
    hookHasCuriosityPattern,
    hookIsWallOfText,
    hasEngagementBait,
    isSparseTokens,
    isHashtagDiluted,
    hasMismatchedHook,
    emojiCount,
    whiteSpaceRatio
  });

  return {
    metrics: {
      charCount: charLength,
      maxChars: LINKEDIN_MAX_CHARS,
      charLimitPercentage: Math.min(100, Math.round((charLength / LINKEDIN_MAX_CHARS) * 100)),
      isOverLimit: charLength > LINKEDIN_MAX_CHARS,
      wordCount,
      lineCount,
      readingTimeSeconds
    },
    seo: {
      unicodeDensity: unicodeMetrics.density,
      styledCount: unicodeMetrics.styledCount,
      totalAlphanumeric: unicodeMetrics.totalAlphanumeric,
      unicodeStatus: unicodeMetrics.status,
      hashtags: hashtagMetrics,
      mentions: mentionMetrics
    },
    cutoff: cutoffMetrics,
    score,
    status,
    warnings,
    suggestions,
    engagement
  };
}

/**
 * Calculates the percentage of text that is formatted with mathematical Unicode.
 * More than 25% hurts LinkedIn SEO search indexing and screen-reader accessibility.
 */
function calculateUnicodeDensity(text) {
  let styledCount = 0;
  let totalAlphanumeric = 0;

  // Combining characters (underline \u0332, strike \u0336)
  const combiningMatches = text.match(/[\u0332\u0336]/g);
  if (combiningMatches) {
    styledCount += combiningMatches.length;
  }

  for (const char of text) {
    // Check if character is alphanumeric (standard ASCII)
    const isAsciiAlphaNum = /[a-zA-Z0-9]/.test(char);
    const isStyled = isStyledUnicode(char);

    if (isAsciiAlphaNum || isStyled) {
      totalAlphanumeric++;
    }

    if (isStyled) {
      styledCount++;
    }
  }

  const density = totalAlphanumeric > 0
    ? Math.round((styledCount / totalAlphanumeric) * 100)
    : 0;

  let status = 'optimal'; // < 15%
  if (density > 25) {
    status = 'danger';
  } else if (density > 15) {
    status = 'warning';
  }

  return {
    density,
    styledCount,
    totalAlphanumeric,
    status
  };
}

/**
 * Audits hashtags to ensure optimal count and plain ASCII encoding.
 */
function auditHashtags(text) {
  const matches = text.match(/#[^\s#@.,!?;:()[\]{}]+/g) || [];
  const items = matches.map(tag => {
    // Check if tag contains styled Unicode
    const hasUnicode = Array.from(tag).some(c => isStyledUnicode(c) || /[\u0332\u0336]/.test(c));
    return {
      tag,
      isPlainAscii: !hasUnicode
    };
  });

  const count = items.length;
  const invalidTags = items.filter(t => !t.isPlainAscii);

  return {
    count,
    items,
    hasBrokenTags: invalidTags.length > 0,
    brokenTags: invalidTags.map(t => t.tag),
    optimalCount: count >= 3 && count <= 5
  };
}

/**
 * Audits @mentions to ensure they are standard ASCII.
 */
function auditMentions(text) {
  const matches = text.match(/@[a-zA-Z0-9_.-]+/g) || [];
  return {
    count: matches.length,
    items: matches
  };
}

/**
 * Calculates exact "See More" cutoff point for Mobile and Desktop views.
 */
function calculateCutoff(text, lines) {
  // Mobile Cutoff: 3 lines OR 210 chars
  let mobileCutoffIndex = -1;
  let mobileSnippet = text;
  let isMobileCutoff = false;

  // Check 3 lines threshold
  if (lines.length > MOBILE_CUTOFF_LINES) {
    isMobileCutoff = true;
    const firstThree = lines.slice(0, MOBILE_CUTOFF_LINES).join('\n');
    mobileCutoffIndex = firstThree.length;
    mobileSnippet = firstThree;
  }

  // Check character threshold
  if (text.length > MOBILE_CUTOFF_CHARS && (!isMobileCutoff || mobileCutoffIndex > MOBILE_CUTOFF_CHARS)) {
    isMobileCutoff = true;
    // Find closest word boundary before 210 chars
    const candidate = text.slice(0, MOBILE_CUTOFF_CHARS);
    const lastSpace = candidate.lastIndexOf(' ');
    mobileCutoffIndex = lastSpace > 140 ? lastSpace : MOBILE_CUTOFF_CHARS;
    mobileSnippet = text.slice(0, mobileCutoffIndex);
  }

  // Desktop Cutoff: 5 lines OR 300 chars
  let desktopCutoffIndex = -1;
  let desktopSnippet = text;
  let isDesktopCutoff = false;

  if (lines.length > DESKTOP_CUTOFF_LINES) {
    isDesktopCutoff = true;
    const firstFive = lines.slice(0, DESKTOP_CUTOFF_LINES).join('\n');
    desktopCutoffIndex = firstFive.length;
    desktopSnippet = firstFive;
  }

  if (text.length > DESKTOP_CUTOFF_CHARS && (!isDesktopCutoff || desktopCutoffIndex > DESKTOP_CUTOFF_CHARS)) {
    isDesktopCutoff = true;
    const candidate = text.slice(0, DESKTOP_CUTOFF_CHARS);
    const lastSpace = candidate.lastIndexOf(' ');
    desktopCutoffIndex = lastSpace > 200 ? lastSpace : DESKTOP_CUTOFF_CHARS;
    desktopSnippet = text.slice(0, desktopCutoffIndex);
  }

  return {
    mobile: {
      isCutoff: isMobileCutoff,
      cutoffIndex: mobileCutoffIndex,
      visibleSnippet: mobileSnippet,
      hiddenSnippet: isMobileCutoff ? text.slice(mobileCutoffIndex) : '',
      cutoffLine: MOBILE_CUTOFF_LINES,
      maxChars: MOBILE_CUTOFF_CHARS
    },
    desktop: {
      isCutoff: isDesktopCutoff,
      cutoffIndex: desktopCutoffIndex,
      visibleSnippet: desktopSnippet,
      hiddenSnippet: isDesktopCutoff ? text.slice(desktopCutoffIndex) : '',
      cutoffLine: DESKTOP_CUTOFF_LINES,
      maxChars: DESKTOP_CUTOFF_CHARS
    }
  };
}

/**
 * Calculates overall algorithm health score and provides actionable guidance.
 * Enhanced with 2026 LinkedIn algorithm signals.
 */
function calculateHealthScore({
  charLength,
  unicodeDensity,
  hashtags,
  cutoff,
  hasExternalLinks = false,
  longParagraphCount = 0,
  endsWithQuestion = false,
  lineCount = 0,
  wordCount = 0,
  hookWordCount = 0,
  hookHasCuriosityPattern = false,
  hookIsWallOfText = false,
  hasEngagementBait = false,
  isSparseTokens = false,
  isHashtagDiluted = false,
  hasMismatchedHook = false,
  emojiCount = 0,
  whiteSpaceRatio = 0
}) {
  let score = 100;
  const warnings = [];
  const suggestions = [];

  // ── PENALTIES ──────────────────────────────────────────────────

  // 1. Hard blocker: over 3,000 characters
  if (charLength > LINKEDIN_MAX_CHARS) {
    score -= 40;
    warnings.push(`Post exceeds LinkedIn limit (${charLength}/${LINKEDIN_MAX_CHARS} chars).`);
  }

  // 2. External links — 40-60% reach suppression
  if (hasExternalLinks) {
    score -= 30;
    warnings.push('External link in body triggers a 40–60% reach penalty. Move link to the 1st comment!');
  }

  // 3. Dense walls of text
  if (longParagraphCount > 0) {
    score -= 10;
    suggestions.push(`Break up ${longParagraphCount} dense block(s) into 1–2 sentence paragraphs for dwell time.`);
  }

  // 4. Unicode density
  if (unicodeDensity > 25) {
    score -= 25;
    warnings.push(`High Unicode density (${unicodeDensity}%). Exceeding 25% impairs screen-readers and 360Brew tokenization.`);
  } else if (unicodeDensity > 15) {
    score -= 10;
    suggestions.push(`Unicode density is moderate (${unicodeDensity}%). Keep styling to headers and key phrases.`);
  } else if (unicodeDensity > 0) {
    suggestions.push(`Unicode styling is optimal (${unicodeDensity}%) ✓`);
  }

  // 5. Broken hashtags
  if (hashtags.hasBrokenTags) {
    score -= 15;
    warnings.push(`Hashtags contain styled Unicode: ${hashtags.brokenTags.join(', ')}. LinkedIn can't index formatted hashtags!`);
  }

  // 6. Hashtag count & 360Brew noise dilution
  if (isHashtagDiluted) {
    score -= 10;
    warnings.push('Hashtag noise dilution: tags make up >15% of post tokens. Dilutes 360Brew topic classification.');
  } else if (hashtags.count > 5) {
    score -= 10;
    suggestions.push(`${hashtags.count} hashtags detected. 360Brew recommends 1–3 focused hashtags.`);
  } else if (hashtags.count === 0 && charLength > 100) {
    suggestions.push('Add 1–3 relevant hashtags at the bottom to boost discovery.');
  }

  // 7. Hook strength (wall of text penalty)
  if (hookIsWallOfText) {
    score -= 10;
    warnings.push('First line is a wall of text (40+ words). Break your hook into a short, punchy opener.');
  }

  // 8. 360Brew Engagement bait & low-information replies
  if (hasEngagementBait) {
    score -= 15;
    warnings.push('Engagement bait detected (e.g., "CFBR", "comment YES", "agree or disagree"). 360Brew demotes shallow replies.');
  }

  // 9. 360Brew Sparse text token warning (Anti-Pattern #3)
  if (isSparseTokens) {
    score -= 15;
    warnings.push('Sparse text (<150 chars). 360Brew needs standalone body tokens to match member interest graphs.');
  }

  // 10. 360Brew Clickbait mismatch (Anti-Pattern #4)
  if (hasMismatchedHook) {
    score -= 10;
    warnings.push('Clickbait hook mismatch: sensational opening without matching explanatory body depth.');
  }

  // 11. Emoji overuse
  if (emojiCount > 8) {
    score -= 5;
    suggestions.push(`${emojiCount} emojis detected. Keep to 2–3 for professional tone.`);
  } else if (emojiCount >= 6) {
    suggestions.push(`${emojiCount} emojis. Consider reducing to 2–3 for a cleaner look.`);
  }

  // 12. Poor white space (no breathing room)
  if (lineCount > 5 && whiteSpaceRatio < 15) {
    score -= 5;
    suggestions.push('Low white space — add blank lines between paragraphs for mobile readability.');
  }

  // 13. Too short (<300 chars, but not sparse <150 which is already penalized)
  if (charLength >= 150 && charLength < 300) {
    score -= 5;
    suggestions.push('Post is under 300 characters. Consider expanding for deeper dwell time.');
  }

  // 14. Too long (low completion rate)
  if (charLength > 2500 && charLength <= LINKEDIN_MAX_CHARS) {
    score -= 5;
    suggestions.push('Post exceeds 2,500 chars. Consider trimming for higher reader completion rate.');
  }

  // 15. No CTA / closing question penalty
  if (charLength > 200 && !endsWithQuestion) {
    score -= 5;
    suggestions.push('Add a closing question to drive comments — LinkedIn’s #1 ranking signal.');
  }

  // ── BONUSES ────────────────────────────────────────────────────

  // 16. Strong hook bonus
  if (hookWordCount > 0 && hookWordCount <= 10 && !hookIsWallOfText) {
    score += 5;
    suggestions.push(`Strong hook (${hookWordCount} words). Short openers stop the scroll ✓`);
  }

  // 17. Curiosity pattern bonus
  if (hookHasCuriosityPattern) {
    score += 5;
    suggestions.push('Hook has a curiosity pattern — drives higher "see more" clicks ✓');
  }

  // 18. Sweet spot length bonus (1,300-1,900 chars)
  if (charLength >= 1300 && charLength <= 1900) {
    score += 5;
    suggestions.push(`Post length is in the engagement sweet spot (${charLength} chars) ✓`);
  }

  // 19. Closing question bonus
  if (endsWithQuestion) {
    score += 5;
    suggestions.push('Closing question drives comments — the algorithm’s #1 signal! 💬 ✓');
  }

  // 20. Hook length bonus (well-positioned before fold)
  if (cutoff.mobile.isCutoff && cutoff.mobile.visibleSnippet.length >= 50 && cutoff.mobile.visibleSnippet.length <= MOBILE_CUTOFF_CHARS) {
    score += 5;
    suggestions.push(`Hook is ${cutoff.mobile.visibleSnippet.length} chars (well-positioned before fold) ✓`);
  }

  // ── FINAL SCORE ────────────────────────────────────────────────

  score = Math.max(0, Math.min(100, score));

  let status = 'High Reach 🚀';
  if (score < 65) status = 'Needs Work ⚠️';
  else if (score < 85) status = 'Moderate 📈';

  // ── ENGAGEMENT FACTORS (for Coach modal) ───────────────────────

  const hookStatus = hookIsWallOfText ? 'Too Dense' : (hookWordCount <= 10 ? 'Strong' : 'Good');
  const hookLabel = hookIsWallOfText
    ? `${hookWordCount} words (break it up)`
    : (hookWordCount <= 10 ? `${hookWordCount} words (punchy) ✓` : `${hookWordCount} words before fold`);

  const engagement = {
    score,
    status,
    factors: {
      hook: {
        isOptimal: !hookIsWallOfText && hookWordCount <= 10,
        label: hookLabel,
        status: hookStatus
      },
      readability: {
        isOptimal: longParagraphCount === 0 && whiteSpaceRatio >= 15,
        label: longParagraphCount === 0
          ? (whiteSpaceRatio >= 15 ? 'Great spacing & bites ✓' : 'Good bites, add more spacing')
          : `${longParagraphCount} dense block(s)`,
        status: longParagraphCount === 0 ? (whiteSpaceRatio >= 15 ? 'Optimal' : 'Needs Spacing') : 'Needs Spacing'
      },
      linkSafety: {
        isSafe: !hasExternalLinks,
        label: hasExternalLinks ? 'Link in body (−40% reach)' : 'Zero links (Full reach) ✓',
        status: hasExternalLinks ? 'Penalty Risk' : 'Protected'
      },
      hashtags: {
        isOptimal: hashtags.count <= 5 && !hashtags.hasBrokenTags && !isHashtagDiluted,
        label: isHashtagDiluted ? 'Hashtag dilution (>15%)' : (`${hashtags.count} tag(s)` + (hashtags.count > 5 ? ' (Too many)' : (hashtags.hasBrokenTags ? ' (Broken)' : ' ✓'))),
        status: hashtags.count <= 5 && !hashtags.hasBrokenTags && !isHashtagDiluted ? 'Optimal' : 'Needs Review'
      },
      tokenContext: {
        isOptimal: !isSparseTokens && !hasMismatchedHook,
        label: isSparseTokens ? 'Sparse text (<150 chars)' : (hasMismatchedHook ? 'Clickbait mismatch' : '360Brew token aligned ✓'),
        status: (!isSparseTokens && !hasMismatchedHook) ? 'Optimal' : 'Needs Depth'
      },
      conversation: {
        hasQuestion: endsWithQuestion,
        label: endsWithQuestion ? 'Discussion question included 💬 ✓' : 'No closing question (−5)',
        status: endsWithQuestion ? 'Optimal' : 'Missing'
      }
    }
  };

  return { score, status, warnings, suggestions, engagement };
}

function createEmptyAnalysis() {
  return {
    metrics: {
      charCount: 0,
      maxChars: LINKEDIN_MAX_CHARS,
      charLimitPercentage: 0,
      isOverLimit: false,
      wordCount: 0,
      lineCount: 0,
      readingTimeSeconds: 0
    },
    seo: {
      unicodeDensity: 0,
      styledCount: 0,
      totalAlphanumeric: 0,
      unicodeStatus: 'optimal',
      hashtags: { count: 0, items: [], hasBrokenTags: false, brokenTags: [], optimalCount: false },
      mentions: { count: 0, items: [] }
    },
    cutoff: {
      mobile: { isCutoff: false, cutoffIndex: -1, visibleSnippet: '', hiddenSnippet: '', cutoffLine: MOBILE_CUTOFF_LINES, maxChars: MOBILE_CUTOFF_CHARS },
      desktop: { isCutoff: false, cutoffIndex: -1, visibleSnippet: '', hiddenSnippet: '', cutoffLine: DESKTOP_CUTOFF_LINES, maxChars: DESKTOP_CUTOFF_CHARS }
    },
    score: 100,
    status: 'Ready to write',
    warnings: [],
    suggestions: ['Start typing your post to check LinkedIn algorithm score and engagement.'],
    engagement: {
      score: 100,
      status: 'Ready',
      factors: {
        hook: { isOptimal: true, label: 'Ready', status: 'Optimal' },
        readability: { isOptimal: true, label: 'Ready', status: 'Optimal' },
        linkSafety: { isSafe: true, label: 'Clean', status: 'Protected' },
        hashtags: { isOptimal: true, label: '0 tags', status: 'Optimal' },
        tokenContext: { isOptimal: true, label: 'Ready', status: 'Optimal' },
        conversation: { hasQuestion: false, label: 'None', status: 'Optional' }
      }
    }
  };
}
