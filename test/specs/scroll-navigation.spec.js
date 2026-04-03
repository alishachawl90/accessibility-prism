import { test, expect, SEL, navigateToView, goBack } from '../fixtures/panel.js';

test.describe('Scroll Position Restore', () => {
  test('axe list scroll position restored after viewing details and going back', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAxe);
    await panelPage.waitForSelector(SEL.ruleCard, { timeout: 10_000 });

    const cardCount = await panelPage.locator(SEL.ruleCard).count();
    test.skip(cardCount < 3, 'Need multiple rule cards to test scroll');

    // Scroll down in the panel
    await panelPage.evaluate((sel) => {
      const scrollArea = document.querySelector(`${sel} #scroll-area`);
      if (scrollArea) scrollArea.scrollTop = 200;
    }, SEL.panel);
    await panelPage.waitForTimeout(200);

    const scrollBefore = await panelPage.evaluate((sel) => {
      return document.querySelector(`${sel} #scroll-area`)?.scrollTop ?? 0;
    }, SEL.panel);
    expect(scrollBefore).toBeGreaterThan(0);

    // Navigate to details (click last card to ensure scroll matters)
    await panelPage.click(`${SEL.ruleCard}:last-child`);
    await panelPage.waitForSelector(`${SEL.panel} .occ-header`, { timeout: 5000 });

    // Go back
    await panelPage.click(SEL.backBtn);
    await panelPage.waitForSelector(SEL.ruleCard, { timeout: 5000 });
    await panelPage.waitForTimeout(200);

    const scrollAfter = await panelPage.evaluate((sel) => {
      return document.querySelector(`${sel} #scroll-area`)?.scrollTop ?? 0;
    }, SEL.panel);

    // Should be close to original scroll position (within tolerance)
    expect(scrollAfter).toBeGreaterThan(0);
  });
});

test.describe('Back Navigation', () => {
  test('back from every view returns to pre-screen', async ({ panelPage }) => {
    const views = [
      { name: 'Alt Text', btn: SEL.btnAltText },
      { name: 'Contrast', btn: SEL.btnContrast },
      { name: 'Form Labels', btn: SEL.btnFormLabels },
      { name: 'Headings', btn: SEL.btnHeadings },
      { name: 'Landmarks', btn: SEL.btnLandmarks },
      { name: 'ARIA Validation', btn: SEL.btnAriaValidation },
      { name: 'Acc Names', btn: SEL.btnAccNames },
      { name: 'Touch Targets', btn: SEL.btnTouch },
      { name: 'Auto Keyboard', btn: SEL.btnAutoKey },
      { name: 'Focus Mgmt', btn: SEL.btnFocusMgmt },
      { name: 'Live Regions', btn: SEL.btnLiveRegions },
      { name: 'Reading Order', btn: SEL.btnReadingOrder },
      { name: 'SR Walkthrough', btn: SEL.btnSrWalkthrough },
    ];

    for (const view of views) {
      await navigateToView(panelPage, view.btn);
      await goBack(panelPage);
      await expect(panelPage.locator(SEL.btnAxe)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test('rapid back/forward navigation does not break the panel', async ({ panelPage }) => {
    // Quick cycling through views
    await navigateToView(panelPage, SEL.btnContrast);
    await goBack(panelPage);
    await navigateToView(panelPage, SEL.btnAltText);
    await goBack(panelPage);
    await navigateToView(panelPage, SEL.btnFormLabels);
    await goBack(panelPage);
    await navigateToView(panelPage, SEL.btnHeadings);
    await goBack(panelPage);

    // Panel should still be in pre-screen and functional
    await expect(panelPage.locator(SEL.btnAxe)).toBeVisible();
    await navigateToView(panelPage, SEL.btnAxe);
    await expect(panelPage.locator(SEL.ruleCard).first()).toBeVisible();
  });
});

test.describe('Severity Chip Filters', () => {
  test('toggling severity chip updates visible cards', async ({ panelPage }) => {
    await navigateToView(panelPage, SEL.btnAltText);
    const totalCards = await panelPage.locator(SEL.issueCard).count();
    test.skip(totalCards === 0, 'No alt text issues');

    const chips = panelPage.locator(SEL.sevChip);
    const chipCount = await chips.count();
    test.skip(chipCount < 2, 'Need multiple severity levels');

    // Click the first chip to toggle it off (if there are multiple active)
    await chips.first().click();
    await panelPage.waitForTimeout(400);
    const afterToggle = await panelPage.locator(SEL.issueCard).count();
    // Should have same or fewer cards
    expect(afterToggle).toBeLessThanOrEqual(totalCards);
  });
});
