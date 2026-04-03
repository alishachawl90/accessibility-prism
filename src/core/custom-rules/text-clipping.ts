export const textClippingRule = {
  id: 'prism-text-clipping',
  selector: '*',
  tags: ['wcag2aa', 'wcag144', 'prism-custom'],
  metadata: {
    description: 'Text content should not be permanently clipped or truncated',
    help: 'Avoid overflow:hidden with fixed dimensions that truncate text without user control',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/resize-text',
  },
  all: [],
  any: ['prism-text-clipping-check'],
  none: [],
};

export const textClippingCheck = {
  id: 'prism-text-clipping-check',
  evaluate(node: HTMLElement): boolean {
    if (!node.textContent?.trim()) return true;
    const style = getComputedStyle(node);
    const hasClip =
      style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden';
    if (!hasClip) return true;
    const hasEllipsis = style.textOverflow === 'ellipsis';
    const hasLineClamp = style.webkitLineClamp && style.webkitLineClamp !== 'none';
    if (!hasEllipsis && !hasLineClamp) return true;
    // Check if text is actually being truncated
    if (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1) {
      // Check if there's a mechanism to reveal full text (title, aria-label, expandable)
      if (node.title || node.getAttribute('aria-label')) return true;
      if (node.closest('details') || node.closest('[aria-expanded]')) return true;
      return false;
    }
    return true;
  },
  metadata: {
    impact: 'moderate',
    messages: {
      pass: 'Text content is not clipped or has a mechanism to reveal full text',
      fail: 'Text is clipped with no way for users to access the full content',
    },
  },
};
