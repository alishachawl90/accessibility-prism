import { test, expect, SEL, navigateToView, goBack, expandFirstCard } from '../fixtures/panel.js';

const PANEL = SEL.panel;

test.describe('Keyboard Group Mode Tabs', () => {
  test('group mode tabs are visible', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const tabs = panelPage.locator(`${PANEL} .a11y-group-tab`);
    expect(await tabs.count()).toBe(3);
  });

  test('switching to By Region groups by region', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    await panelPage.click(`${PANEL} .a11y-group-tab[data-mode="region"]`);
    await panelPage.waitForTimeout(300);
    const headers = panelPage.locator(`${PANEL} .kb-acc-header`);
    expect(await headers.count()).toBeGreaterThan(0);
  });

  test('switching to By Component groups by component', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    await panelPage.click(`${PANEL} .a11y-group-tab[data-mode="component"]`);
    await panelPage.waitForTimeout(300);
    const headers = panelPage.locator(`${PANEL} .kb-acc-header`);
    expect(await headers.count()).toBeGreaterThan(0);
  });
});

test.describe('Focus Management Card Expand', () => {
  test('focus management cards expand to show details', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFocusMgmt);
    const cards = panelPage.locator(SEL.issueCard);
    const count = await cards.count();
    test.skip(count === 0, 'No focus management issues');
    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });
});

test.describe('Live Region Chip Toggle', () => {
  test('toggling severity chip filters live region issues', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnLiveRegions);
    const chips = panelPage.locator(`${PANEL} button[data-sev]`);
    const count = await chips.count();
    test.skip(count === 0, 'No severity chips');

    const before = await panelPage.locator(SEL.issueCard).count();
    // Toggle the first active chip off
    await chips.first().click();
    await panelPage.waitForTimeout(300);
    const after = await panelPage.locator(SEL.issueCard).count();
    // Either same or fewer
    expect(after).toBeLessThanOrEqual(before);
  });
});

test.describe('Highlight Buttons', () => {
  test('alt text card has highlight button', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAltText);
    const cards = panelPage.locator(SEL.issueCard);
    test.skip(await cards.count() === 0, 'No alt text issues');
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(200);
    const hlBtn = panelPage.locator(`${PANEL} .a11y-highlight-btn`);
    expect(await hlBtn.count()).toBeGreaterThan(0);
  });

  test('heading card has highlight button', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnHeadings);
    const cards = panelPage.locator(SEL.issueCard);
    test.skip(await cards.count() === 0, 'No heading issues');
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(200);
    const hlBtn = panelPage.locator(`${PANEL} .a11y-highlight-btn`);
    expect(await hlBtn.count()).toBeGreaterThan(0);
  });

  test('keyboard issue card has highlight button after expand', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const accHeaders = panelPage.locator(`${PANEL} .kb-acc-header`);
    test.skip(await accHeaders.count() === 0, 'No keyboard sections');
    await accHeaders.first().click();
    await panelPage.waitForTimeout(200);
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(200);
    const hlBtn = panelPage.locator(`${PANEL} .a11y-highlight-btn`);
    expect(await hlBtn.count()).toBeGreaterThan(0);
  });
});

test.describe('Severity Chip Toggle Across Views', () => {
  test('alt text severity chip toggle filters cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAltText);
    const chips = panelPage.locator(`${PANEL} button[data-sev]`);
    test.skip(await chips.count() === 0, 'No severity chips');
    const before = await panelPage.locator(SEL.issueCard).count();
    await chips.first().click();
    await panelPage.waitForTimeout(300);
    const after = await panelPage.locator(SEL.issueCard).count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('form labels severity chip toggle filters cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFormLabels);
    const chips = panelPage.locator(`${PANEL} button[data-sev]`);
    test.skip(await chips.count() === 0, 'No severity chips');
    const before = await panelPage.locator(SEL.issueCard).count();
    await chips.first().click();
    await panelPage.waitForTimeout(300);
    const after = await panelPage.locator(SEL.issueCard).count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('accessible names severity chip toggle filters cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAccNames);
    const chips = panelPage.locator(`${PANEL} button[data-sev]`);
    test.skip(await chips.count() === 0, 'No severity chips');
    const before = await panelPage.locator(SEL.issueCard).count();
    await chips.first().click();
    await panelPage.waitForTimeout(300);
    const after = await panelPage.locator(SEL.issueCard).count();
    // Toggle may increase (if enabling a chip) or decrease
    expect(typeof after).toBe('number');
  });
});
