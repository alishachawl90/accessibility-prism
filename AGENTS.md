# Accessibility Prism — Agent Handoff Documentation

**Version:** 2.1.0  
**Type:** Chrome Extension (content script + optional side panel)  
**Stack:** TypeScript, Vite, axe-core, Playwright

---

## What This Is

A Chrome extension that injects a floating panel into any web page to run accessibility audits: axe-core violations, heading structure, landmarks, contrast, alt text, form labels, ARIA validation, keyboard analysis, focus management, touch targets, live regions, screen reader walkthrough, reading order, and an aggregated scorecard. Includes 10 custom "Prism" rules that extend axe-core and are classified as `experimental` (not violations).

---

## Architecture

```
index.html ──loads──▶ dist/content.js ──creates──▶ Activation Button
                                                         │ click
                                                         ▼
                                                   FloatingPanel
                                                   (panel.ts)
                                                    │
                          ┌─────────────────────────┼─────────────────────────┐
                          ▼                         ▼                         ▼
                    pre-screen.ts            core/*-analysis.ts        views/*-results.ts
                    (audit buttons)          (run audits)              (render results)
```

### Rendering Cycle

1. User clicks an audit button on `pre-screen`
2. `panel.ts` runs the corresponding `core/*-analysis.ts` function
3. `panel.ts` sets `currentView` and calls `render()`
4. `render()` calls the view's `render*()` function → returns HTML string
5. `panel.ts` sets `container.innerHTML = html`
6. `panel.ts` calls the view's `attach*Listeners()` function → wires event delegation

### Event Listener Pattern

All views using the shared `results-template.ts` go through `attachResultsPageListeners()` which uses an **AbortController** to auto-remove stale listeners from previous views. Views adding extra container-level listeners must use the returned `AbortSignal`:

```typescript
const signal = attachResultsPageListeners(container, actions, chipState);
container.addEventListener('click', handler, { signal });
```

---

## Directory Structure

```
src/
├── main.ts                          Entry point — creates activation button + panel
├── core/
│   ├── types.ts                     Shared TypeScript types
│   ├── axe-runner.ts                Runs axe-core + registers Prism rules
│   ├── heading-analysis.ts          Heading tree + issues
│   ├── landmark-analysis.ts         Landmark map + issues
│   ├── contrast-analysis.ts         Color contrast checks
│   ├── alt-text-analysis.ts         Image alt attribute audit
│   ├── form-labels-analysis.ts      Form control label coverage
│   ├── acc-name-analysis.ts         Accessible name computation
│   ├── aria-validation.ts           ARIA misuse detection
│   ├── keyboard-analysis.ts         Auto keyboard trap/reachability
│   ├── focus-management.ts          Dialog/modal focus patterns
│   ├── touch-target-analysis.ts     WCAG 2.5.8 target size
│   ├── live-region-monitor.ts       aria-live + role=alert
│   ├── component-detection.ts       Similar component clustering
│   ├── region-detection.ts          Page region boundaries
│   ├── deduplication.ts             Issue dedup across audits
│   ├── scorecard.ts                 Aggregated scoring engine
│   └── custom-rules/
│       ├── index.ts                 Registry: PRISM_RULE_IDS, registerPrismRules()
│       ├── text-spacing.ts          prism-text-spacing
│       ├── target-spacing.ts        prism-target-spacing
│       ├── focus-obscured.ts        prism-focus-obscured
│       ├── link-distinguishable.ts  prism-link-distinguishable
│       ├── scrollable-keyboard.ts   prism-scrollable-keyboard
│       ├── focus-indicator.ts       prism-focus-indicator
│       ├── presentational-children  prism-presentational-children
│       ├── text-clipping.ts         prism-text-clipping
│       ├── aria-role-nesting.ts     prism-aria-nesting
│       └── contrast-layered.ts      prism-contrast-layered
├── ui/
│   ├── panel.ts                     FloatingPanel class — state, routing, render cycle
│   ├── panel-styles.ts              Global CSS (injected as <style>)
│   ├── tokens.ts                    Design tokens: SEV, PRIO, IMPACT, colors
│   ├── icons.ts                     SVG icon constants
│   ├── overlay.ts                   Highlight overlay for elements
│   ├── activation-button.ts         Floating activation button
│   ├── element-picker.ts            Click-to-select element scope
│   └── views/
│       ├── results-template.ts      SHARED: renderResultsPage, renderIssueCard, attachResultsPageListeners
│       ├── pre-screen.ts            Home menu with all audit buttons
│       ├── axe-issue-list.ts        Axe results with filters/chips/grouping
│       ├── axe-issue-details.ts     Single violation + occurrences
│       ├── heading-results.ts       Heading tree + issue cards
│       ├── landmark-results.ts      Landmark map
│       ├── contrast-results.ts      Contrast ratio cards
│       ├── alt-text-results.ts      Image alt audit cards
│       ├── form-labels-results.ts   Form label coverage + issues
│       ├── acc-name-results.ts      Accessible name list (searchable)
│       ├── aria-validation-results  ARIA misuse cards
│       ├── keyboard-results.ts      Keyboard issue cards
│       ├── focus-mgmt-results.ts    Focus management cards
│       ├── touch-target-results.ts  Touch target cards
│       ├── live-region-results.ts   Live region cards
│       ├── sr-walkthrough.ts        Step-through SR announcements
│       ├── reading-order-results.ts Numbered reading order
│       ├── scorecard-results.ts     Grade ring + category breakdown
│       ├── manual-tracking.ts       Manual tab trail
│       ├── component-flow-list.ts   Component instance picker
│       └── component-flow-detail.ts Single component tab order
└── utils/
    ├── escape.ts                    HTML escaping
    ├── wcag-map.ts                  Rule → WCAG criterion mapping
    ├── html-report.ts              Downloadable HTML report
    ├── scorecard-report.ts         Scorecard HTML export
    ├── issue-knowledge.ts          Centralized WCAG/fix/impact knowledge per issue type
    └── fix-suggestions.ts          Element-specific code fix generators
```

