Ensuring Web Accessibility with Accessibility Prism: A Comprehensive Guide
===

*Alisha Chawla & Madhur Batra · Accessibility Prism v3.0.1*

## Introduction

In today's digital age, web accessibility is more important than ever. Ensuring that your website is accessible to everyone, including people with disabilities, is not just a legal requirement but also a moral obligation. To make this easier for developers, QA engineers, and accessibility specialists, we built **Accessibility Prism** — an all-in-one Chrome extension that runs directly in the browser and consolidates 15 accessibility audits into a single panel. This article walks through our approach, the key features of the extension, and how to use it day-to-day.

### Why Web Accessibility Matters

Web accessibility ensures that all users, regardless of their abilities, can navigate and interact with your website. It enhances user experience, broadens your audience, and helps you comply with legal standards such as the Americans with Disabilities Act (ADA), the European Accessibility Act (EAA), and the Web Content Accessibility Guidelines (WCAG).

## Our Approach

Web accessibility testing is fragmented. Teams juggle multiple tools — automated scanners that catch only 30–40% of issues, separate keyboard testers, manual screen reader checks, ARIA validators — each with different UIs, different output formats, and no unified view. Issues fall through the cracks.

**Accessibility Prism addresses this** by combining axe-core engine analysis with manual testing tools and visual page overlays — all inside a single detached popup window that opens with one click, with no separate app, test file, or CI pipeline required.

Because it runs interactively in the browser rather than in CI, it complements automated pipeline testing rather than replacing it: use axe in CI to catch regressions, and Prism when you need to actually inspect, understand, and debug an issue on a live page.

## Key Features

Every audit below is a **one-click button** inside the popup panel — no test file to write, no CLI to run, no configuration.

### Automated Scanning (axe-core)
- **Full Page Scan** — axe-core analysis across Violations, Needs Review, and Best Practice findings
- **Partial Page Scan** — pick any element to scope the scan to just that section
- **Component Scoping** — every result view has a scope bar: type a CSS selector or use the element picker to re-run any analysis against a specific component instead of the whole page
- Multi-select result-type filters (Violation / Needs Review / Best Practice), impact filters, WCAG level filter, and full-text search across all results
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
- **Announcement Walk-Through** — step through elements hearing what a screen reader would announce, computed via the W3C Accessible Name and Description Computation spec
- **Reading Order** — numbered DOM-order markers drawn directly on the page

### Monitoring
- **Live Region Monitor** — detects `aria-live` regions and `role="alert"` elements with severity breakdown and assertive/polite classification

## Setup

Accessibility Prism ships as a Chrome Manifest V3 extension built with TypeScript and Vite.

### Installation

Install **Accessibility Prism** from the Chrome Web Store and click **Add to Chrome**. That's the whole setup — no build step, no configuration, no project changes.

### What's under the hood
- **axe-core** — automated WCAG rule engine
- **dom-accessibility-api** — W3C AccName spec-compliant accessible name/description computation, powering the SR Walk-Through
- **Playwright** — automated UI test suite for the extension itself (147 tests across 14 spec files)
- No UI frameworks — vanilla TypeScript, kept deliberately lightweight

## Usage

1. Click the **Accessibility Prism** icon in the browser toolbar — a detached popup window opens
2. Select any analysis — Full Page Scan, Heading Structure, Announcement Walk-Through, etc.
3. Results appear in the popup panel; visual overlays are drawn directly on the page behind it
4. Click any issue card to expand it: HTML snippet, CSS selector, WCAG criterion, fix guidance, and a **Highlight** button that scrolls straight to the element
5. Use the **Scope** bar at the top of any result view to narrow analysis to a CSS selector or a picked element; click **Clear** to return to full-page results
6. Export an HTML report of the axe scan from the panel header download button

## Execution

Every audit runs live in the current tab the moment you click its button, and results render directly in the popup:

- **Full Page Scan** → axe-core runs against the page → rule cards appear, grouped and filterable by result type, impact, WCAG level, and free-text search
- Clicking a rule card opens **Issue Details**: every occurrence, its selector, HTML snippet, and a **Highlight on page** button
- The extension's own correctness is covered by a Playwright suite that drives the popup exactly as a user would, against a deliberately "bad accessibility" fixture page

Note that by default the **Needs Review** filter chip is off — axe-core's "incomplete" results need human judgment and are excluded from the initial view to reduce noise. Toggle the chip on to see them.

## Understanding Result Types

Prism separates axe-core findings into three types, and the distinction matters for prioritisation:

- **✕ Violation** — fails a mapped WCAG success criterion. Must fix for conformance.
- **? Needs Review** — axe-core could not determine pass or fail automatically. Requires human judgement; never assume it passes.
- **★ Best Practice** — a recommended practice with **no** WCAG success-criterion mapping. Worth fixing, but not a conformance requirement.

This distinction is deliberate: a rule like `empty-heading` is tagged `best-practice` in axe-core because it maps to no WCAG criterion. It's genuinely worth fixing (an empty heading announces nothing to a screen reader) but it won't fail a WCAG/EAA audit. Surfacing that difference prevents teams from treating optional improvements as release blockers, or vice versa.

## WCAG Knowledge Blocks

Expanded issue cards in the Keyboard, Form Labels, and ARIA Validation views show an inline **knowledge block** explaining the issue in context.

### How it's generated
`utils/issue-knowledge.ts` is the centralized source of truth mapping each non-axe issue type to its WCAG criterion, user-impact statement, and fix suggestion. axe-core-sourced issues (Full Page Scan) instead carry this information natively via axe's own `tags`, `help`, `helpUrl`, and `failureSummary` fields.

### What it shows
For each issue:
- **WCAG success criterion and level** (A / AA / AAA)
- **Plain-English user impact statement** — what actually breaks for a real user
- **Concrete fix suggestion**
- **"Learn more" link** to the authoritative spec

## Limitations

Accessibility Prism is a debugging and inspection tool, not a compliance certification:

- **Automated scanning catches roughly 30–40% of accessibility issues.** The remaining majority requires human judgement — which is exactly why the extension includes manual tools (Manual Keyboard Test, Announcement Walk-Through, Accessible Name Inspector) alongside the automated scan.
- **Simulated screen reader output is not a substitute for real screen reader testing.** The Announcement Walk-Through computes what *should* be announced per the AccName spec; actual NVDA/JAWS/VoiceOver behavior varies.
- **Results are per-page and per-session.** There is no cross-page rollup or persistence between scans.
- **A clean scan does not mean the page is accessible.** It means no automatically detectable issues were found.

## References

- [axe-core](https://github.com/dequelabs/axe-core) — the underlying rule engine
- [dom-accessibility-api](https://github.com/eps1lon/dom-accessibility-api) — W3C AccName spec implementation
- [Deque University](https://dequeuniversity.com/) — rule reference behind the `helpUrl` links in the panel
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) — the standard underlying every knowledge block in the panel
