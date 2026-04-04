import { test, expect, SEL, navigateToView, goBack } from '../fixtures/panel.js';

async function navigateToFlowList(panelPage) {
  await navigateToView(panelPage, SEL.btnAutoKey);
  const flowBtn = panelPage.locator(`${SEL.panel} [data-toolbar-action="component-flow"]`);
  const count = await flowBtn.count();
  if (count === 0) return null;
  await flowBtn.click();
  await panelPage.waitForTimeout(500);
  return flowBtn;
}

test.describe('Component Flow', () => {
  test('component flow button appears in keyboard view when components exist', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const flowBtn = panelPage.locator(`${SEL.panel} [data-toolbar-action="component-flow"]`);
    const count = await flowBtn.count();
    test.skip(count === 0, 'No component flows detected on test page');
    await expect(flowBtn).toBeVisible();
  });

  test('clicking component flow button shows flow list', async ({ panelPage }) => {
    const btn = await navigateToFlowList(panelPage);
    test.skip(!btn, 'No component flows');
    const cards = panelPage.locator(SEL.issueCard);
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
  });

  test('flow list shows component cards with instance counts', async ({ panelPage }) => {
    const btn = await navigateToFlowList(panelPage);
    test.skip(!btn, 'No component flows');
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
    const text = await cards.first().textContent();
    expect(text).toMatch(/inst/i);
  });

  test('clicking a flow card navigates to flow detail', async ({ panelPage }) => {
    const btn = await navigateToFlowList(panelPage);
    test.skip(!btn, 'No component flows');
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(500);
    const panelText = await panelPage.textContent(SEL.panel);
    expect(panelText).toMatch(/tab stop|entry|exit|instance/i);
  });

  test('back from flow detail returns to flow list', async ({ panelPage }) => {
    const btn = await navigateToFlowList(panelPage);
    test.skip(!btn, 'No component flows');
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(500);
    await panelPage.click(SEL.backBtn);
    await panelPage.waitForFunction(
      (sel) => {
        const panel = document.querySelector(sel);
        return panel && panel.querySelector('.a11y-issue-card');
      },
      SEL.panel,
      { timeout: 5000 }
    );
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('back from flow list returns to keyboard view', async ({ panelPage }) => {
    const btn = await navigateToFlowList(panelPage);
    test.skip(!btn, 'No component flows');
    await panelPage.click(SEL.backBtn);
    await panelPage.waitForTimeout(300);
    const kbHeaders = panelPage.locator(`${SEL.panel} .kb-acc-header`);
    expect(await kbHeaders.count()).toBeGreaterThan(0);
  });
});