---

## Key Types

```typescript
type ViewName =
  | 'pre-screen' | 'axe-issue-list' | 'axe-issue-details'
  | 'keyboard-issues' | 'manual-tracking'
  | 'component-flow-list' | 'component-flow-detail'
  | 'heading-results' | 'landmark-results' | 'contrast-results'
  | 'focus-mgmt-results' | 'live-region-results' | 'touch-target-results'
  | 'alt-text-results' | 'acc-name-results' | 'aria-validation-results'
  | 'form-labels-results' | 'sr-walkthrough' | 'reading-order' | 'scorecard';

type AxeResultType = 'violation' | 'needs-review' | 'best-practice' | 'experimental';
```

---

## Design System

All colors are in `src/ui/tokens.ts`. Key palettes:

| Token | Purpose | Example |
|-------|---------|---------|
| `SEV` | Severity (error/warning/info/pass) | `SEV.error.badge → '#DC2626'` |
| `PRIO` | Priority (P1-P4) | `PRIO[1].label → 'P1 Critical'` |
| `IMPACT` | Axe impact (critical/serious/moderate/minor) | `IMPACT.critical.bg` |
| `HEADER_BG` | Panel header | `'#2563EB'` |

Shared UI components live in `results-template.ts`:
- `renderResultsPage()` — page layout with stats strip, severity chips, search, group tabs
- `renderIssueCard()` — expandable card with badge, title, description, code blocks, highlight button
- `renderSeverityBadge()` — colored severity label
- `attachResultsPageListeners()` — event delegation for all interactive elements (uses AbortController)

**All views now use the shared template (Phase 2 complete).** Views that needed custom interactions
(component-flow prev/next, sr-walkthrough nav) use `toolbarHtml` + `onToolbarAction` callbacks.

**Phase 3 improvements:**
- `component-flow-detail.ts` — merged separate "Tab Flow" and "Issues" sections into a single unified list. Each tab stop card now shows matching issues inline via `renderInlineIssue()` in `extraBodyHtml`, eliminating redundancy.
- `keyboard-results.ts` — replaced flat `sectionWrap` divs with collapsible accordion groups (`renderSectionAccordion`) for all three group modes (By Type, By Region, By Component). Accordion toggle uses delegated click listener with `AbortSignal` for cleanup.
- `live-region-results.ts` — redesigned with breakdown bar (assertive/polite/empty/healthy counts), severity filter chips, issues grouped by type in collapsible accordions (`lr-acc-header`/`lr-acc-body`), healthy regions collapsed by default. Uses `LrViewData` wrapper with `severityFilter` state managed in `panel.ts`.
- `acc-name-results.ts` — entries grouped by status (Error/Warning/Pass) in collapsible section accordions (`an-acc-header`/`an-acc-body`). "Pass" chip defaults to OFF so users focus on issues first. Section borders color-coded by severity.
- `axe-issue-list.ts` — fixed filter bug where result type, search, and WCAG filters were ignored in "By Region" and "By Component" group modes. Added `filterRegionViolations()` and extended `getSortedFilteredComponentGroups()` to apply all active filters.

