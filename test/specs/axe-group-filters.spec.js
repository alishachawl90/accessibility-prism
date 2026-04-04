import { test, expect, SEL, navigateToView, goBack } from '../fixtures/panel.js';


/** Click a group mode tab by its data-mode attribute. */
async function switchGroupMode(page, mode) {
  await page.click(`${SEL.panel} .group-mode-btn[data-mode="${mode}"]`);
  await page.waitForTimeout(300);
}

/** Toggle a result-type chip and wait for re-render. */
async function toggleResultTypeChip(page, type) {
  await page.click(`${SEL.panel} .result-type-chip[data-type="${type}"]`);
  await page.waitForTimeout(300);
}

/** Toggle an impact chip and wait for re-render. */
async function toggleImpactChip(page, level) {
  await page.click(`${SEL.panel} .impact-filter-chip[data-impact="${level}"]`);
  await page.waitForTimeout(300);
}

test.describe('Axe Group Modes', () => {
  test('group mode tabs are visible and default to By Rule', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    const tabs = panelPage.locator(`${SEL.panel} .group-mode-btn`);
    expect(await tabs.count()).toBe(3);
    const activeTab = panelPage.locator(`${SEL.panel} .group-mode-btn[data-mode="rule"]`);
    const color = await activeTab.evaluate(el => el.style.color);
    expect(color).toContain('99'); // #6366F1 → rgb(99, 102, 241)
  });

  test('switching to By Region shows accordion groups', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'region');
    const accHeaders = panelPage.locator(`${SEL.panel} .acc-header`);
    const ruleCards = panelPage.locator(SEL.ruleCard);
    // Region mode: should have accordion headers instead of rule cards
    const accCount = await accHeaders.count();
    const ruleCount = await ruleCards.count();
    expect(accCount).toBeGreaterThan(0);
    expect(ruleCount).toBe(0);
  });

  test('switching to By Component shows accordion groups', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'component');
    const accHeaders = panelPage.locator(`${SEL.panel} .acc-header`);
    const accCount = await accHeaders.count();
    // Component mode should show at least the uncategorized group
    expect(accCount).toBeGreaterThan(0);
  });

  test('switching back to By Rule restores rule cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'region');
    await switchGroupMode(panelPage, 'rule');
    const ruleCards = panelPage.locator(SEL.ruleCard);
    expect(await ruleCards.count()).toBeGreaterThan(0);
  });

  test('region accordion expands to show sub-groups', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'region');
    const header = panelPage.locator(`${SEL.panel} .acc-header`).first();
    const key = await header.getAttribute('data-key');
    const body = panelPage.locator(`${SEL.panel} .acc-body[data-key="${key}"]`);
    await expect(body).toHaveCSS('display', 'none');
    await header.click();
    await panelPage.waitForTimeout(200);
    await expect(body).not.toHaveCSS('display', 'none');
  });
});

test.describe('Axe Filter Combos in Group Modes', () => {
  test('search filters results in By Region mode', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'region');
    const beforeCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    const searchInput = panelPage.locator(`${SEL.panel} #filter-search`);
    await searchInput.fill('zzz-nonexistent-rule');
    await panelPage.waitForTimeout(400);
    const afterCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    expect(afterCount).toBeLessThan(beforeCount);
  });

  test('search filters results in By Component mode', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'component');
    const beforeCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    const searchInput = panelPage.locator(`${SEL.panel} #filter-search`);
    await searchInput.fill('zzz-nonexistent-rule');
    await panelPage.waitForTimeout(400);
    const afterCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    expect(afterCount).toBeLessThan(beforeCount);
  });

  test('result type chip toggle filters By Region accordions', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'region');
    const beforeCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    // Turn off violations chip — should reduce or clear
    await toggleResultTypeChip(panelPage, 'violation');
    const afterCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });

  test('impact chip toggle filters By Component groups', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'component');
    const beforeCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    // Toggle one impact chip off — should reduce or keep same
    await toggleImpactChip(panelPage, 'minor');
    const afterCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });

  test('WCAG severity dropdown filters in By Region mode', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await switchGroupMode(panelPage, 'region');
    const beforeCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    await panelPage.selectOption(`${SEL.panel} #filter-severity`, 'AAA');
    await panelPage.waitForTimeout(300);
    const afterCount = await panelPage.locator(`${SEL.panel} .acc-header`).count();
    // AAA-only filter should show fewer or equal results
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });
});
