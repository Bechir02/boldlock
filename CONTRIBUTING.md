# Contributing to PostCraft

Thank you for your interest in contributing to **PostCraft**! PostCraft is an open-source, community-driven tool designed to give creators premium LinkedIn post formatting, feed simulation, and SEO auditing without expensive subscription walls.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all issues, pull requests, and discussions.

---

## Architecture Overview

PostCraft is organized into three clean layers:

```text
src/
├── core/               # Zero-dependency engine (platform agnostic)
│   ├── unicode-map.js  # Bidirectional mathematical Unicode & bullet mappings
│   ├── parser.js       # Markdown & rich HTML paste engine
│   ├── spacer.js       # Mobile blank-line preservation (\u200B injection)
│   └── linter.js       # SEO density, cutoff calculator & health metrics
├── web/                # High-utility studio web application (Vite + Tailwind)
└── extension/          # Manifest V3 Chrome Extension
```

> **Design Principle**: `src/core/` must remain **100% zero-dependency**. It can be imported in Node, browsers, service workers, or edge runtimes without bundler polyfills.

---

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/linkedin-post-styler.git
   cd linkedin-post-styler
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

---

## How to Add a New Unicode Style

To contribute a new Unicode font style (e.g., Script, Double-Struck / Blackboard Bold, Gothic / Fraktur):

1. Open `src/core/unicode-map.js`.
2. Add the code point offsets to `UNICODE_RANGES`:
   ```javascript
   doubleStruck: {
     upper: 0x1D538 - 65,  // 𝔸-ℤ
     lower: 0x1D552 - 97,  // 𝕒-𝕫
     digit: 0x1D7D8 - 48   // 𝟘-𝟡
   }
   ```
3. Ensure any Unicode standard exceptions are noted (e.g. `C`, `H`, `N`, `P`, `Q`, `R`, `Z` in double-struck have specific code points in the BMP).
4. Add the style button to `src/web/index.html` and `src/extension/popup.html`.
5. Add unit test assertions in `tests/core.test.js` verifying:
   - Proper conversion
   - Bidirectional plain ASCII reverse conversion (`toPlainAscii`)
6. Run `npm test` to ensure all tests pass.

---

## Pull Request Checklist

Before submitting a pull request, please verify:

- [ ] All unit tests pass: `npm test`
- [ ] Production build succeeds without errors: `npm run build`
- [ ] No external dependencies were added to `src/core/`
- [ ] Commit messages are clear and follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat: add double-struck font style`, `fix: correct mobile cutoff calculation`).

---

## Reporting Issues & Requesting Features

Please use GitHub Issues to report bugs or request features:
- **Bug reports**: Include your browser version, sample input text, and expected vs. actual behavior.
- **Feature requests**: Describe the creator use case and why it benefits LinkedIn post distribution or readability.
