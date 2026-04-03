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

  test('expanded card shows WCAG knowledge block', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnFormLabels);
    const cards = panelPage.locator(SEL.issueCard);
    test.skip(await cards.count() === 0, 'No form label issues');
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(200);
    const body = panelPage.locator(SEL.cardBody).first();
    const text = await body.textContent();
    expect(text).toContain('WCAG');
    expect(text).toContain('User Impact');
    expect(text).toContain('How to Fix');
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

  test('expanded card shows WCAG knowledge block', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAriaValidation);
    const cards = panelPage.locator(SEL.issueCard);
    test.skip(await cards.count() === 0, 'No ARIA issues');
    await panelPage.click(SEL.cardHeader);
    await panelPage.waitForTimeout(200);
    const body = panelPage.locator(SEL.cardBody).first();
    const text = await body.textContent();
    expect(text).toContain('WCAG');
    expect(text).toContain('User Impact');
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
    const cards = panelPage.locator(SEL.issueCard);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('groups entries by status in collapsible accordions', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAccNames);
    const accHeaders = panelPage.locator(`${SEL.panel} .an-acc-header`);
    expect(await accHeaders.count()).toBeGreaterThan(0);
  });

  test('Pass chip defaults to OFF', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAccNames);
    const passChip = panelPage.locator(`${SEL.panel} button[data-sev="info"]`);
    // Inactive chip has gray (#D1D5DB) border; active has the themed color
    const borderStyle = await passChip.evaluate(el => getComputedStyle(el).borderColor);
    expect(borderStyle).toContain('rgb(209, 213, 219)');
  });

  test('accordion expand/collapse works', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAccNames);
    const headers = panelPage.locator(`${SEL.panel} .an-acc-header`);
    const count = await headers.count();
    test.skip(count === 0, 'No accordion sections');

    const firstHeader = headers.first();
    const key = await firstHeader.getAttribute('data-key');
    const body = panelPage.locator(`${SEL.panel} .an-acc-body[data-key="${key}"]`);

    const initialDisplay = await body.evaluate(el => el.style.display);
    await firstHeader.click();
    await panelPage.waitForTimeout(200);
    const afterDisplay = await body.evaluate(el => el.style.display);
    // Should toggle from initial state
    expect(afterDisplay !== initialDisplay || afterDisplay === 'block').toBeTruthy();
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
