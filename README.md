<div align="center">

# 🚀 BoldLock
### The LinkedIn Post Formatter, 360Brew Health Linter & Live Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Tests: Passing](https://img.shields.io/badge/Tests-35%20Passing-emerald?style=for-the-badge)](tests/)
[![Core: Zero Dependencies](https://img.shields.io/badge/Core-Zero--Dependency-purple?style=for-the-badge)](src/core/)
[![Chrome Extension: Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-amber?style=for-the-badge)](src/extension/)

**A clean, high-utility LinkedIn post companion.**  
Format bold, italic, code, underline, and bulleted posts, verify against LinkedIn's 360Brew 150B MoE model (`arXiv:2501.16450`), preserve mobile paragraph linebreaks, and inspect your post before publishing.

[Live Web Studio](https://bechir02.github.io/boldlock/) • [Features](#-key-features) • [Quickstart](#-quickstart) • [Architecture](#-architecture) • [Core API](#-core-engine-api) • [License](#-license)

</div>

---

## ⚡ Why BoldLock?

LinkedIn's native editor lacks rich text formatting:
1. **No Bold or Italic Buttons:** You cannot emphasize key takeaways or style hooks directly on LinkedIn.
2. **Markdown Fails:** Raw `**bold**` or `*italic*` syntax renders as literal asterisks on LinkedIn.
3. **Over-Styling Suppresses Reach:** Blanket Unicode font converters output characters that break screen readers and dilute 360Brew semantic token classification.
4. **Collapsed Blank Lines:** Mobile clients routinely eat empty lines, turning clean drafts into walls of text.

**BoldLock solves this:** Select text to toggle bold, italic, code, underline, strikethrough, or bullets, with real-time algorithm health scoring and blank-line preservation.

---

## 🎯 Key Features

### 1. Instant Font Styling (Click to Toggle)
- **Bold (`𝗕 Bold` / `𝐁 Serif`)**: Stand out in the feed. Click once to apply, click again to remove.
- **Italic (`𝘐 Italic`)**: Emphasize quotes, lessons, or secondary points.
- **Monospace (`𝙲 Code`)**: Format technical terms, commands, and code snippets.
- **Underline (`U̲`) & Strike (`S̶`)**: Cross out legacy ideas or highlight key principles.
- **Lists & Bullets**: 1-click bullet points (`•`), arrows (`➔`), checks (`✔`), and numbers.
- **Emoji Bar**: Fast access to creator emojis plus an expandable tray of 48 categorized icons.
- **Aa Plain**: Instantly revert any styled text back to clean ASCII.

### 2. 360Brew Algorithm & Health Auditor (arXiv:2501.16450)
- **150B MoE Scoring (0–100%):** Evaluates posts against token-level ranking signals.
- **Shallow Bait Filter:** Flags demoted phrases like "CFBR", "comment for reach", "agree or disagree".
- **Sparse Text Guard:** Warns on posts $<150$ characters that provide insufficient semantic tokens for interest matching.
- **Hashtag Noise Filter:** Catches hashtag stacking ($>5$ tags or $>15\%$ of total words) that dilute topic classification.
- **Clickbait Mismatch:** Flags sensational hook words when the body lacks supporting depth.
- **Cutoff Fold Calculator:** Live indicator for the mobile "...see more" cutoff (~140–210 chars).
- **External Link Safety:** Warns against body links that suppress feed distribution by 40–60%.

### 3. Spacing Preserver
- Injects invisible zero-width spaces (`\u200B`) into empty lines on copy, guaranteeing mobile paragraph spacing never collapses.

### 4. Live Post Preview
- Clean, realistic preview card displaying how your post will render on LinkedIn, complete with the interactive "...see more" fold.

---

## 🏗️ Architecture

```text
linkedin-post-styler/
├── README.md               # Documentation & quickstart
├── package.json            # Scripts: dev, build, preview, test
├── vite.config.js          # Vite build config (GitHub Pages base: /boldlock/)
├── tailwind.config.js      # Tailwind design system
├── src/
│   ├── core/               # Shared zero-dependency engine
│   │   ├── unicode-map.js  # Unicode character mapping & bidirectional unformatting
│   │   ├── parser.js       # HTML paste sanitizer & Markdown converter
│   │   ├── spacer.js       # Zero-width blank line preserver (\u200B)
│   │   ├── linter.js       # 360Brew algorithm & health auditor
│   │   ├── organizer.js    # Local rule structurer & Gemini 3.6 Flash formulation
│   │   └── index.js        # Core module exports
│   ├── web/                # Web application
│   │   ├── index.html      # Responsive workspace layout
│   │   ├── style.css       # LinkedIn typography & custom scrollbars
│   │   └── app.js          # Reactive state, clipboard pipeline, health coach
│   └── extension/          # Manifest V3 Chrome Extension
│       ├── manifest.json   # MV3 specification
│       ├── popup.html      # Fast popup UI
│       ├── popup.js        # Popup script importing core engine
│       └── icons/          # Extension PNG icons (16px, 48px, 128px)
└── tests/
    └── core.test.js        # 35 Vitest unit tests (100% passing)
```

---

## 🚀 Quickstart

### 1. Run the Web App Locally
```bash
# Clone the repository
git clone https://github.com/Bechir02/boldlock.git
cd boldlock

# Install dependencies
npm install

# Start development server
npm run dev
```
Open **`http://localhost:3000/boldlock/`** in your browser.

### 2. Run the Test Suite
```bash
npm test
```
Runs all 35 unit tests with Vitest covering Unicode mapping, line spacing, Markdown conversion, and 360Brew compliance.

### 3. Build for Production
```bash
npm run build
```
Generates the optimized static distribution inside `dist/`.

---

## 🧩 Chrome Extension (Manifest V3)

Load BoldLock directly into Google Chrome, Brave, Arc, or Microsoft Edge:

1. Open `chrome://extensions` in your browser.
2. Enable **Developer mode** (toggle in top-right corner).
3. Click **Load unpacked**.
4. Select the `src/extension` directory inside this repository.
5. Click the BoldLock icon in your toolbar to style posts instantly from anywhere!

---

## 📦 Core Engine API

The `src/core/` engine is 100% modular and has **zero dependencies**. Import it into any project:

```javascript
import {
  applyStyle,
  toPlainAscii,
  parseMarkdown,
  preserveLineBreaks,
  analyzePost
} from './src/core/index.js';

// 1. Style text
const bold = applyStyle('Hello World', 'sansBold');
// Output: "𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱"

// 2. Unstyle back to plain ASCII
const plain = toPlainAscii(bold);
// Output: "Hello World"

// 3. Preserve mobile line breaks
const formatted = preserveLineBreaks("Paragraph 1\n\nParagraph 2");

// 4. Run 360Brew algorithm audit
const audit = analyzePost(formatted);
console.log(audit.score); // 0–100
console.log(audit.engagement.factors.tokenContext.status); // 'Optimal'
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
