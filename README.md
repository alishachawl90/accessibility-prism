# Accessibility Prism

**Current version: v2.1.0** | [Changelog](#changelog)

A comprehensive, all-in-one accessibility testing Chrome extension that goes far beyond automated scanning. Accessibility Prism combines axe-core engine analysis with manual testing tools, visual overlays, and plain-English scored reports — giving developers, QA engineers, and accessibility specialists everything they need in a single panel.

## The Problem

Web accessibility testing is fragmented. Teams juggle multiple tools — automated scanners that catch only 30-40% of issues, separate keyboard testers, manual screen reader checks, ARIA validators — each with different UIs, different output formats, and no unified view. Issues fall through the cracks, and non-technical stakeholders struggle to understand raw audit data.

**Accessibility Prism solves this** by consolidating 15+ accessibility checks into one extension with scored reports anyone can understand.

## Features

### Accessibility Scorecard
Run every analysis engine at once and get an A–F scored report across five categories: Content & Naming, Structure & Navigation, Keyboard & Interaction, ARIA & Semantics, and Visual Clarity. Export standalone HTML reports for stakeholders.

### Automated Scanning
- **Full Page Scan** — axe-core analysis with violations, needs-review, best-practice, and 10 custom Prism rules (text spacing, focus indicators, scrollable keyboard access, link distinguishability, and more)
- **Partial Page Scan** — pick any element to scope the scan to just that section
- **Component Scoping** — every audit result view has a scope bar at the top: type a CSS selector or use the element picker to re-run any analysis against a specific component or section instead of the full page. Clear scope to return to full-page results
- Multi-select result-type filters (Violation / Needs Review / Best Practice / Experimental), severity filters, WCAG level filter, and text search across all results
- Group results by Rule, Page Region, or UI Component

### Structure & Semantics
- **Heading Structure** — hierarchy analysis with skip-level detection and visual H1–H6 markers drawn on the page
- **Landmark Overview** — ARIA landmark mapping with dashed-border overlays and role labels
- **Alt Text Audit** — flags missing, suspicious ("image of…"), or excessively long alternative text

### Visual
- **Color Contrast** — text contrast ratio checking against WCAG AA/AAA thresholds, with per-issue WCAG fix guidance
- **Touch Target Size** — measures interactive elements against WCAG 2.5.5 and 2.5.8

### Keyboard & Focus
- **Keyboard Analysis** — detects tab order issues, focus traps, and inaccessible interactives; results grouped by type, region, or component with collapsible accordions and WCAG knowledge blocks
- **Manual Keyboard Test** — record your own tab trail with numbered overlay arrows drawn on the page
- **Component Keyboard Flow** — inspect tab flow within individual UI components; shows tab stops and any inline issues per stop
- **Focus Management** — validates dialog/modal focus trapping and return-focus behavior

### Screen Reader Simulation
- **Accessible Name Inspector** — computed name, role, and state for every significant element; grouped by status (Error / Warning / Pass)
- **ARIA Validation** — broken references, invalid roles, forbidden patterns, missing required props; per-issue WCAG fix guidance
- **Form Labels Audit** — unlabeled controls, placeholder-only inputs, missing fieldset legends; per-issue WCAG fix guidance
- **Announcement Walk-Through** — step through elements hearing what a screen reader would announce. Uses the W3C Accessible Name and Description Computation spec (via `dom-accessibility-api`) — the same algorithm browsers use to derive their accessibility tree from the DOM. Includes prose elements (`<p>`, `<li>`), `aria-describedby` descriptions, and accurate computed names/roles/states
- **Reading Order** — numbered DOM-order markers drawn directly on the page

### Monitoring
- **Live Region Monitor** — detects `aria-live` regions and `role="alert"` elements with severity breakdown, assertive/polite classification, and collapsible grouped issues

### WCAG Knowledge Blocks
Every expanded issue card across Keyboard, Form Labels, ARIA Validation, and Color Contrast views shows an inline knowledge block with:
- The specific WCAG success criterion and level
- A plain-English statement of the user impact
- A concrete fix suggestion
- A "Learn more" link to the authoritative spec

### Visual Overlays
Every analysis draws contextual markers directly on the page — heading badges, landmark borders, tab order numbers with connecting arrows, reading order markers, and issue highlights with instant scroll-to-element navigation.

### Reports & Export
- Standalone HTML accessibility reports (full page scan)
- Scorecard HTML reports with category breakdowns and narrative summaries
- Designed for sharing with non-technical stakeholders

### UX Details
- **Loading spinner** — displayed for audits that take time (axe full scan, keyboard analysis, scorecard) so the panel never appears frozen
- **Scroll restore** — navigating back to a results list restores the previous scroll position
- Parallel test execution with retry for flaky network conditions

## Installation

### From the Edge Add-ons Store
Search for **Accessibility Prism** in the [Microsoft Edge Add-ons store](https://microsoftedge.microsoft.com/addons/) and click **Get**.

### Load from Source (Developer)

```bash
git clone https://github.com/user/accessibility-prism.git
cd accessibility-prism
npm install
npm run build
```

Then in Edge/Chrome:
1. Open `edge://extensions/` (or `chrome://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

## Usage

1. Click the **Accessibility Prism** icon in the browser toolbar
2. Click **Activate on this page** to inject the analyzer panel
3. Select any analysis — Scorecard, Full Page Scan, Heading Structure, SR Walk-Through, etc.
4. Results appear in the floating panel with visual overlays on the page
5. Click any issue card to expand it: see the HTML snippet, CSS selector, WCAG criterion, fix guidance, and a Highlight button
6. Export HTML reports from the panel header download button

## Architecture

```
src/
├── core/              # Analysis engines
│   ├── axe-runner.ts      # Runs axe-core + registers Prism rules
│   ├── acc-name-analysis.ts  # W3C AccName spec + SR walk-through analysis
│   ├── keyboard-analysis.ts, focus-management.ts, ...
│   ├── scorecard.ts       # Aggregated A–F scoring engine
│   └── custom-rules/      # 10 custom Prism rules extending axe-core
│       # (text-spacing, target-spacing, focus-obscured, link-distinguishable,
│       #  scrollable-keyboard, focus-indicator, presentational-children,
│       #  text-clipping, aria-nesting, contrast-layered)
├── ui/
│   ├── panel.ts           # Main floating panel — state, routing, render cycle
│   ├── overlay.ts         # SVG overlay (highlights, heading/landmark markers, tab arrows)
│   ├── views/             # One renderer per view + shared results-template.ts
│   ├── tokens.ts          # Design tokens (severity colours, WCAG level colours, etc.)
│   ├── panel-styles.ts    # All CSS scoped to #a11y-analyzer-panel with !important
│   └── icons.ts           # SVG icon constants
├── utils/
│   ├── issue-knowledge.ts # Centralised WCAG criterion / impact / fix / link database
│   ├── fix-suggestions.ts # Element-specific code fix generators
│   └── html-report.ts, scorecard-report.ts, wcag-map.ts, escape.ts
└── main.ts            # Entry point — A11yAnalyzer class
```

### Key Design Decisions

- **On-demand injection** — The extension only injects when activated via popup or floating button, using Manifest V3 `chrome.scripting.executeScript`
- **Zero remote code** — Everything is bundled locally (axe-core included), fully Chrome/Edge Web Store compliant
- **Host CSS isolation** — Every panel style uses `!important` scoped under `#a11y-analyzer-panel` (specificity 1,1,0+) and all programmatic style assignments use `element.style.setProperty(prop, value, 'important')`, so host-page `!important` rules — even ID-based ones — cannot alter the panel's layout, fonts, or colours across any browser or OS
- **W3C AccName spec for SR simulation** — The Announcement Walk-Through computes accessible names, descriptions, roles, and states using the W3C Accessible Name and Description Computation spec (via `dom-accessibility-api`). This is the same algorithm browsers use to build their accessibility tree from the DOM, so announcements reflect what assistive technology would actually expose. (Earlier exploration of `chrome.automation` confirmed it is a restricted API limited to whitelisted Google extensions like ChromeVox, so the DOM-based spec implementation is the production path.)
- **Centralised WCAG knowledge** — `utils/issue-knowledge.ts` is the single source of truth for all per-issue-type WCAG criteria, user impact statements, fix suggestions, and learn-more links used across all views
- **Instant navigation** — Clicking any issue scrolls instantly to the element and draws the highlight after the scroll completes for accurate positioning

## Tech Stack

- **TypeScript** + **Vite** for fast builds
- **axe-core** for automated WCAG testing
- **dom-accessibility-api** for W3C AccName spec-compliant accessible name and description computation (powers the SR Walk-Through)
- **Chrome Extension Manifest V3**
- **Playwright** for automated UI testing (144 tests across 12 spec files, including 17 visual regression snapshots)
- No UI frameworks — vanilla TypeScript for minimal bundle size (~850 KB including axe-core)

## Permissions

- `activeTab` — Access the current tab when the user activates the extension
- `scripting` — Inject the analyzer content script on demand

No background scripts. No data collection. All analysis runs locally in the browser tab. No external requests.

## Changelog

### v2.1.0
- **Screen Reader Walk-Through — W3C AccName spec rewrite** — Now uses the W3C Accessible Name and Description Computation spec (via `dom-accessibility-api`) instead of bespoke heuristics. Fixes a long-standing bug where card descriptions (`aria-describedby`), prose elements (`<p>`, `<li>`, etc.), and correct role/name pairs were missing from the walkthrough. The spec implementation is the same algorithm browsers use to build their accessibility tree
- **Screen Reader Walk-Through — accessibility tree fidelity** — The walkthrough now mirrors what real screen readers (JAWS, NVDA, VoiceOver, ChromeVox) actually traverse. Elements inside `display:none`, `visibility:hidden`, `hidden`, or `inert` ancestors are pruned via the native `Element.checkVisibility()` API (with an ancestor-walking fallback for older browsers). `aria-hidden="true"` subtrees are also pruned. Visually-hidden / sr-only patterns (`opacity:0`, off-screen positioning) are preserved because real screen readers do announce them. Eliminates noise from Storybook chrome, hidden modals, error boundaries, and inactive tab panels
- **WCAG Knowledge blocks** — Added inline knowledge blocks to expanded issue cards across Keyboard Analysis, Form Labels, ARIA Validation, and Color Contrast views. Each block shows the WCAG success criterion, plain-English user impact, fix guidance, and a learn-more link
- **CSS isolation hardening** — Deep audit of every styled surface. All class rules prefixed with `#a11y-analyzer-panel` for specificity (1,1,0+); all JS style assignments converted to `setProperty(..., 'important')`. Covers the activation button, overlay SVG, accordion toggles, all view inline styles, and the panel-styles.ts utility classes. Eliminates layout breakage on host pages with aggressive CSS
- **Cross-platform font consistency** — Explicit system UI font stack (`-apple-system, Segoe UI, Roboto, Ubuntu, Arial, sans-serif !important`) applied to the panel and all form controls, preventing host-page serif fallbacks from appearing on Windows/Linux
- **Loading spinner** — Added visual loading state for slow audits (axe full-page scan, keyboard analysis, scorecard) so the panel never appears frozen
- Added `dom-accessibility-api` dependency for W3C AccName spec compliance
- **Component scoping for all audits** — every result view now has a scope bar (CSS selector input + element picker) that re-runs the current analysis against a specific component or section. All 15+ analysis engines accept an optional root element, enabling targeted component-level testing without full-page noise
- **Visual regression testing** — expanded from 4 to 17 Playwright visual snapshots covering every view in the extension (pre-screen, axe results, scorecard, headings, landmarks, contrast, alt text, form labels, accessible names, ARIA validation, keyboard, focus management, touch targets, live regions, SR walkthrough, reading order, component flow)
- 144 Playwright tests covering all features, including SR walk-through fidelity, aria-hidden / display:none pruning, scoped audit re-run, and 17 visual regression baselines

### v2.0.0
- Initial release with 15+ accessibility checks, Accessibility Scorecard (A–F grading), axe-core integration, 10 custom Prism rules, all audit views, visual overlays, and HTML report export

## Credits

Built by **Madhur Batra**

Powered by [axe-core](https://github.com/dequelabs/axe-core) by Deque Systems and [dom-accessibility-api](https://github.com/eps1lon/dom-accessibility-api)

## License

MIT
