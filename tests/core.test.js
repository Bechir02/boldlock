import { describe, it, expect } from 'vitest';
import {
  applyStyle,
  toPlainAscii,
  isStyledUnicode,
  isStyledWith,
  toggleStyle,
  toggleBullets,
  stripListPrefix,
  renumberNumberedList,
  BULLET_STYLES
} from '../src/core/unicode-map.js';
import {
  preserveLineBreaks,
  cleanLineBreaks,
  isPreservedBlankLine,
  INVISIBLE_SPACE
} from '../src/core/spacer.js';
import {
  parseMarkdown,
  parseHtml
} from '../src/core/parser.js';
import {
  analyzePost,
  LINKEDIN_MAX_CHARS,
  MOBILE_CUTOFF_CHARS
} from '../src/core/linter.js';
import {
  organizePostStructure
} from '../src/core/organizer.js';

describe('ScrollStop Core - Unicode Map Engine', () => {
  it('converts ASCII text to Sans-Serif Bold', () => {
    const input = 'PostCraft 2026';
    const styled = applyStyle(input, 'sansBold');
    expect(styled).toBe('𝗣𝗼𝘀𝘁𝗖𝗿𝗮𝗳𝘁 𝟮𝟬𝟮𝟲');
  });

  it('converts ASCII text to Serif Bold', () => {
    const input = 'PostCraft 2026';
    const styled = applyStyle(input, 'serifBold');
    expect(styled).toBe('𝐏𝐨𝐬𝐭𝐂𝐫𝐚𝐟𝐭 𝟐𝟎𝟐𝟔');
  });

  it('converts ASCII text to Sans-Serif Italic', () => {
    const input = 'Modern Creator';
    const styled = applyStyle(input, 'italic');
    expect(styled).toBe('𝘔𝘰𝘥𝘦𝘳𝘯 𝘊𝘳𝘦𝘢𝘵𝘰𝘳');
  });

  it('converts ASCII text to Monospace', () => {
    const input = 'npm run dev';
    const styled = applyStyle(input, 'monospace');
    expect(styled).toBe('𝚗𝚙𝚖 𝚛𝚞𝚗 𝚍𝚎𝚟');
  });

  it('applies combining underline and strikethrough', () => {
    const underlined = applyStyle('Hi', 'underline');
    expect(underlined).toBe('H\u0332i\u0332');

    const striked = applyStyle('No', 'strike');
    expect(striked).toBe('N\u0336o\u0336');
  });

  it('protects #hashtags and @mentions by default', () => {
    const input = 'Awesome update for #buildinpublic and @sarah!';
    const styled = applyStyle(input, 'sansBold');

    expect(styled).toContain('#buildinpublic');
    expect(styled).toContain('@sarah');
    expect(styled.startsWith('𝗔𝘄𝗲𝘀𝗼𝗺𝗲')).toBe(true);
  });

  it('performs 100% accurate round-trip conversion with toPlainAscii', () => {
    const original = 'PostCraft Engine handles ALL 123 numbers & special punctuation! #tag @mention';

    const sansBold = applyStyle(original, 'sansBold');
    expect(toPlainAscii(sansBold)).toBe(original);

    const serifBold = applyStyle(original, 'serifBold');
    expect(toPlainAscii(serifBold)).toBe(original);

    const italic = applyStyle(original, 'italic');
    expect(toPlainAscii(italic)).toBe(original);

    const mono = applyStyle(original, 'monospace');
    expect(toPlainAscii(mono)).toBe(original);

    const underline = applyStyle(original, 'underline');
    expect(toPlainAscii(underline)).toBe(original);

    const strike = applyStyle(original, 'strike');
    expect(toPlainAscii(strike)).toBe(original);
  });

  it('correctly identifies styled Unicode characters', () => {
    expect(isStyledUnicode('𝗣')).toBe(true);
    expect(isStyledUnicode('𝐌')).toBe(true);
    expect(isStyledUnicode('𝘊')).toBe(true);
    expect(isStyledUnicode('𝚗')).toBe(true);
    expect(isStyledUnicode('P')).toBe(false);
    expect(isStyledUnicode('1')).toBe(false);
  });

  it('correctly toggles style on and off', () => {
    const original = 'Growth Hack';
    const bolded = toggleStyle(original, 'sansBold');
    expect(bolded).toBe('𝗚𝗿𝗼𝘄𝘁𝗵 𝗛𝗮𝗰𝗸');

    // Toggling bolded text should unbold it back to original ASCII!
    const unbolded = toggleStyle(bolded, 'sansBold');
    expect(unbolded).toBe('Growth Hack');

    // Toggling underline on and off
    const underlined = toggleStyle(original, 'underline');
    expect(underlined).toBe('G\u0332r\u0332o\u0332w\u0332t\u0332h\u0332 \u0332H\u0332a\u0332c\u0332k\u0332');
    const notUnderlined = toggleStyle(underlined, 'underline');
    expect(notUnderlined).toBe('Growth Hack');

    // Switching styles directly
    const italicized = toggleStyle(bolded, 'italic');
    expect(italicized).toBe('𝘎𝘳𝘰𝘸𝘵𝘩 𝘏𝘢𝘤𝘬');
  });
});

