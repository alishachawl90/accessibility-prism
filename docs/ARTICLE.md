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

Two capabilities set it apart from the usual scanner: it tells you **what a screen reader will actually announce**, and it verifies **what the keyboard actually does** rather than what the DOM implies it should. Both are covered below.

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

### Keyboard & Focus — testing what actually happens, not what should

Almost every accessibility tool works out keyboard behaviour by reading the DOM: which elements are focusable in theory, and in what order. That misses the failures that matter most, because a page can look flawless on paper and still trap or skip a real user.

Prism takes the opposite approach. It walks the page.

- **Keyboard Analysis** — steps through every focusable element in real time, scrolling to follow along and drawing numbered badges with connecting arrows so you watch the tab order unfold. Crucially, it attempts to focus each element and records whether focus was *genuinely received*, then flags the ones that were skipped — elements hidden at runtime, or intercepted by a focus trap, that static analysis happily reports as fine. (Skipped-stop detection is marked experimental in the panel.)
- **Manual Keyboard Test** — tab through the page yourself and Prism records your real trail, drawing it back as numbered arrows on the page. Reality rather than theory, including custom widgets no analyser can reason about.
- **Component Keyboard Flow** — narrow the same analysis to a single UI component, so you can debug one card, menu, or dialog without wading through the entire page.
- **Focus Management** — checks the patterns modals routinely get wrong: does focus move into the dialog, stay trapped while it's open, and return to the control that opened it.

Every finding carries its WCAG criterion, the user impact in plain English, and a concrete fix.

### Screen Reader Simulation — the part that sets Prism apart

Most accessibility tools tell you a rule failed. Very few tell you what a screen reader user will actually *hear*.

Checking that normally means installing NVDA, JAWS, or VoiceOver and learning to drive it — a real barrier for the developers, designers, and product managers who simply need to know whether their component announces sensibly. Prism brings that into the panel.

- **Announcement Walk-Through** — step through the page one element at a time and read exactly what would be announced: name, role, state, and description. Computed using the W3C Accessible Name and Description Computation algorithm — the same specification browsers use to build their own accessibility tree — not guesswork or a simplified approximation.
- **Accessible Name Inspector** — the computed name, role, and state of every significant element, grouped by status (Error / Warning / Pass). Spot the control that announces as nothing more than "button" before a user does.
- **Reading Order** — numbered markers drawn directly on the page showing the true DOM order a screen reader follows, which is frequently not the order the eye follows.
- **ARIA Validation** — broken `aria-labelledby` references, invalid roles, forbidden patterns, missing required properties: the ARIA mistakes that silently distort or erase what gets announced.
- **Form Labels Audit** — unlabeled controls, placeholder-only inputs, missing fieldset legends — the most common reason a form is impossible to complete by ear.

This is simulation, not a replacement for testing with real assistive technology (see Limitations). But it catches the majority of announcement problems in seconds, at the point in the workflow where they are cheapest to fix.

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
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/) — the standard every finding in the panel maps back to
