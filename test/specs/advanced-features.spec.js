import { test, expect, SEL, navigateToView, goBack } from '../fixtures/panel.js';

test.describe('Screen Reader Walkthrough', () => {
  test('renders walkthrough items', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnSrWalkthrough);
    const items = panelPage.locator(`${SEL.panel} .wt-item`);
    expect(await items.count()).toBeGreaterThan(0);
  });

  test('has prev/next navigation buttons', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnSrWalkthrough);
    await expect(panelPage.locator(`${SEL.panel} [data-toolbar-action="wt-next"]`)).toBeAttached();
  });

  test('next button changes the active item highlight', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnSrWalkthrough);
    const nextBtn = panelPage.locator(`${SEL.panel} [data-toolbar-action="wt-next"]`);
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
  test('renders live region results with breakdown bar', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLiveRegions);
    const content = await panelPage.textContent(SEL.panel);
    expect(content).toMatch(/region/i);
    expect(content).toMatch(/assertive|polite|empty|healthy/i);
  });

  test('groups issues into collapsible accordions', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLiveRegions);
    const accHeaders = panelPage.locator(`${SEL.panel} .lr-acc-header`);
    const count = await accHeaders.count();
    expect(count).toBeGreaterThan(0);
  });

  test('accordion expand/collapse works', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLiveRegions);
    const accHeaders = panelPage.locator(`${SEL.panel} .lr-acc-header`);
    const count = await accHeaders.count();
    test.skip(count === 0, 'No live region sections');

    // Find a collapsed accordion
    const bodies = panelPage.locator(`${SEL.panel} .lr-acc-body`);
    let collapsedIdx = -1;
    for (let i = 0; i < count; i++) {
      const display = await bodies.nth(i).evaluate(el => el.style.display);
      if (display === 'none') { collapsedIdx = i; break; }
    }
    test.skip(collapsedIdx === -1, 'No collapsed accordions to test');

    await accHeaders.nth(collapsedIdx).click();
    await panelPage.waitForTimeout(200);
    const afterDisplay = await bodies.nth(collapsedIdx).evaluate(el => el.style.display);
    expect(afterDisplay).toBe('block');
  });

  test('severity filter chips are present', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLiveRegions);
    // Chips rendered by renderResultsPage — use button[data-sev] as reliable selector
    const chips = panelPage.locator(`${SEL.panel} button[data-sev]`);
    expect(await chips.count()).toBeGreaterThanOrEqual(1);
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
