import { test, expect, SEL, navigateToView, goBack, expandFirstCard } from '../fixtures/panel.js';

test.describe('Heading Analysis', () => {
  test('renders heading tree with nodes', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    const nodes = panelPage.locator(`${SEL.panel} .heading-node`);
    expect(await nodes.count()).toBeGreaterThan(0);
  });

  test('detects heading hierarchy issues', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
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
  test('renders landmark cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('shows landmark roles', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    const content = await panelPage.textContent(SEL.panel);
    expect(content).toMatch(/navigation|main|contentinfo|region/i);
  });

  test('landmark cards expand to show selector and snippet', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    const count = await panelPage.locator(SEL.issueCard).count();
    test.skip(count === 0, 'No landmarks');
    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });

  test('stats strip shows landmark and issue count', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    const stats = await panelPage.textContent(SEL.statsStrip);
    expect(stats).toBeTruthy();
    expect(stats).toMatch(/landmark/i);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLandmarks);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnLandmarks)).toBeVisible();
  });
});

test.describe('Reading Order', () => {
  test('renders reading order cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('shows numbered sequence in badges', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    const content = await panelPage.textContent(SEL.panel);
    expect(content).toContain('1');
  });

  test('reading order cards expand to show selector and snippet', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    const count = await panelPage.locator(SEL.issueCard).count();
    test.skip(count === 0, 'No reading order items');
    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });

  test('stats strip shows element count', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    const stats = await panelPage.textContent(SEL.statsStrip);
    expect(stats).toBeTruthy();
    expect(stats).toMatch(/element/i);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnReadingOrder);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnReadingOrder)).toBeVisible();
  });
});
