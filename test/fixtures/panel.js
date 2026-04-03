/**
 * Playwright fixture that extends the base test with panel helpers.
 * Every spec imports `test` and `expect` from here instead of @playwright/test.
 */

import { test as base, expect } from '@playwright/test';

const PANEL = '#a11y-analyzer-panel';

export { expect };

export const test = base.extend({
  /**
   * `panelPage` — a Page that has already loaded index.html and activated the panel.
   * Use this as the default fixture for any spec that needs the panel open.
   */
  panelPage: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForSelector('#a11y-analyzer-activate', { timeout: 5000 });
    await page.click('#a11y-analyzer-activate');
    await page.waitForSelector(PANEL, { timeout: 5000 });
    await use(page);
  },
});

// ---------------------------------------------------------------------------
// Reusable selector constants
// ---------------------------------------------------------------------------

export const SEL = {
  panel: PANEL,
  activate: '#a11y-analyzer-activate',
  backBtn: `${PANEL} #btn-back`,

  // Pre-screen buttons
  btnAxe: `${PANEL} #btn-auto-axe`,
  btnPartialScan: `${PANEL} #btn-partial-scan`,
  btnHeadings: `${PANEL} #btn-headings`,
  btnLandmarks: `${PANEL} #btn-landmarks`,
  btnContrast: `${PANEL} #btn-contrast`,
  btnAltText: `${PANEL} #btn-alt-text`,
  btnFormLabels: `${PANEL} #btn-form-labels`,
  btnAccNames: `${PANEL} #btn-acc-names`,
  btnAriaValidation: `${PANEL} #btn-aria-validation`,
  btnTouch: `${PANEL} #btn-touch`,
  btnAutoKey: `${PANEL} #btn-auto-key`,
  btnManualKey: `${PANEL} #btn-manual-key`,
  btnFocusMgmt: `${PANEL} #btn-focus-mgmt`,
  btnLiveRegions: `${PANEL} #btn-live-regions`,
  btnReadingOrder: `${PANEL} #btn-reading-order`,
  btnSrWalkthrough: `${PANEL} #btn-sr-walkthrough`,
  btnScorecard: `${PANEL} #btn-scorecard`,
  btnComponentFlow: `${PANEL} #btn-component-flow`,

  // Common elements
  ruleCard: `${PANEL} .rule-card`,
  issueCard: `${PANEL} .a11y-issue-card`,
  cardHeader: `${PANEL} .a11y-card-header`,
  cardBody: `${PANEL} .a11y-card-body`,
  sevChip: `${PANEL} .a11y-sev-chip`,
  statsStrip: `${PANEL} .a11y-stats-strip`,
  emptySuccess: `${PANEL} .a11y-empty-success`,
  searchInput: `${PANEL} .a11y-search-input`,
  resultTypeChip: `${PANEL} .result-type-chip`,
  impactFilterChip: `${PANEL} .impact-filter-chip`,
  groupModeBtn: `${PANEL} .group-mode-btn`,
  accordion: `${PANEL} .acc-section`,
  accordionHeader: `${PANEL} .acc-header`,
  accordionBody: `${PANEL} .acc-body`,
  scrollArea: `${PANEL} #scroll-area`,
};

// ---------------------------------------------------------------------------
// Reusable helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to a view by clicking its pre-screen button, then wait for
 * either issue cards or a success message to appear.
 */
export async function navigateToView(page, buttonSelector, opts = {}) {
  await page.click(buttonSelector);
  const timeout = opts.timeout ?? 15_000;
  await page.waitForFunction(
    (panelSel) => {
      const panel = document.querySelector(panelSel);
      if (!panel) return false;
      return (
        panel.querySelector('.a11y-issue-card') ||
        panel.querySelector('.a11y-empty-success') ||
        panel.querySelector('.heading-node') ||
        panel.querySelector('.landmark-node') ||
        panel.querySelector('.wt-item') ||
        panel.querySelector('.cat-card') ||
        panel.querySelector('.rule-card') ||
        panel.querySelector('.acc-header') ||
        panel.querySelector('#btn-back')
      );
    },
    PANEL,
    { timeout }
  );
}

/** Go back to pre-screen from any view. */
export async function goBack(page) {
  await page.click(SEL.backBtn);
  await page.waitForSelector(SEL.btnAxe, { timeout: 5000 });
}

/** Count elements matching a selector inside the panel. */
export async function countInPanel(page, selector) {
  return page.evaluate(
    ([panelSel, sel]) => document.querySelectorAll(`${panelSel} ${sel}`).length,
    [PANEL, selector.replace(PANEL + ' ', '')]
  );
}

/** Get computed display of first element matching selector. */
export async function getDisplay(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).display : null;
  }, selector);
}

/** Click the first card header and verify expansion. */
export async function expandFirstCard(page) {
  const bodyBefore = await getDisplay(page, SEL.cardBody);
  await page.click(SEL.cardHeader);
  await page.waitForTimeout(200);
  const bodyAfter = await getDisplay(page, SEL.cardBody);
  return { before: bodyBefore, after: bodyAfter };
}

/** Collapse the first card and verify. */
export async function collapseFirstCard(page) {
  await page.click(SEL.cardHeader);
  await page.waitForTimeout(200);
  return getDisplay(page, SEL.cardBody);
}
