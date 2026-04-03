import { test, expect, SEL, navigateToView, goBack, expandFirstCard } from '../fixtures/panel.js';

test.describe('Auto Keyboard Analysis', () => {
  test('renders keyboard results view', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    // Should have either issue cards or empty success
    const hasCards = await panelPage.locator(SEL.issueCard).count();
    const hasEmpty = await panelPage.locator(SEL.emptySuccess).count();
    expect(hasCards + hasEmpty).toBeGreaterThan(0);
  });

  test('detects non-focusable interactive elements', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    // The test page has <div> with onclick but no tabindex
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('cards expand to show details', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const count = await panelPage.locator(SEL.issueCard).count();
    test.skip(count === 0, 'No keyboard issues');

    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnAutoKey)).toBeVisible();
  });
});

test.describe('Focus Management', () => {
  test('renders focus management view', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFocusMgmt);
    const hasCards = await panelPage.locator(SEL.issueCard).count();
    const hasEmpty = await panelPage.locator(SEL.emptySuccess).count();
    expect(hasCards + hasEmpty).toBeGreaterThan(0);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFocusMgmt);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnFocusMgmt)).toBeVisible();
  });
});
