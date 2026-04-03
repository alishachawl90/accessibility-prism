export const focusObscuredRule = {
  id: 'prism-focus-obscured',
  selector:
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  tags: ['wcag2aa', 'wcag2411', 'prism-custom'],
  metadata: {
    description:
      'Focused elements should not be entirely hidden behind sticky/fixed elements',
    help: 'Focus must not be obscured by fixed positioned content (WCAG 2.4.11)',
    helpUrl:
      'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum',
  },
  all: [],
  any: ['prism-focus-obscured-check'],
  none: [],
};

export const focusObscuredCheck = {
  id: 'prism-focus-obscured-check',
  evaluate(node: HTMLElement): boolean {
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return true;
    const allFixed = document.querySelectorAll('*');
    for (const el of allFixed) {
      const style = getComputedStyle(el);
      if (style.position !== 'fixed' && style.position !== 'sticky') continue;
      if (el === node || el.contains(node) || node.contains(el)) continue;
      const fixedRect = (el as HTMLElement).getBoundingClientRect();
      if (fixedRect.width === 0 || fixedRect.height === 0) continue;
      if (
        fixedRect.top <= rect.top &&
        fixedRect.bottom >= rect.bottom &&
        fixedRect.left <= rect.left &&
        fixedRect.right >= rect.right
      ) {
        const zFixed = parseInt(style.zIndex, 10) || 0;
        const zNode = parseInt(getComputedStyle(node).zIndex, 10) || 0;
        if (zFixed >= zNode) return false;
      }
    }
    return true;
  },
  metadata: {
    impact: 'serious',
    messages: {
      pass:
        'Element is not obscured by fixed/sticky positioned content when focused',
      fail: 'Element may be entirely obscured by fixed/sticky positioned content',
    },
  },
};
