export const focusIndicatorRule = {
  id: 'prism-focus-indicator',
  selector:
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="tab"], [role="menuitem"]',
  tags: ['wcag2aa', 'wcag2411', 'prism-custom'],
  metadata: {
    description: 'Focusable elements must have a visible focus indicator',
    help: 'Interactive elements should show a visible focus ring or equivalent',
    helpUrl: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance',
  },
  all: [],
  any: ['prism-focus-indicator-check'],
  none: [],
};

export const focusIndicatorCheck = {
  id: 'prism-focus-indicator-check',
  evaluate(node: HTMLElement): boolean {
    const style = getComputedStyle(node);
    // Check if outline is explicitly removed
    if (style.outlineStyle === 'none' && style.outlineWidth === '0px') {
      // No outline — check for alternative indicators
      const boxShadow = style.boxShadow;
      if (boxShadow && boxShadow !== 'none') return true;
      const borderStyle = style.borderStyle;
      if (borderStyle && borderStyle !== 'none') return true;
      // Check CSS for :focus rules (heuristic: if outline:none is set, likely suppressed)
      // Can't reliably check :focus pseudo-class at runtime without triggering focus
      // Flag as potential issue
      return false;
    }
    return true;
  },
  metadata: {
    impact: 'serious',
    messages: {
      pass: 'Element has a visible focus indicator',
      fail: 'Element has outline:none without an alternative visible focus indicator',
    },
  },
};
