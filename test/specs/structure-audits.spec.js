import { test, expect, SEL, navigateToView, goBack, expandFirstCard } from '../fixtures/panel.js';

test.describe('Heading Analysis', () => {
  test('renders heading tree with nodes', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    const nodes = panelPage.locator(`${SEL.panel} .heading-node`);
    expect(await nodes.count()).toBeGreaterThan(0);
  });

  test('detects heading hierarchy issues', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    // The test page has missing H1 and a skipped H2→H4 — should produce issue cards
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('issue cards expand to show details', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    const count = await panelPage.locator(SEL.issueCard).count();
    test.skip(count === 0, 'No heading issues');
    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });

  test('stats strip shows heading count', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    const stats = await panelPage.textContent(SEL.statsStrip);
    expect(stats).toBeTruthy();
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnHeadings)).toBeVisible();
  });
});

test.describe('Landmark Analysis', () => {
  test('renders landmark nodes', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    const items = panelPage.locator(`${SEL.panel} .landmark-node`);
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('shows landmark roles', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    const content = await panelPage.textContent(SEL.panel);
    expect(content).toMatch(/navigation|main|contentinfo|region/i);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnLandmarks)).toBeVisible();
  });
});

test.describe('Reading Order', () => {
  test('renders reading order items', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    // Reading order renders highlight buttons with data-idx inside listitem wrappers
    const items = panelPage.locator(`${SEL.panel} [role="listitem"]`);
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('shows numbered sequence', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    const content = await panelPage.textContent(SEL.panel);
    expect(content).toContain('1');
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnReadingOrder)).toBeVisible();
  });
});