**Issue Knowledge System (Phase 3):**
- `utils/issue-knowledge.ts` centralizes WCAG criterion, user impact statements, fix suggestions, and "learn more" links for all non-axe audit issue types.
- Knowledge bases: `KB_KNOWLEDGE` (keyboard), `FORM_LABEL_KNOWLEDGE` (form labels), `ARIA_KNOWLEDGE` (ARIA validation), `CONTRAST_KNOWLEDGE` (color contrast).
- `renderKnowledgeBlock(k)` generates a consistent HTML block shown in expanded issue cards across all views.
- Integrated in: `keyboard-results.ts`, `form-labels-results.ts`, `aria-validation-results.ts`, `contrast-results.ts`.

---

## How To: Common Tasks

### Add a New View

1. Create `src/ui/views/my-view-results.ts` with `renderMyView()` and `attachMyViewListeners()`
2. Add `'my-view-results'` to the `ViewName` union in `panel.ts`
3. Add state properties to `FloatingPanel` class
4. Add `case 'my-view-results':` in both `renderCurrentView()` and `attachListeners()`
5. Add a button in `pre-screen.ts` with `id="btn-my-view"`
6. Add the click handler in `attachPreScreenListeners()`

### Add a New Custom Rule

1. Create `src/core/custom-rules/my-rule.ts` exporting `myRule` (RuleObject) and `myCheck` (Check)
2. Import in `src/core/custom-rules/index.ts`
3. Add rule ID to `PRISM_RULE_IDS` set
4. Add to the `axe.configure({ rules: [...], checks: [...] })` call in `registerPrismRules()`

### Update the Design System

- Colors/tokens → `src/ui/tokens.ts`
- CSS classes → `src/ui/panel-styles.ts`
- Shared card/page layout → `src/ui/views/results-template.ts`
- Per-view customization → the individual view file

---

## Build & Test

```bash
npm run build          # tsc && vite build → dist/content.js
npm run dev:watch      # vite build --watch (auto-rebuild on save)
npm test               # Playwright: 144 tests, 12 spec files
npm run test:headed    # Playwright with visible browser
npm run test:ui        # Playwright interactive UI
npm run test:report    # Open HTML test report
```

### Local Testing (without Chrome extension)

1. `npm run build` (or `npm run dev:watch`)
2. Open `index.html` via a local server (the test server at port 9333 works)
3. The page loads `dist/content.js` directly via `<script>` tag
4. Click the floating activation button → panel opens

---

## Test Suite

**Framework:** `@playwright/test` with custom fixtures  
**Config:** `playwright.config.js` (auto-starts server on port 9333)

### Structure

```
test/
├── fixtures/
│   ├── server.js       Static server (auto-builds if dist/ missing, no-cache headers)
│   └── panel.js        panelPage fixture, SEL constants, helpers
└── specs/
    ├── panel-lifecycle.spec.js    Activate, collapse/expand, footer, buttons
    ├── axe-scan.spec.js           Full scan, chips, filters, details, back nav, search
    ├── axe-group-filters.spec.js  Group mode switching (By Rule/Region/Component) + filter combos
    ├── card-expand.spec.js        Per-view + multi-view regression (AbortController fix)
    ├── structure-audits.spec.js   Headings, landmarks, reading order
    ├── visual-audits.spec.js      Contrast, alt text, touch targets + knowledge blocks
    ├── form-aria-audits.spec.js   Form labels, ARIA validation, acc names + knowledge blocks
    ├── keyboard-audits.spec.js    Auto keyboard, focus management + knowledge blocks
    ├── advanced-features.spec.js  SR walkthrough, live regions, scorecard
    ├── scroll-navigation.spec.js  Scroll restore, back nav, severity chips, rapid nav
    ├── component-flow.spec.js     Component flow list/detail, navigation, instance counts
    └── remaining-coverage.spec.js Keyboard group tabs, chip toggles, highlight buttons
```

### Source → Spec Mapping

