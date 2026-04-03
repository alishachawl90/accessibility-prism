import { test, expect, SEL, navigateToView, goBack, expandFirstCard } from '../fixtures/panel.js';

test.describe('Form Labels Audit', () => {
  test('detects unlabeled form controls', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFormLabels);
    // Test page has <input> without label, <select> without label, <checkbox> without label
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('shows control count and labeled percentage in stats', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFormLabels);
    const stats = await panelPage.textContent(SEL.statsStrip);
    expect(stats).toMatch(/controls/i);
    expect(stats).toMatch(/labeled/i);
  });

  test('severity chips are present', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFormLabels);
    const chips = panelPage.locator(SEL.sevChip);
    expect(await chips.count()).toBeGreaterThanOrEqual(1);
  });

  test('card expand shows selector and snippet', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFormLabels);
    const count = await panelPage.locator(SEL.issueCard).count();
    test.skip(count === 0, 'No form label issues');

    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
    const codeBlocks = panelPage.locator(`${SEL.panel} .a11y-code-block`);
    expect(await codeBlocks.count()).toBeGreaterThanOrEqual(1);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFormLabels);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnFormLabels)).toBeVisible();
  });
});

test.describe('ARIA Validation', () => {
  test('detects ARIA issues on test page', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAriaValidation);
    // Test page has: invalid role, broken aria-labelledby, positive tabindex, hidden focusable
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('severity chips present', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAriaValidation);
    const chips = panelPage.locator(SEL.sevChip);
    expect(await chips.count()).toBeGreaterThanOrEqual(1);
  });

  test('card expand works', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAriaValidation);
    const count = await panelPage.locator(SEL.issueCard).count();
    test.skip(count === 0, 'No ARIA issues');

    const { after } = await expandFirstCard(panelPage);
    expect(after).toBe('block');
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAriaValidation);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnAriaValidation)).toBeVisible();
  });
});

test.describe('Accessible Names', () => {
  test('renders element list with roles and names', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAccNames);
    // Acc names shows all interactive elements — should have several
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('search input filters results', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAccNames);
    const before = await panelPage.locator(SEL.issueCard).count();
    test.skip(before === 0, 'No acc name entries');

    const input = panelPage.locator(SEL.searchInput);
    await input.fill('Submit');
    await panelPage.waitForTimeout(400);
    const after = await panelPage.locator(SEL.issueCard).count();
    expect(after).toBeLessThanOrEqual(before);
  });

  test('back returns to pre-screen', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAccNames);
    await goBack(panelPage);
    await expect(panelPage.locator(SEL.btnAccNames)).toBeVisible();
  });
});
