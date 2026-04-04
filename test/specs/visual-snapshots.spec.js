import { test, expect, SEL, navigateToView } from '../fixtures/panel.js';

test.describe('Visual Regression Snapshots', () => {
  /**
   * These tests capture baseline screenshots of the key UI states.
   * Run with --update-snapshots to set initial baselines.
   */

  test('pre-screen main menu snapshot', async ({ panelPage }) => {
    // Wait for animation to settle
    await panelPage.waitForTimeout(500);
    const panel = panelPage.locator(SEL.panel);
    await expect(panel).toHaveScreenshot('pre-screen.png', {
      mask: [panelPage.locator(`${SEL.panel} #panel-footer-version`)] // Mask version to avoid diffs on version bump
    });
  });

  test('axe results list snapshot', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await panelPage.waitForTimeout(500);
    const panel = panelPage.locator(SEL.panel);
    await expect(panel).toHaveScreenshot('axe-results.png');
  });

  test('scorecard visualization snapshot', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnScorecard, { timeout: 30_000 });
    await panelPage.waitForSelector(`${SEL.panel} .cat-card`, { timeout: 15_000 });
    await panelPage.waitForTimeout(1500);
    
    const panel = panelPage.locator(SEL.panel);
    await expect(panel).toHaveScreenshot('scorecard.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('heading structure tree snapshot', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    await panelPage.waitForTimeout(500);
    const panel = panelPage.locator(SEL.panel);
    await expect(panel).toHaveScreenshot('headings-tree.png');
  });
});
