import { test, expect, SEL, navigateToView, goBack } from '../fixtures/panel.js';

const PANEL = SEL.panel;

test.describe('Component Flow', () => {
  test('component flow button appears in keyboard view when components exist', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const flowBtn = panelPage.locator(`${PANEL} [data-toolbar-action="component-flow"]`);
    // May or may not exist depending on component detection
    const count = await flowBtn.count();
    // Skip remaining tests if no flows detected
    test.skip(count === 0, 'No component flows detected on test page');
    await expect(flowBtn).toBeVisible();
  });

  test('clicking component flow button shows flow list', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const flowBtn = panelPage.locator(`${PANEL} [data-toolbar-action="component-flow"]`);
    test.skip(await flowBtn.count() === 0, 'No component flows');
    await flowBtn.click();
    await panelPage.waitForTimeout(500);
    const cards = panelPage.locator(SEL.issueCard);
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('flow list shows component cards with instance counts', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const flowBtn = panelPage.locator(`${PANEL} [data-toolbar-action="component-flow"]`);
    test.skip(await flowBtn.count() === 0, 'No component flows');
    await flowBtn.click();
    await panelPage.waitForTimeout(500);
    const cards = panelPage.locator(SEL.issueCard);
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    // Each card should have badge with instance count
    const text = await cards.first().textContent();
    expect(text).toMatch(/inst/i);
  });

  test('clicking a flow card navigates to flow detail', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const flowBtn = panelPage.locator(`${PANEL} [data-toolbar-action="component-flow"]`);
    test.skip(await flowBtn.count() === 0, 'No component flows');
    await flowBtn.click();
    await panelPage.waitForTimeout(500);
    // Click the first flow card header
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(500);
    // Detail view should show tab stops or entry/exit info
    const panelText = await panelPage.textContent(PANEL);
    expect(panelText).toMatch(/tab stop|entry|exit|instance/i);
  });

  test('back from flow detail returns to flow list', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const flowBtn = panelPage.locator(`${PANEL} [data-toolbar-action="component-flow"]`);
    test.skip(await flowBtn.count() === 0, 'No component flows');
    await flowBtn.click();
    await panelPage.waitForTimeout(500);
    // Click card header to navigate to flow detail
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(500);
    // Now click back
    await panelPage.click(SEL.backBtn);
    await panelPage.waitForFunction(
      (sel) => {
        const panel = document.querySelector(sel);
        return panel && panel.querySelector('.a11y-issue-card');
      },
      PANEL,
      { timeout: 5000 }
    );
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('back from flow list returns to keyboard view', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const flowBtn = panelPage.locator(`${PANEL} [data-toolbar-action="component-flow"]`);
    test.skip(await flowBtn.count() === 0, 'No component flows');
    await flowBtn.click();
    await panelPage.waitForTimeout(500);
    await panelPage.click(SEL.backBtn);
    await panelPage.waitForTimeout(300);
    // Should be back at keyboard view
    const kbHeaders = panelPage.locator(`${PANEL} .kb-acc-header`);
    expect(await kbHeaders.count()).toBeGreaterThan(0);
  });
});
