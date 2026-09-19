<div align="center">

# 🚀 BoldLock
### The LinkedIn Post Formatter, SEO Health Linter & Feed Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Tests: Passing](https://img.shields.io/badge/Tests-100%25%20Passing-emerald?style=for-the-badge)](tests/)
[![Architecture: Zero--Dependency Core](https://img.shields.io/badge/Core-Zero--Dependency-purple?style=for-the-badge)](src/core/)
[![Chrome Extension: Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-amber?style=for-the-badge)](src/extension/)

**A modern, production-grade open-source alternative to commercial tools like AuthoredUp ($20/mo).**  
Format bold, italic, and bulleted LinkedIn posts, protect your SEO search ranking, preserve mobile line spacing, and simulate your exact feed appearance before publishing.

[Features](#-key-features) • [Quickstart](#-quickstart) • [Architecture](#-architecture) • [Core Engine API](#-core-engine-api) • [Contributing](#-contributing)

</div>

---

## ⚡ Why BoldLock?

LinkedIn's native post editor does **not** allow you to format text:
1. **No Bold or Italic Buttons**: You cannot italicize a key phrase or bold an opening hook directly inside LinkedIn.
2. **Markdown Fails**: Writing `**bold**` or `*italic*` on LinkedIn displays as raw asterisks (`**like this**`).
3. **Over-Converting Hurts Reach**: Random Unicode font generators turn entire sentences into weird symbols that screen readers cannot read and LinkedIn search algorithms cannot index.
4. **Collapsed Line Breaks**: LinkedIn's mobile app routinely collapses consecutive blank lines, crushing paragraph structure into walls of text.

**BoldLock gives you the font controls LinkedIn forgot to build.**  
Highlight any word or line to toggle bold, italic, monospace code, underline, strikethrough, and bullet styles — with a live desktop and mobile feed preview so you know exactly how it looks before hitting Publish.

---

## 💎 Comparison: BoldLock vs. Alternatives

| Feature | BoldLock | AuthoredUp ($20/mo) | Free Web Converters (e.g. LingoJam) |
| :--- | :---: | :---: | :---: |
| **Cost** | **100% Free & Open** | \$19.95 / month | Free (Ad-supported) |
| **Font Styles (Bold, Italic, Code, Underline)** | ✅ (Click to toggle on/off) | ✅ | ⚠️ (One-way only) |
| **LinkedIn Live Feed Mockup (Desktop + Mobile)** | ✅ | ✅ | ❌ |
| **Creator Emojis Bar (1-Click Insertion)** | ✅ | ❌ | ❌ |
| **LinkedIn URL Profile Auto-Fill** | ✅ | ❌ | ❌ |
| **Mobile Cutoff Fold Calculator (~210 chars)** | ✅ | ✅ | ❌ |
| **SEO & Accessibility Health Linter** | ✅ | ❌ | ❌ |
| **Hashtag & Mention Protection** | ✅ | ❌ | ❌ |
| **Mobile Blank Line Preservation (`\u200B`)** | ✅ | ✅ | ❌ |
| **Data Privacy** | **100% Local / Client-Side** | Cloud-synced | Unknown / Trackers |

---

## 🎯 Key Features

### 1. Instant Font Styling (Toggle On / Off)
- **Bold (`𝗕 Bold` / `𝐁 Serif`)**: Stand out in the feed with bold pattern interrupts. Click again to unbold.
- **Italic (`𝘐 Italic`)**: Emphasize key takeaways, quotes, or thoughts.
- **Monospace (`𝙲 Code`)**: Highlight tech terms, metrics, commands, or code snippets.
- **Underline (`U̲`) & Strikethrough (`S̶`)**: Cross out outdated ideas or underline critical points.
- **Bullet & Number Styles**: Convert regular lists into clean bullet points (`•`), direction arrows (`➔`), checklists (`✔`), or keycap emojis (`1️⃣`).
- **Creator Emojis Bar**: 1-click popular hooks emojis (`🚀`, `💡`, `🔥`, `📌`, `👇`, `✅`) plus an expandable tray of 48 categorized LinkedIn emojis.
- **Clear Style (`Aa Plain`)**: Revert any styled word or whole post back to clean standard text.

### 2. Algorithm, SEO & Readability Health Meter
- **"See More" Cutoff Engine**: Calculates the exact mobile hook cutoff (~210 characters / first 3 lines) and desktop cutoff (~300 characters / first 5 lines).
- **Unicode Density Guard**: Warns creators if >25% of post characters are styled Unicode (protecting post distribution from LinkedIn spam filters and preserving screen-reader accessibility).
- **Hashtag & Mention Guard**: Ensures `#hashtags` and `@mentions` remain plain ASCII so LinkedIn's recommendation algorithms index your post topics properly.
- **Limit & Reading Time Tracking**: Real-time counter against LinkedIn's 3,000-character ceiling with reading time estimation.

### 3. Spacing Preserver (No More Collapsed Paragraphs)
- Injects safe, invisible non-breaking spaces (`\u200B`) into empty lines upon copy, ensuring LinkedIn mobile never collapses paragraphs into a wall of text.

### 4. Pixel-Perfect Feed Simulator
- Real-time preview card mirroring official LinkedIn typography (`-apple-system, BlinkMacSystemFont`), avatar, author headline, timestamp, and "+ Follow" button.
- **Desktop Feed View** vs. **Mobile App View** toggle.
- **Realistic Clickable "...see more" interaction**: Test how your hook reads before and after the fold.
- Customizable author name, headline, and profile image.

---

## 🏗️ Architecture

```text
linkedin-post-styler/
├── README.md               # Visual documentation, badges & quickstart
├── CONTRIBUTING.md         # Open-source contribution guidelines
├── LICENSE                 # MIT License
├── package.json            # Scripts: dev, build, preview, test
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration with LinkedIn palette
├── postcss.config.js       # PostCSS autoprefixer & tailwind
├── scripts/
│   └── generate-icons.js   # Script generating Chrome Extension PNG icons
├── src/
│   ├── core/               # Standalone, 100% zero-dependency engine
│   │   ├── unicode-map.js  # Sans Bold, Serif Bold, Italic, Code, Underline, Strike, Bullets, Unformat
│   │   ├── parser.js       # HTML paste sanitizer & Markdown converter
│   │   ├── spacer.js       # Mobile blank-line preservation (\u200B)
│   │   ├── linter.js       # Algorithm & SEO Health linter
│   │   └── index.js        # Unified core export
│   ├── web/                # High-utility Web Studio Application
│   │   ├── index.html      # Responsive split-screen UI (Editor + Feed Mockup)
│   │   ├── style.css       # Tailwind styles & custom LinkedIn feed typography
│   │   └── app.js          # Reactive state, smart paste, local storage autosave
│   └── extension/          # Manifest V3 Chrome Extension
│       ├── manifest.json   # MV3 specification
│       ├── popup.html      # Fast popup UI
│       ├── popup.js        # Popup script importing core engine
│       └── icons/          # Extension PNG icons (16px, 48px, 128px)
└── tests/
    └── core.test.js        # 20+ Vitest unit tests verifying 100% conversion accuracy
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js 18+ (tested on Node v20/v22)
- npm or pnpm / yarn

### 1. Run the Web Studio Locally
```bash
# Clone the repository
git clone https://github.com/your-username/linkedin-post-styler.git
cd linkedin-post-styler

# Install dependencies
npm install

# Start the Vite development studio
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 2. Run the Automated Test Suite
```bash
npm test
```
Executes all unit tests with Vitest, verifying 100% conversion accuracy, bidirectional unformatting, spacing preservation, and linter audits.

### 3. Build for Production
```bash
npm run build
```
Creates an optimized, tree-shaken static bundle in `dist/`.

---

## 🧩 Chrome Extension (Manifest V3) Setup

You can load PostCraft directly into Google Chrome, Brave, Arc, or Microsoft Edge:

1. Open your browser and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `src/extension` directory inside this repository.
5. Click the PostCraft extension icon in your toolbar to format posts anywhere on the web!

---

## 📦 Core Engine API

The `src/core/` engine is completely modular and has **zero third-party dependencies**. You can import it directly into your own applications, CLI tools, bots, or backend workers:

```javascript
import {
  applyStyle,
  toPlainAscii,
  parseMarkdown,
  parseHtml,
  preserveLineBreaks,
  analyzePost
} from './src/core/index.js';

// 1. Apply formatting
const boldText = applyStyle('Hello World', 'sansBold');
// Output: "𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱"

// 2. Hashtags & Mentions are automatically protected
const tagged = applyStyle('Great news for #startups and @alex!', 'sansBold');
// Output: "𝗚𝗿𝗲𝗮𝘁 𝗻𝗲𝘄𝘀 𝗳𝗼𝗿 #startups 𝗮𝗻𝗱 @alex!"

// 3. Convert Markdown
const post = parseMarkdown('**Big launch!** We grew *200%*.\n- Feature 1\n- Feature 2');
// Output: "𝗕𝗶𝗴 𝗹𝗮𝘂𝗻𝗰𝗵! We grew 200%.\n• Feature 1\n• Feature 2"

// 4. Reverse to plain ASCII
const plain = toPlainAscii(boldText);
// Output: "Hello World"

// 5. Preserve line breaks for LinkedIn mobile
const safePost = preserveLineBreaks("Paragraph 1\n\nParagraph 2");

// 6. Run SEO & Algorithm Health Audit
const audit = analyzePost(post);
console.log(audit.seo.unicodeDensity); // e.g. 12%
console.log(audit.cutoff.mobile.isCutoff); // true/false
console.log(audit.metrics.charCount); // 85
```

---

## 🛣️ Roadmap

- [x] Zero-dependency core engine (Sans Bold, Serif Bold, Italic, Code, Underline, Strike, Bullets)
- [x] Bidirectional plain ASCII reverse unformatter (Toggle style on/off)
- [x] Rich text and Markdown auto-converter
- [x] Algorithm & SEO health linter with Unicode density warnings
- [x] Mobile (~210 char) & Desktop (~300 char) "...see more" cutoff calculator
- [x] Spacing preserver injecting safe `\u200B` characters
- [x] Pixel-perfect LinkedIn feed preview with desktop & mobile toggle
- [x] Interactive clickable "...see more" fold simulator
- [x] Manifest V3 Chrome Extension
- [x] 100% passing Vitest test suite
- [ ] Carousel / PDF preview simulator
- [ ] Multiple draft tabs & history management

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are warmly welcome!  
Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.
