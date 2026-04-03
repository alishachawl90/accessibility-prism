export const targetSpacingRule = {
  id: 'prism-target-spacing',
  selector:
    'a[href], button, input, select, textarea, [role="button"], [role="link"], [tabindex]',
  tags: ['wcag22aa', 'wcag258', 'prism-custom'],
  metadata: {
    description:
      'Interactive elements should maintain minimum spacing from adjacent targets',
    help: 'Target spacing should be at least 24px (WCAG 2.5.8)',
    helpUrl:
      'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum',
  },
  all: [],
  any: ['prism-target-spacing-check'],
  none: [],
};

export const targetSpacingCheck = {
  id: 'prism-target-spacing-check',
  evaluate(node: HTMLElement): boolean {
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return true;
    const interactiveSelector =
      'a[href], button, input, select, textarea, [role="button"], [role="link"], [tabindex]';
    const siblings = node.parentElement?.querySelectorAll(interactiveSelector);
    if (!siblings) return true;
    for (const sib of siblings) {
      if (sib === node) continue;
      const sibRect = (sib as HTMLElement).getBoundingClientRect();
      if (sibRect.width === 0 || sibRect.height === 0) continue;
      const dx = Math.max(
        0,
        Math.max(rect.left, sibRect.left) - Math.min(rect.right, sibRect.right),
      );
      const dy = Math.max(
        0,
        Math.max(rect.top, sibRect.top) - Math.min(rect.bottom, sibRect.bottom),
      );
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 24) return false;
    }
    return true;
  },
  metadata: {
    impact: 'moderate',
    messages: {
      pass: 'Target has sufficient spacing from adjacent interactive elements',
      fail: 'Target is too close to an adjacent interactive element (less than 24px)',
    },
  },
};