describe('ScrollStop Core - Spacing Engine', () => {
  it('preserves blank lines by injecting invisible zero-width spaces', () => {
    const input = 'First paragraph.\n\nSecond paragraph.\n\n\nThird paragraph.';
    const preserved = preserveLineBreaks(input);

    const lines = preserved.split('\n');
    expect(lines[0]).toBe('First paragraph.');
    expect(lines[1]).toBe(INVISIBLE_SPACE);
    expect(lines[2]).toBe('Second paragraph.');
    expect(lines[3]).toBe(INVISIBLE_SPACE);
    expect(lines[4]).toBe(INVISIBLE_SPACE);
    expect(lines[5]).toBe('Third paragraph.');
  });

  it('cleans invisible zero-width spaces when roundtripping', () => {
    const input = 'First paragraph.\n\nSecond paragraph.';
    const preserved = preserveLineBreaks(input);
    const cleaned = cleanLineBreaks(preserved);

    expect(cleaned).toBe(input);
  });

  it('detects preserved blank lines', () => {
    expect(isPreservedBlankLine(INVISIBLE_SPACE)).toBe(true);
    expect(isPreservedBlankLine('   ' + INVISIBLE_SPACE)).toBe(true);
    expect(isPreservedBlankLine('Actual content')).toBe(false);
    expect(isPreservedBlankLine('')).toBe(false);
  });
});

describe('ScrollStop Core - Parser Engine', () => {
  it('converts markdown syntax to Unicode', () => {
    const md = '**Bold Title**\n*Italic text*\n~~Old text~~\n__Underlined__\n`const x = 1;`';
    const parsed = parseMarkdown(md);

    expect(parsed).toContain('𝗕𝗼𝗹𝗱 𝗧𝗶𝘁𝗹𝗲');
    expect(parsed).toContain('𝘐𝘵𝘢𝘭𝘪𝘤 𝘵𝘦𝘹𝘵');
    expect(parsed).toContain('O\u0336l\u0336d\u0336 \u0336t\u0336e\u0336x\u0336t\u0336');
    expect(parsed).toContain('U\u0332n\u0332d\u0332e\u0332r\u0332l\u0332i\u0332n\u0332e\u0332d\u0332');
    expect(parsed).toContain('𝚌𝚘𝚗𝚜𝚝 𝚡 = 𝟷;');
  });

  it('converts markdown lists to styled bullet points', () => {
    const md = '- First point\n- Second point\n* Third point';
    const parsed = parseMarkdown(md);

    expect(parsed).toBe('• First point\n• Second point\n• Third point');
  });

  it('converts rich HTML with bold, italic, and bullet tags', () => {
    const html = '<p><strong>Executive Summary:</strong></p><p>We grew <em>rapidly</em> (<strong>200%</strong> YoY).</p><ul><li>Key metric 1</li><li>Key metric 2</li></ul>';
    const parsed = parseHtml(html);

    expect(parsed).toContain('𝗘𝘅𝗲𝗰𝘂𝘁𝗶𝘃𝗲 𝗦𝘂𝗺𝗺𝗮𝗿𝘆:');
    expect(parsed).toContain('𝘳𝘢𝘱𝘪𝘥𝘭𝘺');
    expect(parsed).toContain('𝟮𝟬𝟬%');
    expect(parsed).toContain('• Key metric 1');
    expect(parsed).toContain('• Key metric 2');
  });
});

