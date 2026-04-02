# Accessibility Prism

A comprehensive, all-in-one accessibility testing Chrome extension that goes far beyond automated scanning. Accessibility Prism combines axe-core engine analysis with manual testing tools, visual overlays, and plain-English scored reports — giving developers, QA engineers, and accessibility specialists everything they need in a single panel.

## The Problem

Web accessibility testing is fragmented. Teams juggle multiple tools — automated scanners that catch only 30-40% of issues, separate keyboard testers, manual screen reader checks, ARIA validators — each with different UIs, different output formats, and no unified view. Issues fall through the cracks, and non-technical stakeholders struggle to understand raw audit data.

**Accessibility Prism solves this** by consolidating 15+ accessibility checks into one extension with scored reports anyone can understand.

## Features

### Accessibility Scorecard
Run every analysis engine at once and get an A-F scored report across five categories: Content & Naming, Structure & Navigation, Keyboard & Interaction, ARIA & Semantics, and Visual Clarity. Export standalone HTML reports for stakeholders.

### Automated Scanning
- **Full Page Scan** — axe-core analysis with violations, needs-review, and best-practice results
- **Partial Page Scan** — pick any element to scope the scan to just that section
- Multi-select severity filters and search across all results

### Structure & Semantics
- **Heading Structure** — hierarchy analysis with skip-level detection and visual markers
- **Landmark Overview** — ARIA landmark mapping with dashed-border overlays
- **Alt Text Audit** — flags missing, suspicious, or excessively long alternative text

### Visual
- **Color Contrast** — text contrast ratio checking against WCAG AA/AAA thresholds
- **Touch Target Size** — measures interactive elements against WCAG 2.5.5 and 2.5.8

### Keyboard & Focus
- **Keyboard Analysis** — detects tab order issues, focus traps, and inaccessible interactives
- **Manual Keyboard Test** — record your own tab trail with numbered overlay arrows
- **Component Keyboard Flow** — inspect tab flow within individual UI components
- **Focus Management** — validates dialog/modal focus trapping and return-focus behavior

### Screen Reader Simulation
- **Accessible Name Inspector** — computed name, role, and state for every significant element
- **ARIA Validation** — broken references, invalid roles, forbidden patterns, missing required props
- **Form Labels Audit** — unlabeled controls, placeholder-only inputs, missing fieldset legends
- **Announcement Walk-Through** — step through elements hearing what a screen reader would announce
- **Reading Order** — numbered DOM-order markers drawn directly on the page

### Monitoring
- **Live Region Monitor** — detects `aria-live` regions and `role="alert"` elements with expandable details

### Visual Overlays
Every analysis draws contextual markers directly on the page — heading badges, landmark borders, tab order numbers with connecting arrows, reading order markers, and issue highlights with instant scroll-to-element navigation.

### Reports & Export
- Standalone HTML accessibility reports
- Scorecard HTML reports with category breakdowns and narrative summaries
- Designed for sharing with non-technical stakeholders

## Installation

### From Source

```bash
git clone https://github.com/user/accessibility-prism.git
cd accessibility-prism
npm install
npm run build
```

### Load in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Quick Test

```bash
npm run test:chrome
```

This builds and launches Chrome with the extension pre-loaded.

## Usage

1. Click the **Accessibility Prism** icon in the Chrome toolbar
2. Click **Activate on this page** to inject the analyzer
3. Select any analysis from the panel — Scorecard, Full Page Scan, Heading Structure, etc.
4. Results appear in the side panel with visual overlays on the page
5. Click any issue to highlight the element, view the HTML snippet, and see the CSS selector
6. Export HTML reports from the panel header

## Architecture

```
src/
├── core/            # Analysis engines (axe runner, keyboard, headings, ARIA, etc.)
├── ui/
│   ├── panel.ts     # Main floating panel controller
│   ├── overlay.ts   # SVG overlay drawing (highlights, markers, arrows)
│   ├── views/       # Individual view renderers (pre-screen, results, details)
│   ├── tokens.ts    # Design tokens (colors, palettes)
│   ├── panel-styles.ts  # CSS variables and utility classes
│   └── icons.ts     # SVG icon constants
├── utils/           # Report generators, WCAG mapping, HTML escaping
└── main.ts          # Entry point, A11yAnalyzer class
```

### Key Design Decisions

- **On-demand injection** — The extension only injects when activated via popup or floating button, using Manifest V3 `chrome.scripting.executeScript`
- **Zero remote code** — Everything is bundled locally (axe-core included), fully Chrome Web Store compliant
- **Host CSS isolation** — All panel styles use `!important` and CSS variables scoped to `#a11y-analyzer-panel` to prevent host page styles from leaking in
- **Instant navigation** — Clicking any issue scrolls instantly to the element and draws the highlight after the scroll completes for accurate positioning

## Tech Stack

- **TypeScript** + **Vite** for fast builds
- **axe-core** for automated WCAG testing
- **Chrome Extension Manifest V3**
- No frameworks — vanilla TypeScript for minimal bundle size (~800KB including axe-core)

## Permissions

- `activeTab` — Access the current tab when the user activates the extension
- `scripting` — Inject the analyzer content script on demand

No background scripts. No persistent permissions. No data collection.

## Credits

Built by **Madhur Batra**

Powered by [axe-core](https://github.com/dequelabs/axe-core) by Deque Systems

## License

MIT
