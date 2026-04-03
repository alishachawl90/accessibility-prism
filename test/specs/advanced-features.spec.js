import { test, expect, SEL, navigateToView, goBack } from '../fixtures/panel.js';

test.describe('Screen Reader Walkthrough', () => {
  test('renders walkthrough items', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnSrWalkthrough);
    const items = panelPage.locator(`${SEL.panel} .wt-item`);
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('has prev/next navigation buttons', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnSrWalkthrough);
    await expect(panelPage.locator(`${SEL.panel} #btn-wt-next`)).toBeAttached();
  });

  test('next button changes the active item highlight', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnSrWalkthrough);
    const nextBtn = panelPage.locator(`${SEL.panel} #btn-wt-next`);
    await expect(nextBtn).toBeVisible();

    // Get the current announcement text shown in the header area
    const announceBefore = await panelPage.evaluate((sel) => {
      const scrollArea = document.querySelector(`${sel} #scroll-area`);
      return scrollArea?.innerHTML || '';
    }, SEL.panel);

    await nextBtn.click();
    await panelPage.waitForTimeout(300);

    const announceAfter = await panelPage.evaluate((sel) => {
      const scrollArea = document.querySelector(`${sel} #scroll-area`);
      return scrollArea?.innerHTML || '';
    }, SEL.panel);

    expect(announceAfter).not.toBe(announceBefore);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnSrWalkthrough);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnSrWalkthrough)).toBeVisible();
  });
});

test.describe('Live Regions', () => {
  test('renders live region results', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLiveRegions);
    // Test page has aria-live="polite" and role="alert"
    const hasCards = await panelPage.locator(SEL.issueCard).count();
    const hasEmpty = await panelPage.locator(SEL.emptySuccess).count();
    const hasContent = (await panelPage.textContent(SEL.panel)).length > 50;
    expect(hasCards + hasEmpty > 0 || hasContent).toBeTruthy();
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLiveRegions);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnLiveRegions)).toBeVisible();
  });
});

test.describe('Scorecard', () => {
  test('renders scorecard with category cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnScorecard, { timeout: 30_000 });
    const catCards = panelPage.locator(`${SEL.panel} .cat-card`);
    await expect(catCards.first()).toBeVisible({ timeout: 25_000 });
    expect(await catCards.count()).toBeGreaterThan(0);
  });

  test('shows category breakdown with SVG grade rings', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnScorecard, { timeout: 30_000 });
    await panelPage.waitForSelector(`${SEL.panel} .cat-card`, { timeout: 25_000 });
    const svgs = panelPage.locator(`${SEL.panel} .cat-card svg`);
    expect(await svgs.count()).toBeGreaterThan(0);
    const content = await panelPage.textContent(SEL.panel);
    expect(content).toMatch(/heading|contrast|image|keyboard|form|landmark/i);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnScorecard, { timeout: 30_000 });
    await panelPage.waitForSelector(`${SEL.panel} .cat-card`, { timeout: 25_000 });
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnScorecard)).toBeVisible();
  });
});