describe('ScrollStop Core - Health Linter Engine', () => {
  it('accurately counts characters, words, and reading time', () => {
    const text = 'Here is a strong hook for your audience.\n\nDelivering value consistently is key.';
    const audit = analyzePost(text);

    expect(audit.metrics.wordCount).toBe(13);
    expect(audit.metrics.charCount).toBe(text.length);
    expect(audit.metrics.isOverLimit).toBe(false);
    expect(audit.metrics.readingTimeSeconds).toBeGreaterThanOrEqual(1);
  });

  it('calculates Unicode density and warns when >25%', () => {
    const plainText = 'This is 100 percent plain ASCII text without any special formatting.';
    const plainAudit = analyzePost(plainText);
    expect(plainAudit.seo.unicodeDensity).toBe(0);
    expect(plainAudit.seo.unicodeStatus).toBe('optimal');

    const heavyStyled = applyStyle('ALL WORDS ARE BOLD UNICODE HERE', 'sansBold');
    const styledAudit = analyzePost(heavyStyled);
    expect(styledAudit.seo.unicodeDensity).toBe(100);
    expect(styledAudit.seo.unicodeStatus).toBe('danger');
    expect(styledAudit.warnings.some(w => w.includes('High Unicode density'))).toBe(true);
  });

  it('detects and flags broken Unicode hashtags', () => {
    const goodPost = 'Great insights today! #leadership #marketing #growth';
    const goodAudit = analyzePost(goodPost);
    expect(goodAudit.seo.hashtags.count).toBe(3);
    expect(goodAudit.seo.hashtags.hasBrokenTags).toBe(false);

    // Broken hashtag created with styled unicode: #𝗹𝗲𝗮𝗱𝗲𝗿𝘀𝗵𝗶𝗽
    const brokenTag = '#' + applyStyle('leadership', 'sansBold', { preserveTags: false });
    const brokenPost = `Important note: ${brokenTag}`;
    const brokenAudit = analyzePost(brokenPost);
    expect(brokenAudit.seo.hashtags.hasBrokenTags).toBe(true);
    expect(brokenAudit.warnings.some(w => w.includes('Hashtags contain styled Unicode'))).toBe(true);
  });

  it('calculates mobile and desktop "See More" cutoff correctly', () => {
    // 6 lines with plenty of text
    const longPost = [
      'Line 1: Irresistible hook that grabs attention immediately.',
      'Line 2: Second sentence providing intriguing context.',
      'Line 3: The curiosity gap that forces the click.',
      'Line 4: This should be hidden behind See More on mobile.',
      'Line 5: Still part of the body.',
      'Line 6: Call to action.'
    ].join('\n');

    const audit = analyzePost(longPost);
    expect(audit.cutoff.mobile.isCutoff).toBe(true);
    expect(audit.cutoff.mobile.visibleSnippet).toContain('Line 1');
    expect(audit.cutoff.mobile.visibleSnippet).toContain('Line 3');
    expect(audit.cutoff.mobile.visibleSnippet).not.toContain('Line 4');

    expect(audit.cutoff.desktop.isCutoff).toBe(true);
    expect(audit.cutoff.desktop.visibleSnippet).toContain('Line 5');
    expect(audit.cutoff.desktop.visibleSnippet).not.toContain('Line 6');
  });

  it('penalizes posts exceeding the 3,000 character limit', () => {
    const hugeText = 'A'.repeat(3050);
    const audit = analyzePost(hugeText);
    expect(audit.metrics.isOverLimit).toBe(true);
    expect(audit.score).toBeLessThan(70);
    expect(audit.warnings.some(w => w.includes('exceeds LinkedIn limit'))).toBe(true);
  });
});

