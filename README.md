<div align="center">

# 🛑 ScrollStop
### The LinkedIn Post Formatter, 360Brew Algorithm Health Studio & Live Feed Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Tests: 41 Passing](https://img.shields.io/badge/Tests-41%20Passing-emerald?style=for-the-badge)](tests/)
[![Core: Zero Dependencies](https://img.shields.io/badge/Core-Zero--Dependency-purple?style=for-the-badge)](src/core/)
[![Build: Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](vite.config.js)
[![Chrome Extension: Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-amber?style=for-the-badge)](src/extension/)

**Engineered to halt the scroll and maximize LinkedIn feed reach.**  
Format rich mathematical Unicode, auto-adjust numbered lists, optimize post layout against LinkedIn's 360Brew 150B MoE ranking model (`arXiv:2501.16450`), preserve mobile blank lines, and simulate the exact mobile "...see more" cutoff.

[Live Demo](https://zribibecher.github.io/scrollstop/) • [Key Features](#-key-features) • [Free Deployment](#-100-free-live-deployment) • [Quickstart](#-quickstart) • [Architecture](#-architecture) • [Core API](#-core-engine-api) • [Contributing](#-contributing)

</div>

---

## ⚡ The Problem ScrollStop Solves

Writing high-performing LinkedIn posts natively is broken:
1. **Zero Native Formatting**: LinkedIn's editor has no bold, italic, or monospace buttons. Markdown syntax (`**bold**`) renders as raw asterisks.
2. **Collapsed Mobile Blank Lines**: Mobile apps collapse consecutive line breaks (`\n\n`), squashing structured arguments into illegible walls of text.
3. **The 140-Character Mobile Fold**: If your opening hook isn't punchy and isolated within the first 140–210 characters, readers never click "...see more" and dwell time drops to zero.
4. **360Brew Algorithm Penalties**: LinkedIn's 150B MoE model (`arXiv:2501.16450`) explicitly demotes shallow engagement bait ("CFBR", "Agree or disagree?"), hashtag dumps ($>5$ tags), and external links placed directly in post bodies (-40% to -60% reach penalty).

**ScrollStop solves all of this in one unified, client-side studio.**

---

## 🎯 Key Features

### 1. Instant Font & List Formatting (Click to Toggle)
- **Bold (`𝗕 Bold` / `𝐁 Serif`)**: Distinct mathematical Unicode styles that pass accessibility filters. Click once to apply, click again to toggle off.
- **Italic (`𝘐 Italic`) & Monospace (`𝙲 Code`)**: Highlight key lessons, quotes, and technical syntax.
- **Underline (`U̲`) & Strikethrough (`S̶`)**: Emphasize principles or cross out outdated ideas.
- **Bullet Point Toggling**: Click `•`, `➔`, `✔`, or `★` to apply. Click again to revert clean text. Preserves empty lines without cluttering.
- **Auto-Renumbering Engine**: Deleting or moving any line in a numbered list (e.g. `1, 2, 4, 5`) automatically re-indexes remaining items to `1, 2, 3, 4`.
- **Anti-Stacking Prefix Sanitizer**: Completely prevents prefix duplication (e.g. cleans accidental `🔟🔟🔟` or `• 1.` combos).
- **Aa Plain**: Instantly strip all Unicode styling back to raw plain ASCII.

### 2. LinkedIn 360Brew Algorithm Health Linter (arXiv:2501.16450)
- **Real-Time Health Score (0–100%)**: Evaluates drafts against confirmed ranking signals from LinkedIn's 150-billion parameter MoE feed architecture.
- **Shallow Bait Detection**: Flags demoted keywords like "CFBR", "comment for reach", "agree or disagree", or "drop a like".
- **External Link Safety Guard**: Alerts when links are found in the body and suggests moving them to the first comment to avoid distribution throttling.
- **Mobile Cutoff Calculator**: Live visual indicator tracking characters before the critical "...see more" cutoff (~140–210 characters on mobile, 300 on desktop).
- **Hashtag Noise Filter**: Flags hashtag dumps ($>3\text{--}5$ tags or $>15\%$ of total words) that dilute topic classification.
- **Whitespace & Dwell Time Audit**: Enforces optimal 20%–35% whitespace ratios to prevent reader drop-off.

### 3. Auto-Format & AI Formulate
- **Auto-Format (Offline & Instant)**: Rule-based client-side organizer. Isolates your hook, splits dense text into 1–2 sentence mobile paragraphs, bolds section headers, formats bullet lists, and renumbers sequences without altering your authentic words.
- **AI Formulate (Gemini Powered)**: Formulates rough drafts using Gemini Flash with strict 360Brew prompt constraints (hook $\le 10\text{--}12$ words, exactly 3 relevant hashtags, and substantive closing questions that trigger multi-sentence discussions).

### 4. Zero-Width Mobile Spacing Preserver
- Automatically injects invisible zero-width spaces (`\u200B`) on empty lines when copying, ensuring paragraph breaks render properly on iOS and Android LinkedIn apps.

### 5. Live Feed Simulator
- Interactive mobile and desktop preview card mirroring LinkedIn's exact feed styling, author header, and collapsible "...see more" button.

---

## 🌐 100% Free Live Deployment

ScrollStop is built as an ultra-fast static Single Page App with relative asset paths (`base: './'`). You can host it for free in under two minutes:

### Option 1: GitHub Pages (Zero Config)
The repository includes an automated GitHub Actions deployment workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
1. Go to your repository on GitHub: **Settings** $\to$ **Pages**.
2. Under **Build and deployment** $\to$ **Source**, choose **GitHub Actions**.
3. Push to `main` (or click **Run workflow** under the **Actions** tab). Your live studio is immediately active at `https://<username>.github.io/<repo>/`!

### Option 2: Cloudflare Pages (Free & Instant CDN)
1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/) $\to$ **Workers & Pages** $\to$ **Create application** $\to$ **Pages**.
2. Connect your GitHub repository.
3. Configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Click **Save and Deploy**.

### Option 3: Vercel (Free)
1. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
2. Vercel automatically detects Vite:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Click **Deploy**.

---

## 🚀 Quickstart

### 1. Run the Studio Locally
```bash
# Clone the repository
git clone https://github.com/zribibecher/scrollstop.git
cd scrollstop

# Install dependencies
npm install

# Start local Vite development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 2. Run the Test Suite
```bash
npm test
```
Executes all **41 unit tests** with Vitest covering Unicode mapping, list toggles, auto-renumbering, paragraph spacing, and 360Brew compliance.

### 3. Build for Production
```bash
npm run build
```
Outputs the production-ready static assets to `dist/`.

---

## 🧩 Chrome Extension (Manifest V3)

Load ScrollStop directly into Chrome, Brave, Arc, or Edge:

1. Open `chrome://extensions` in your browser.
2. Toggle on **Developer mode** (top-right corner).
3. Click **Load unpacked**.
4. Select the `src/extension` folder inside this repository.
5. Click the ScrollStop icon in your browser toolbar to style posts anywhere!

---

## 🏗️ Architecture

```text
scrollstop/
├── src/
│   ├── core/               # Platform-agnostic zero-dependency engine
│   │   ├── unicode-map.js  # Unicode fonts, bullet toggling, auto-renumbering
│   │   ├── spacer.js       # Zero-width blank line preserver (\u200B)
│   │   ├── parser.js       # Markdown & HTML paste converter
│   │   ├── linter.js       # 360Brew ranking signals & health coach
│   │   ├── organizer.js    # Rule organizer & Gemini Flash 360Brew prompt
│   │   └── index.js        # Core module exports
│   ├── web/                # Web application
│   │   ├── index.html      # Responsive high-contrast studio layout
│   │   ├── style.css       # Tailwind CSS & LinkedIn feed typography
│   │   └── app.js          # Reactive UI state, clipboard pipeline & modal logic
│   └── extension/          # Manifest V3 Chrome Extension
│       ├── manifest.json   # MV3 specification
│       ├── popup.html      # Fast popup UI
│       └── popup.js        # Lightweight popup script importing core engine
├── tests/
│   └── core.test.js        # 41 Vitest unit tests (100% passing)
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions deployment to GitHub Pages
├── vite.config.js          # Vite build config with relative base ('./')
└── tailwind.config.js      # Tailwind design system configuration
```

> **Core Principle**: `src/core/` has **zero external dependencies**. It runs identically in Node.js, browsers, service workers, and Edge functions.

---

## 📦 Core Engine API

Import the modular core engine into any JavaScript or TypeScript project:

```javascript
import {
  applyStyle,
  toPlainAscii,
  toggleBullets,
  renumberNumberedList,
  preserveLineBreaks,
  analyzePost
} from './src/core/index.js';

// 1. Style text
const bold = applyStyle('Hello World', 'sansBold');
// => "𝗛𝗲𝗹𝗹𝗼 𝗪𝗼𝗿𝗹𝗱"

// 2. Toggle bullets on/off
const bulleted = toggleBullets("Item 1\nItem 2", "bullet");
// => "• Item 1\n• Item 2"
const plainAgain = toggleBullets(bulleted, "bullet");
// => "Item 1\nItem 2"

// 3. Auto-renumber broken lists
const fixed = renumberNumberedList("1. First\n4. Second\n7. Third");
// => "1. First\n2. Second\n3. Third"

// 4. Preserve mobile line breaks
const post = preserveLineBreaks("Hook line\n\nBody line");

// 5. Run 360Brew algorithm audit
const audit = analyzePost(post);
console.log(`Health Score: ${audit.score}%`);
console.log(`Cutoff Status: ${audit.cutoff.mobileStatus}`);
```

---

## 🤝 Contributing

Contributions are warmly welcome! Please review [`CONTRIBUTING.md`](CONTRIBUTING.md) for architecture guidelines, code standards, and PR workflows.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
