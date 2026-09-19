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

  // Conversation trigger (ends with question mark)
  const trimmed = text.trim();
  const endsWithQuestion = /\?\s*(?:#[^\s#]+(?:\s+#[^\s#]+)*)?\s*$/m.test(trimmed);

  // 6. Overall Health & Engagement Score (0 - 100) and Recommendations
  const { score, status, warnings, suggestions, engagement } = calculateHealthScore({
    charLength,
    unicodeDensity: unicodeMetrics.density,
    hashtags: hashtagMetrics,
    cutoff: cutoffMetrics,
    hasExternalLinks,
    longParagraphCount,
    endsWithQuestion,
    lineCount,
    wordCount
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
 */
function calculateHealthScore({
  charLength,
  unicodeDensity,
  hashtags,
  cutoff,
  hasExternalLinks = false,
  longParagraphCount = 0,
  endsWithQuestion = false
}) {
  let score = 100;
  const warnings = [];
  const suggestions = [];

  // 1. Hard blocker: over 3,000 characters
  if (charLength > LINKEDIN_MAX_CHARS) {
    score -= 40;
    warnings.push(`Post exceeds LinkedIn limit (${charLength}/${LINKEDIN_MAX_CHARS} chars).`);
  }

  // 2. Algorithm Reach Penalty: External links in post body (40-60% reach suppression)
  if (hasExternalLinks) {
    score -= 20;
    warnings.push('External link in body triggers a 40–60% LinkedIn reach penalty. Move link to the 1st comment!');
  }

  // 3. Dense walls of text: Hurts mobile dwell time
  if (longParagraphCount > 0) {
    score -= 10;
    suggestions.push(`Break up ${longParagraphCount} dense block(s) into 1–2 sentence paragraphs to increase reader dwell time.`);
  }

  // 4. Unicode density penalty
  if (unicodeDensity > 25) {
    score -= 25;
    warnings.push(`High Unicode density (${unicodeDensity}%). Exceeding 25% impairs screen-readers and LinkedIn SEO indexing.`);
  } else if (unicodeDensity > 15) {
    score -= 10;
    suggestions.push(`Unicode density is moderate (${unicodeDensity}%). Keep styled text limited to key hooks and bullet points.`);
  } else if (unicodeDensity > 0) {
    suggestions.push(`Unicode styling is optimal (${unicodeDensity}%). Great accessibility & searchability.`);
  }

  // 5. Broken hashtags check
  if (hashtags.hasBrokenTags) {
    score -= 15;
    warnings.push(`Hashtags contain styled Unicode: ${hashtags.brokenTags.join(', ')}. LinkedIn algorithms cannot index formatted hashtags!`);
  }

  // 6. Hashtag count (2026: 1-3 targeted hashtags optimal)
  if (hashtags.count > 5) {
    score -= 10;
    suggestions.push(`You have ${hashtags.count} hashtags. LinkedIn recommends 1–3 focused hashtags to avoid spam filtering.`);
  } else if (hashtags.count === 0) {
    suggestions.push(`Consider adding 1–3 relevant hashtags at the bottom to boost discovery.`);
  }

  // 7. Hook quality & See More click gateway
  if (cutoff.mobile.isCutoff) {
    if (cutoff.mobile.visibleSnippet.length < 50) {
      suggestions.push(`Hook before "...see more" is very brief. Make sure the first 2-3 lines deliver an irresistible curiosity gap.`);
    } else {
      suggestions.push(`Hook is ${cutoff.mobile.visibleSnippet.length} chars (perfectly positioned before the mobile fold) ✓`);
    }
  }

  // 8. Comment / conversation driver
  if (endsWithQuestion) {
    suggestions.push('Ending with an open question drives comments—the LinkedIn algorithm’s #1 ranking signal! 💬');
  }

  score = Math.max(0, Math.min(100, score));

  let status = 'High Reach 🚀';
  if (score < 65) status = 'Needs Work ⚠️';
  else if (score < 85) status = 'Moderate 📈';

  const engagement = {
    score,
    status,
    factors: {
      hook: {
        isOptimal: cutoff.mobile.isCutoff ? cutoff.mobile.visibleSnippet.length >= 50 && cutoff.mobile.visibleSnippet.length <= MOBILE_CUTOFF_CHARS : true,
        label: cutoff.mobile.isCutoff ? `${cutoff.mobile.visibleSnippet.length} chars before fold` : 'Short (No fold)',
        status: cutoff.mobile.isCutoff ? 'Good' : 'Optimal'
      },
      readability: {
        isOptimal: longParagraphCount === 0,
        label: longParagraphCount === 0 ? 'Short 1-2 sentence bites' : `${longParagraphCount} dense block(s)`,
        status: longParagraphCount === 0 ? 'Optimal' : 'Needs Spacing'
      },
      linkSafety: {
        isSafe: !hasExternalLinks,
        label: hasExternalLinks ? 'Link in body (-40% reach)' : 'Zero links (Full reach)',
        status: hasExternalLinks ? 'Penalty Risk' : 'Protected'
      },
      hashtags: {
        isOptimal: hashtags.count <= 5 && !hashtags.hasBrokenTags,
        label: `${hashtags.count} tag(s)` + (hashtags.count > 5 ? ' (Too many)' : ' (Clean)'),
        status: hashtags.count <= 5 && !hashtags.hasBrokenTags ? 'Optimal' : 'Needs Review'
      },
      conversation: {
        hasQuestion: endsWithQuestion,
        label: endsWithQuestion ? 'Discussion question included 💬' : 'No closing question',
        status: endsWithQuestion ? 'Optimal' : 'Optional'
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
        conversation: { hasQuestion: false, label: 'None', status: 'Optional' }
      }
    }
  };
}