describe('ScrollStop Core - Post Structure & Organization Engine', () => {
  it('correctly organizes raw drafts into standard LinkedIn paragraphs, bolded headers, and bullets', () => {
    const rawDraft = [
      "I’m excited to share a new data science project I’ve been working on, combining my passion for football with data.",
      "The objective is to transform football data into meaningful insights and build an interactive performance dashboard for Real Madrid’s 2025/26 season.",
      "🛠️ Tools & Technologies:",
      "🐍 Python — Data cleaning, preprocessing & exploration",
      "🗄️ SQL — Data management & structuring",
      "📊 Power BI — Data modeling, DAX & visualization",
      "📈 Data Science — Exploratory analysis and insight generation",
      "The first stage of the project focuses on a Team Performance Overview, including:",
      "Total goals, assists and minutes",
      "Top 5 scorers and assist providers",
      "Player performance overview",
      "Average age by position",
      "Minutes distribution by position",
      "Interactive player filtering",
      "This project is an opportunity to apply my data science skills to a real-world domain I’m passionate about: football.",
      "More to come as I continue developing the project. ⚽📊"
    ].join('\n');

    const structured = organizePostStructure(rawDraft);

    // 1. Hook is isolated with double newline
    expect(structured).toContain("I’m excited to share a new data science project");
    expect(structured).toContain("\n\nThe objective is to transform football data");

    // 2. Section headers are bolded with Unicode sansBold
    expect(structured).toContain("🛠️ 𝗧𝗼𝗼𝗹𝘀 & 𝗧𝗲𝗰𝗵𝗻𝗼𝗹𝗼𝗴𝗶𝗲𝘀:");
    expect(structured).toContain("𝗧𝗲𝗮𝗺 𝗣𝗲𝗿𝗳𝗼𝗿𝗺𝗮𝗻𝗰𝗲 𝗢𝘃𝗲𝗿𝘃𝗶𝗲𝘄");

    // 3. Lists are cleanly bulleted
    expect(structured).toContain("• 🐍 Python — Data cleaning");
    expect(structured).toContain("• 🗄️ SQL — Data management");
    expect(structured).toContain("• Total goals, assists and minutes");
    expect(structured).toContain("• Interactive player filtering");

    // 4. Closing takeaway is spaced out
    expect(structured).toContain("\n\nThis project is an opportunity");
    expect(structured).toContain("\n\nMore to come as I continue developing the project. ⚽📊");

    // 5. Original wording is 100% preserved
    expect(structured).toContain("Real Madrid’s 2025/26 season");
    expect(structured).toContain("Minutes distribution by position");
  });

  it('detects external links and flags algorithm reach penalty warning', () => {
    const postWithLink = 'Check out our new launch live here: https://example.com/project and let me know!';
    const audit = analyzePost(postWithLink);

    expect(audit.engagement.factors.linkSafety.isSafe).toBe(false);
    expect(audit.warnings.some(w => w.includes('reach penalty'))).toBe(true);
  });

  it('evaluates dwell time readability and conversation triggers', () => {
    const postWithQuestion = 'Here is a lesson from building tools.\n\nSimplicity always wins.\n\nWhat has been your experience?';
    const audit = analyzePost(postWithQuestion);

    expect(audit.engagement.factors.conversation.hasQuestion).toBe(true);
    expect(audit.engagement.factors.readability.isOptimal).toBe(true);
  });
});

