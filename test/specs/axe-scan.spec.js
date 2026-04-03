import { test, expect, SEL, navigateToView, goBack } from '../fixtures/panel.js';

test.describe('Axe Full Page Scan', () => {
  test('produces rule cards with violations', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    const cards = panelPage.locator(SEL.ruleCard);
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('displays result type filter chips', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    const chips = panelPage.locator(SEL.resultTypeChip);
    expect(await chips.count()).toBeGreaterThanOrEqual(1);
  });

  test('displays impact severity filter chips', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    const impactChips = panelPage.locator(`${SEL.panel} .impact-filter-chip`);
    expect(await impactChips.count()).toBeGreaterThanOrEqual(1);
  });

  test('clicking a rule card navigates to issue details', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await panelPage.click(SEL.ruleCard);
    await expect(panelPage.locator(SEL.backBtn)).toBeVisible();
    // Rule cards should not be present in detail view
    await expect(panelPage.locator(SEL.ruleCard)).toHaveCount(0);
  });

  test('issue details show occurrences with expandable bodies', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await panelPage.click(SEL.ruleCard);
    await panelPage.waitForSelector(`${SEL.panel} .occ-header`, { timeout: 5000 });

    const occHeader = panelPage.locator(`${SEL.panel} .occ-header`).first();
    const occBody = panelPage.locator(`${SEL.panel} .occ-body`).first();

    // Body starts hidden
    await expect(occBody).toHaveCSS('display', 'none');

    // Click to expand
    await occHeader.click();
    await panelPage.waitForTimeout(200);
    await expect(occBody).not.toHaveCSS('display', 'none');
  });

  test('back button returns to rule card list', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await panelPage.click(SEL.ruleCard);
    await panelPage.waitForSelector(SEL.backBtn, { timeout: 5000 });
    await panelPage.click(SEL.backBtn);
    await expect(panelPage.locator(SEL.ruleCard).first()).toBeVisible();
  });

  test('double back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await panelPage.click(SEL.ruleCard);
    await panelPage.waitForSelector(SEL.backBtn, { timeout: 5000 });
    await panelPage.click(SEL.backBtn);
    await panelPage.waitForSelector(SEL.ruleCard, { timeout: 5000 });
    await panelPage.click(SEL.backBtn);
    await expect(panelPage.locator(SEL.btnAxe)).toBeVisible();
  });

  test('search filter narrows visible rule cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    const before = await panelPage.locator(SEL.ruleCard).count();
    const searchInput = panelPage.locator(`${SEL.panel} #filter-search`);
    await searchInput.fill('color');
    await panelPage.waitForTimeout(400);
    const after = await panelPage.locator(SEL.ruleCard).count();
    expect(after).toBeLessThanOrEqual(before);
  });
});
