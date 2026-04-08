# Playwright Visual Testing Guide

This guide outlines how to implement and maintain visual regression tests in the Accessibility Prism project.

## 1. Basic Snapshot Capture
The simplest way to compare a UI state is to use `toHaveScreenshot()` on a page or locator.

```javascript
test('panel renders correctly', async ({ panelPage }) => {
  const panel = panelPage.locator('#a11y-analyzer-panel');
  await expect(panel).toHaveScreenshot('panel-state.png');
});
```

## 2. Managing Baselines
Run these commands in your terminal to manage your visual snapshots:

### Run and Compare (Standard)
```bash
npx playwright test test/specs/visual-snapshots.spec.js
```

### Update Baselines (Resetting the "Gold Standard")
Use this when you made intentional UI changes and want to set new reference images.
```bash
npx playwright test test/specs/visual-snapshots.spec.js --update-snapshots
```

## 3. Handling Dynamic Content (Masking)
If your UI has elements that change (like a version number, timer, or user name), use `mask` to ignore those pixels during the comparison.

```javascript
await expect(panel).toHaveScreenshot('panel.png', {
  mask: [panelPage.locator('#panel-version-id')] // Replaces this area with a purple box in the diff
});
```

## 4. Solving Flakiness (Waiting)
Visual tests often fail because they capture an image while an animation is still playing.

### Double RequestAnimationFrame
For heavy D3 or SVG animations (like the Grade Ring), use a timeout or wait for certain classes:
```javascript
await panelPage.waitForSelector('.grade-ring-animation-complete');
await expect(panel).toHaveScreenshot('scorecard.png');
```

### Hard Timeout (Last Resort)
```javascript
await panelPage.waitForTimeout(500); // Wait for CSS transitions to finish
```

## 5. Snapshot Storage
Snapshots are stored in `test/specs/visual-snapshots.spec.js-snapshots/`. 
- **Expected**: The reference image. 
- **Actual**: What the browser saw this time. 
- **Diff**: A composite showing exactly where the pixels changed.

## 6. Advanced Calibration

### Clipping to a Specific Area
If you only want to test a specific component within a large container:
```javascript
await expect(page).toHaveScreenshot({
  clip: { x: 0, y: 0, width: 440, height: 600 }
});
```

### Full Page Snapshots
```javascript
await expect(page).toHaveScreenshot({ fullPage: true });
```

### Threshold Sensitivity
Sometimes, sub-pixel rendering causes tiny diffs. You can adjust the sensitivity:
```javascript
await expect(panel).toHaveScreenshot('panel.png', {
  maxDiffPixels: 100,      // Allow up to 100 pixels to be different
  maxDiffPixelRatio: 0.1,  // Allow up to 10% of the image to be different
  threshold: 0.2           // Sensitivity of pixel color comparison (0 to 1)
});
```