describe('ScrollStop Algorithm v2 — Enhanced Engagement Scoring', () => {
  it('rewards short punchy hooks with a bonus', () => {
    const post = 'Stop doing this.\n\nMost people think productivity is about doing more. It is not.\n\nWhat is your take?';
    const audit = analyzePost(post);

    // Hook "Stop doing this." is 3 words — should get strong hook bonus
    expect(audit.engagement.factors.hook.status).toBe('Strong');
    expect(audit.suggestions.some(s => s.includes('Short openers stop the scroll'))).toBe(true);
  });

  it('penalizes wall-of-text hooks (40+ words)', () => {
    const longHook = 'I am so excited and happy to announce that after five long years of relentless hard work and countless late nights of coding debugging testing iterating refactoring and collaborating with my amazing team we have finally launched our brand new revolutionary platform';
    const post = longHook + '\n\nCheck it out!';
    const audit = analyzePost(post);

    expect(audit.warnings.some(w => w.includes('wall of text'))).toBe(true);
  });

  it('detects engagement bait patterns and penalizes', () => {
    const baitPost = 'This changed my career.\n\nComment YES if you agree!\n\n#growth';
    const audit = analyzePost(baitPost);

    expect(audit.warnings.some(w => w.includes('Engagement bait'))).toBe(true);
    // Bait penalty is -15 but bonuses (short hook, question) partially offset it
    expect(audit.score).toBeLessThan(100);
  });

  it('flags emoji overuse for professional tone', () => {
    const emojiHeavy = '🚀🎯💡🔥✨🌟💪🎉🏆 Great day to share some wisdom! What do you think?';
    const audit = analyzePost(emojiHeavy);

    expect(audit.suggestions.some(s => s.includes('emojis'))).toBe(true);
  });

  it('rewards posts in the 1300-1900 character sweet spot', () => {
    // Create a post in the sweet spot with proper structure
    const sweetSpotPost = 'Here is why simplicity wins.\n\n' +
      'A'.repeat(700) + '\n\n' +
      'B'.repeat(700) + '\n\n' +
      'What do you think?';
    const audit = analyzePost(sweetSpotPost);

    expect(audit.suggestions.some(s => s.includes('engagement sweet spot'))).toBe(true);
  });

  it('penalizes posts with no closing question (CTA)', () => {
    const noCTAPost = 'This is a long post about productivity and growth in software engineering.\n\n' +
      'I learned a lot from building tools over the past decade.\n\n' +
      'The key takeaway is that simplicity always wins over complexity. Keep building.\n\n' +
      '#productivity #engineering #growth';
    const audit = analyzePost(noCTAPost);

    expect(audit.engagement.factors.conversation.status).toBe('Missing');
    expect(audit.suggestions.some(s => s.includes('closing question'))).toBe(true);
  });

  it('penalizes low white space ratio on longer posts', () => {
    // 8 lines with no blank lines = 0% white space
    const densePost = [
      'Line 1: Hook that grabs attention.',
      'Line 2: Context about the topic.',
      'Line 3: More details here.',
      'Line 4: Supporting point.',
      'Line 5: Another supporting point.',
      'Line 6: Evidence and data.',
      'Line 7: Transition sentence.',
      'Line 8: What do you think?'
    ].join('\n');
    const audit = analyzePost(densePost);

    expect(audit.suggestions.some(s => s.includes('white space') || s.includes('blank lines'))).toBe(true);
  });

  it('applies increased penalty for external links (-30 vs old -20)', () => {
    const linkPost = 'Check out this article: https://example.com/article and tell me what you think?';
    const audit = analyzePost(linkPost);

    // With -30 penalty + possible bonuses, score should be noticeably lower
    expect(audit.score).toBeLessThanOrEqual(80);
  });

  describe('360Brew MoE Model Compliance (arXiv:2501.16450)', () => {
    it('detects CFBR and "agree or disagree" shallow engagement bait', () => {
      const cfbrPost = 'Great insights here.\n\nCFBR!\n\n#tech';
      const audit = analyzePost(cfbrPost);
      expect(audit.warnings.some(w => w.includes('360Brew demotes shallow replies'))).toBe(true);

      const agreePost = 'AI is replacing developers tomorrow.\n\nAgree or disagree?';
      const auditAgree = analyzePost(agreePost);
      expect(auditAgree.warnings.some(w => w.includes('360Brew demotes shallow replies'))).toBe(true);
    });

    it('flags sparse body text (<150 chars) for lacking 360Brew matching tokens', () => {
      const sparsePost = 'Check out this new PDF guide! 👇';
      const audit = analyzePost(sparsePost);
      expect(audit.warnings.some(w => w.includes('Sparse text (<150 chars)'))).toBe(true);
      expect(audit.engagement.factors.tokenContext.status).toBe('Needs Depth');
    });

    it('penalizes hashtag noise dilution when tags exceed 15% of total words', () => {
      // 10 words total, 4 hashtags = 40% dilution
      const dilutedPost = 'Here is a project update today for my team.\n\n#tech #coding #ai #python';
      const audit = analyzePost(dilutedPost);
      expect(audit.warnings.some(w => w.includes('Hashtag noise dilution'))).toBe(true);
      expect(audit.engagement.factors.hashtags.label).toContain('dilution');
    });

    it('flags clickbait hook with mismatched shallow body', () => {
      const clickbaitPost = 'The INSANE secret that 99% of engineers do not know.\n\nSimplicity wins.\n\nWhat do you think?';
      const audit = analyzePost(clickbaitPost);
      expect(audit.warnings.some(w => w.includes('Clickbait hook mismatch'))).toBe(true);
      expect(audit.engagement.factors.tokenContext.status).toBe('Needs Depth');
    });
  });

  describe('Bullet Toggle & Auto-Renumbering Engine', () => {
    it('toggles bullets on and off on double click', () => {
      const plain = 'First line\nSecond line';
      const bulleted = toggleBullets(plain, 'bullet');
      expect(bulleted).toBe('• First line\n• Second line');

      // Clicked second time -> reverts back to plain text!
      const toggledOff = toggleBullets(bulleted, 'bullet');
      expect(toggledOff).toBe('First line\nSecond line');
    });

    it('toggles check marks and numbers on and off', () => {
      const items = 'Task 1\nTask 2';
      const checked = toggleBullets(items, 'check');
      expect(checked).toBe('✔ Task 1\n✔ Task 2');
      expect(toggleBullets(checked, 'check')).toBe('Task 1\nTask 2');

      const numbered = toggleBullets(items, 'number');
      expect(numbered).toBe('1. Task 1\n2. Task 2');
      expect(toggleBullets(numbered, 'number')).toBe('Task 1\nTask 2');
    });

    it('cleans up stacked repeated prefixes like 🔟🔟🔟 or 1️⃣ 1.', () => {
      expect(stripListPrefix('🔟🔟🔟 4. Career Moves')).toBe('Career Moves');
      expect(stripListPrefix('1️⃣ 1. Skills vs. Communication')).toBe('Skills vs. Communication');
      expect(stripListPrefix('• 1. Item')).toBe('Item');
      expect(stripListPrefix('✔ Check this')).toBe('Check this');
    });

    it('preserves blank lines and does not bullet empty lines', () => {
      const withBlanks = 'First item\n\nSecond item';
      const result = toggleBullets(withBlanks, 'bullet');
      expect(result).toBe('• First item\n\n• Second item');
    });

    it('auto-adjusts and renumbers lists when an item is deleted (1, 2, 4 -> 1, 2, 3)', () => {
      const listWithGap = [
        '1. Skills vs. Communication',
        'Technical skills only get you so far.',
        '',
        '2. Visibility',
        'Document your work.',
        '',
        '4. Career Moves',
        'Switching jobs every 2 years is fine.',
        '',
        '5. Depth over Side Projects',
        'Solve hard problems.'
      ].join('\n');

      const renumbered = renumberNumberedList(listWithGap);
      expect(renumbered).toContain('1. Skills vs. Communication');
      expect(renumbered).toContain('2. Visibility');
      expect(renumbered).toContain('3. Career Moves'); // Adjusted from 4!
      expect(renumbered).toContain('4. Depth over Side Projects'); // Adjusted from 5!
    });

    it('auto-renumbers bold and keycap numbered lists', () => {
      const boldWithGap = '𝟭. First\n𝟮. Second\n𝟰. Fourth';
      expect(renumberNumberedList(boldWithGap)).toBe('𝟭. First\n𝟮. Second\n𝟯. Fourth');

      const keycapsWithGap = '1️⃣ First\n2️⃣ Second\n4️⃣ Fourth';
      expect(renumberNumberedList(keycapsWithGap)).toBe('1️⃣ First\n2️⃣ Second\n3️⃣ Fourth');
    });
  });
});
