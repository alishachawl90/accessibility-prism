Ensuring Web Accessibility with Accessibility Prism: A Comprehensive Guide
===

*Alisha Chawla & Madhur Batra · Accessibility Prism v3.0.1*

## Introduction

In today's digital age, web accessibility is more important than ever. Ensuring that your website is accessible to everyone, including people with disabilities, is not just a legal requirement but also a moral obligation. To make this easier for developers, QA engineers, and accessibility specialists on our team, we built **Accessibility Prism** — an all-in-one Chrome/Edge extension that runs directly in the browser and consolidates 15+ accessibility checks into a single panel with plain-English, scored reports. This article walks through our approach, the key features of the extension, and how to use it day-to-day.

### Why Web Accessibility Matters

Web accessibility ensures that all users, regardless of their abilities, can navigate and interact with your website. It enhances user experience, broadens your audience, and helps you comply with legal standards such as the Americans with Disabilities Act (ADA), the European Accessibility Act (EAA), and the Web Content Accessibility Guidelines (WCAG).

## Our Approach to Automated Accessibility Testing

Web accessibility testing is fragmented. Teams juggle multiple tools — automated scanners that catch only 30–40% of issues, separate keyboard testers, manual screen reader checks, ARIA validators — each with different UIs, different output formats, and no unified view. Issues fall through the cracks, and non-technical stakeholders struggle to interpret raw audit data.

**Accessibility Prism solves this** by combining axe-core engine analysis with manual testing tools, visual page overlays, and scored reports — all inside a single detached popup window that opens with one click, no separate app or CI pipeline required.

## Key Features of the Extension

### Accessibility Scorecard
Run every analysis engine at once and get an A–F scored report across five categories: Content & Naming, Structure & Navigation, Keyboard & Interaction, ARIA & Semantics, and Visual Clarity. Export standalone HTML reports for stakeholders.

### Automated Scanning (axe-core)
- **Full Page Scan** — axe-core analysis across Violations, Needs Review, and Best Practice findings
- **Partial Page Scan** — pick any element to scope the scan to just that section
- **Component Scoping** — every result view has a scope bar: type a CSS selector or use the element picker to re-run any analysis against a specific component instead of the whole page
- Multi-select result-type filters (Violation / Needs Review / Best Practice), severity filters, WCAG level filter, and full-text search across all results
- Group results by Rule, Page Region, or UI Component

### Structure & Semantics
- **Heading Structure** — hierarchy analysis with skip-level detection and visual H1–H6 markers drawn on the page
- **Landmark Overview** — ARIA landmark mapping with dashed-border overlays and role labels
- **Alt Text Audit** — flags missing, suspicious ("image of…"), or excessively long alternative text

### Keyboard & Focus
- **Keyboard Analysis** — detects tab order issues, focus traps, and inaccessible interactives; grouped by type, region, or component with WCAG knowledge blocks
- **Manual Keyboard Test** — record your own tab trail with numbered overlay arrows drawn live on the page
- **Component Keyboard Flow** — inspect tab flow within a single UI component
- **Focus Management** — validates dialog/modal focus trapping and return-focus behavior

### Screen Reader Simulation
- **Accessible Name Inspector** — computed name, role, and state for every significant element, grouped by status (Error / Warning / Pass)
- **ARIA Validation** — broken references, invalid roles, forbidden patterns, missing required props
- **Form Labels Audit** — unlabeled controls, placeholder-only inputs, missing fieldset legends
- **Announcement Walk-Through** — step through elements hearing what a screen reader would announce, using the W3C Accessible Name and Description Computation spec (the same algorithm browsers use)
- **Reading Order** — numbered DOM-order markers drawn directly on the page

### Monitoring
- **Live Region Monitor** — detects `aria-live` regions and `role="alert"` elements with severity breakdown and assertive/polite classification

## How It Works

Rather than custom test commands (as you would in a Cypress + `cypress-axe` setup), Accessibility Prism exposes each of the above as a **one-click audit button** inside the popup panel — no test file to write, no CLI to run. Each audit is the equivalent of a "custom command":

