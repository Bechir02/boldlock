# Contributing to ScrollStop

Thank you for your interest in contributing to **ScrollStop**! ScrollStop is an open-source, community-driven tool designed to give creators premium LinkedIn post formatting, feed simulation, and 360Brew algorithm auditing without expensive paywalls or subscription fees.

---

## 🏛️ Architecture Overview

ScrollStop is organized into three clean layers:

```text
src/
├── core/               # Zero-dependency engine (platform agnostic)
│   ├── unicode-map.js  # Bidirectional mathematical Unicode, bullet toggles & auto-renumbering
│   ├── parser.js       # Markdown & rich HTML paste engine
│   ├── spacer.js       # Mobile blank-line preservation (\u200B injection)
│   ├── linter.js       # 360Brew algorithm rules, cutoff calculator & health metrics
│   ├── organizer.js    # Rule-based auto-format & Gemini 360Brew AI formulation
│   └── index.js        # Core module exports
├── web/                # High-utility studio web application (Vite + Tailwind)
└── extension/          # Manifest V3 Chrome Extension
```

> ⚠️ **Core Principle**: `src/core/` MUST remain **100% zero-dependency**. It must run seamlessly in Node.js, browsers, web workers, service workers, and Edge runtimes.

---

## 💻 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/zribibecher/boldlock.git
   cd boldlock
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development studio**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run the test suite**:
   ```bash
   npm test
   ```
   Always ensure all tests pass before opening a Pull Request.

---

## 🛠️ Common Contribution Guides

### 1. Adding a New Unicode Style
1. Open [`src/core/unicode-map.js`](src/core/unicode-map.js).
2. Add code point offset rules to `UNICODE_RANGES`.
3. Add any unique character exceptions to `UNICODE_RANGES[style].exceptions`.
4. Add unit test assertions in [`tests/core.test.js`](tests/core.test.js) verifying:
   - Forward conversion (`applyStyle`).
   - Bidirectional reverse conversion (`toPlainAscii`).
5. Add the corresponding button in [`src/web/index.html`](src/web/index.html) and [`src/extension/popup.html`](src/extension/popup.html).

### 2. Updating 360Brew Algorithm Rules
1. Reference verified research and upstream LinkedIn engineering papers (e.g. `arXiv:2501.16450`).
2. Add rule checks inside `analyzePost()` in [`src/core/linter.js`](src/core/linter.js).
3. Update the factor badges in the studio's Algorithm Coach modal in [`src/web/index.html`](src/web/index.html).
4. Add comprehensive test coverage in [`tests/core.test.js`](tests/core.test.js).

### 3. Enhancing the Web Studio or Chrome Extension
- Web UI uses **Tailwind CSS**. Modify styles in `src/web/style.css` or class utilities in `src/web/index.html`.
- Extension code lives in `src/extension/`. Test locally by loading `src/extension` as an unpacked extension in `chrome://extensions`.

---

## 📋 Pull Request Guidelines

1. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Keep commits focused and semantic**:
   - `feat:` new feature or capability
   - `fix:` bug fix or correction
   - `docs:` documentation updates
   - `test:` test additions or improvements
   - `refactor:` code reorganization without functional changes
3. **Verify tests and build**:
   ```bash
   npm test
   npm run build
   ```
4. **Submit your Pull Request** with a concise description of what changed and test results.
