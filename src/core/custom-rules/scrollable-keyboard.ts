export const scrollableKeyboardRule = {
  id: 'prism-scrollable-keyboard',
  selector: '*',
  tags: ['wcag2a', 'wcag211', 'prism-custom'],
  metadata: {
    description: 'Scrollable regions must be reachable via keyboard',
    help: 'Scrollable content areas should be keyboard accessible',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard',
  },
  all: [],
  any: ['prism-scrollable-keyboard-check'],
  none: [],
};

export const scrollableKeyboardCheck = {
  id: 'prism-scrollable-keyboard-check',
  evaluate(node: HTMLElement): boolean {
    const style = getComputedStyle(node);
    const isScrollable =
      (style.overflowX === 'scroll' ||
        style.overflowX === 'auto' ||
        style.overflowY === 'scroll' ||
        style.overflowY === 'auto') &&
      (node.scrollHeight > node.clientHeight + 1 ||
        node.scrollWidth > node.clientWidth + 1);
    if (!isScrollable) return true;
    if (node.tabIndex >= 0) return true;
    if (
      node.getAttribute('role') === 'region' ||
      node.getAttribute('role') === 'group'
    ) {
      if (node.tabIndex >= 0) return true;
    }
    const focusableChild = node.querySelector(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusableChild) return true;
    return false;
  },
  metadata: {
    impact: 'serious',
    messages: {
      pass: 'Scrollable region is keyboard accessible',
      fail: 'Scrollable region is not keyboard accessible — add tabindex="0" or ensure it contains a focusable element',
    },
  },
};
