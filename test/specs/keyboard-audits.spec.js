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

  test('sections are collapsible accordions', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const headers = panelPage.locator('.kb-acc-header');
    const count = await headers.count();
    test.skip(count === 0, 'No keyboard sections');

    // Body should be hidden initially
    const bodyBefore = await panelPage.locator('.kb-acc-body').first().evaluate(el => el.style.display);
    expect(bodyBefore).toBe('none');

    // Click accordion header to expand
    await headers.first().click();
    await panelPage.waitForTimeout(200);
    const bodyAfter = await panelPage.locator('.kb-acc-body').first().evaluate(el => el.style.display);
    expect(bodyAfter).toBe('block');
  });

  test('cards inside accordion expand to show details', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const accHeaders = panelPage.locator('.kb-acc-header');
    const accCount = await accHeaders.count();
    test.skip(accCount === 0, 'No keyboard sections');

    // Expand the first accordion to reveal cards
    await accHeaders.first().click();
    await panelPage.waitForTimeout(200);

    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });

  test('expanded card shows WCAG info, user impact, and fix suggestion', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAutoKey);
    const accHeaders = panelPage.locator('.kb-acc-header');
    const accCount = await accHeaders.count();
    test.skip(accCount === 0, 'No keyboard sections');

    await accHeaders.first().click();
    await panelPage.waitForTimeout(200);
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(200);

    const body = panelPage.locator(SEL.cardBody).first();
    const text = await body.textContent();
    expect(text).toContain('WCAG');
    expect(text).toContain('User Impact');
    expect(text).toContain('How to Fix');
    expect(text).toContain('Learn more');
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