| Source File(s) | Spec File |
|----------------|-----------|
| `panel.ts`, `pre-screen.ts` | `panel-lifecycle.spec.js` |
| `axe-runner.ts`, `axe-issue-list.ts`, `axe-issue-details.ts` | `axe-scan.spec.js` |
| `axe-issue-list.ts` (group modes, filter combos) | `axe-group-filters.spec.js` |
| `results-template.ts` (AbortController) | `card-expand.spec.js` |
| `heading-results.ts`, `landmark-results.ts`, `reading-order-results.ts` | `structure-audits.spec.js` |
| `contrast-results.ts`, `alt-text-results.ts`, `touch-target-results.ts` | `visual-audits.spec.js` |
| `form-labels-results.ts`, `aria-validation-results.ts`, `acc-name-results.ts` | `form-aria-audits.spec.js` |
| `keyboard-results.ts`, `focus-mgmt-results.ts` | `keyboard-audits.spec.js` |
| `sr-walkthrough.ts`, `live-region-results.ts`, `scorecard-results.ts` | `advanced-features.spec.js` |
| `panel.ts` (scroll/nav), `results-template.ts` (chips) | `scroll-navigation.spec.js` |
| `component-flow-list.ts`, `component-flow-detail.ts` | `component-flow.spec.js` |
| Keyboard group tabs, chip toggles across views, highlight btns | `remaining-coverage.spec.js` |

### Test Fixtures API

Import from `test/fixtures/panel.js`:

| Export | Purpose |
|--------|---------|
| `test` | Playwright test with `panelPage` fixture (page + panel open) |
| `expect` | Playwright expect |
| `SEL` | All stable selectors (30+ keys) |
| `navigateToView(page, btnSelector)` | Click audit button, wait for results |
| `goBack(page)` | Click back, wait for pre-screen |
| `expandFirstCard(page)` | Click header, return before/after display |
| `collapseFirstCard(page)` | Click header again, return display |
| `getDisplay(page, selector)` | Get computed display value |
| `countInPanel(page, selector)` | Count elements in panel |

### Writing a New Test

```javascript
import { test, expect, SEL, navigateToView, goBack, expandFirstCard } from '../fixtures/panel.js';

test.describe('My Audit', () => {
  test('detects issues', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnMyAudit);
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('cards expand', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnMyAudit);
    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnMyAudit);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnMyAudit)).toBeVisible();
  });
});
```

---

## Known Patterns & Gotchas

1. **All inline styles use `!important`** — the extension injects into arbitrary pages, so styles must override host page CSS.
2. **AbortController for listeners** — `attachResultsPageListeners` returns an `AbortSignal`. Any extra container-level `addEventListener` must pass `{ signal }` to prevent accumulation across view navigations.
3. **Custom rules are experimental** — Prism rules are classified as `resultType: 'experimental'` (not violations). They appear under a separate chip in the axe results list.
4. **Scroll position restore** uses double `requestAnimationFrame` in `panel.ts` to wait for DOM layout before setting `scrollTop`.
5. **`index.html` is a deliberate "bad a11y" fixture page** — it has missing alt text, bad contrast, unlabeled forms, ARIA misuse, small touch targets, etc. for comprehensive test coverage.
6. **All views unified (Phase 2)** — every view now uses `renderResultsPage` + `renderIssueCard` + `attachResultsPageListeners`. Views with custom navigation (component-flow prev/next, sr-walkthrough) use `toolbarHtml` + `onToolbarAction`. No more hand-built HTML or per-element listeners in any view file.
7. **Only `axe-issue-list.ts` and `axe-issue-details.ts` remain specialized** — they have unique rule-card grouping and occurrence-level detail that doesn't fit the generic template.
8. **Keyboard results use collapsible accordions (Phase 3)** — sections in all three group modes (By Type, By Region, By Component) are wrapped in `.kb-acc-header` / `.kb-acc-body` accordion elements. The expand/collapse listener uses the `AbortSignal` from `attachResultsPageListeners`.
9. **Component flow detail merges steps + issues (Phase 3)** — no separate "Issues" section. Each tab stop card shows its matching issues inline via `extraBodyHtml` using `renderInlineIssue()`.
10. **Live Regions view redesign** — issues grouped by type in collapsible accordions (`lr-acc-header`/`lr-acc-body`), severity filter chips, breakdown bar (assertive/polite/empty/healthy counts), healthy regions in collapsed accordion. Uses `LrViewData` wrapper with `severityFilter` state managed in `panel.ts`.
11. **Accessible Names view redesign** — entries grouped by status (Error/Warning/Pass) in collapsible section accordions (`an-acc-header`/`an-acc-body`). "Pass" chip defaults to OFF. Section borders color-coded by severity.
12. **Issue Knowledge blocks** — `utils/issue-knowledge.ts` provides centralized WCAG criterion mapping, plain-English user impact statements, fix suggestions, and "learn more" URLs for non-axe audits (Keyboard, Form Labels, ARIA, Contrast). Rendered via `renderKnowledgeBlock()` in expanded card `extraBodyHtml`.
13. **Axe group mode filters** — "By Region" and "By Component" tabs now correctly apply result type chips, search query, and WCAG severity filters. Previously these tabs showed all unfiltered results.