| Audit | What it does | When to use it |
|---|---|---|
| **Full Page Scan** | Runs axe-core across the entire visible page | First pass on any page — catches the broadest range of WCAG issues |
| **Partial Scan (Scope)** | Runs axe-core against a single picked element/CSS selector | Narrowing down to one component after a full scan, or testing a component in isolation |
| **Heading Structure** | Validates H1–H6 hierarchy | Verifying document outline and skip-level errors |
| **Landmark Overview** | Maps ARIA landmarks (`header`, `nav`, `main`, etc.) | Checking page regions are correctly exposed to assistive tech |
| **Keyboard Analysis** | Automated tab-order + focus-trap detection | Regression-testing keyboard navigation without manually tabbing through |
| **Manual Keyboard Test** | Records your live tab trail with on-page arrows | Verifying keyboard behavior a static analyzer can't infer (visual focus order, custom widgets) |
| **Accessible Name Inspector** | Computes the accessible name/role/state per element | Debugging "screen reader announces the wrong thing" issues |
| **Announcement Walk-Through** | Step-by-step simulated screen reader narration | Sanity-checking the actual experience for a screen reader user |
| **ARIA Validation** | Flags invalid/broken ARIA usage | Catching ARIA misuse that axe-core's default ruleset may not cover |
| **Form Labels Audit** | Flags unlabeled or poorly labeled form controls | Form accessibility review before a form ships |
| **Live Region Monitor** | Flags `aria-live`/`role="alert"` regions | Checking dynamic content is announced correctly |
| **Scorecard** | Runs everything above and produces an A–F graded report | Stakeholder-facing summary / release sign-off |

## Setup

Accessibility Prism ships as a Chrome/Edge Manifest V3 extension built with TypeScript and Vite.

### Dependencies
- **axe-core** — automated WCAG rule engine
- **dom-accessibility-api** — W3C AccName spec-compliant accessible name/description computation, powering the SR Walk-Through
- **Playwright** — automated UI test suite for the extension itself (144 tests / 12 spec files)
- No UI frameworks — vanilla TypeScript, kept deliberately lightweight

### Installation

```bash
git clone https://github.com/<org>/accessibility-prism.git
cd accessibility-prism
npm install
npm run build
```

Then in Chrome/Edge:
1. Open `chrome://extensions/` (or `edge://extensions/`)
2. Enable **Developer mode**
3. Click **Load unpacked** → select the **`dist/`** folder (created by `npm run build`; contains `manifest.json`, `background.js`, `content.js`, `panel.js`, `panel.html`, and `icons/`)

## Usage

1. Click the **Accessibility Prism** icon in the browser toolbar — a detached popup window opens
2. Select any analysis — Scorecard, Full Page Scan, Heading Structure, SR Walk-Through, etc.
3. Results appear in the popup panel; visual overlays are drawn directly on the page behind it
4. Click any issue card to expand it: HTML snippet, CSS selector, WCAG criterion, fix guidance, and a **Highlight** button that scrolls straight to the element
5. Use the **Scope** bar at the top of any result view to narrow analysis to a CSS selector or a picked element; click **Clear** to return to full-page results
6. Export an HTML report from the panel header download button to share with non-technical stakeholders

## Execution

Unlike a CI-driven Cypress suite, Accessibility Prism is an interactive, on-demand tool — there's no `npx cypress open` / headless report step. Every audit runs live in the current tab the moment you click its button, and results render directly in the popup:

- **Full Page Scan** button → axe-core runs against the page → rule cards appear, grouped and filterable by Violation / Needs Review / Best Practice, WCAG level, and free-text search
- Clicking a rule card opens **Issue Details**: every occurrence, its selector, HTML snippet, and a **Highlight on page** button
- The extension's own correctness is verified by its Playwright suite (`npm test`), which drives the popup exactly as a user would, against a deliberately "bad accessibility" fixture page (`index.html`)

## WCAG Knowledge Blocks — Technical Details

Every expanded issue card across Keyboard, Form Labels, ARIA Validation, and Color Contrast views shows an inline **knowledge block** — the extension's equivalent of a custom accessibility logger. Here's what it captures, and where it's sourced from.

### How it's generated
`utils/issue-knowledge.ts` is the single centralized source of truth mapping each non-axe issue type to its WCAG criterion, user-impact statement, and fix suggestion. axe-core-sourced issues (Full Page Scan) instead carry this information natively via axe's own `tags`, `help`, `helpUrl`, and `failureSummary` fields.

### Where it's shown
- **In the panel** — inline, inside the expanded issue card, right where you're already looking at the flagged element
- **Via export** — the same information is included in the exported HTML report, so it travels with the ticket/handoff rather than staying trapped in a live browser session

### What it shows
For each issue:
- **WCAG success criterion and level** (A / AA / AAA)
- **Result type** — Violation, Needs Review, or Best Practice — so it's clear whether something is a conformance requirement or a recommended improvement
- **Impact** — critical / serious / moderate / minor
- **Plain-English user impact statement** — what actually breaks for a real user
- **Concrete fix suggestion**
- **"Learn more" link** to the authoritative spec/Deque University page

## References

- [axe-core](https://github.com/dequelabs/axe-core) — the underlying rule engine
- [dom-accessibility-api](https://github.com/eps1lon/dom-accessibility-api) — W3C AccName spec implementation
- [Deque University — Axe API Documentation](https://www.deque.com/axe/) — rule reference used for `helpUrl` links throughout the extension
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) — the standard underlying every knowledge block in the panel
