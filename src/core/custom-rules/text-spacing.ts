export const textSpacingRule = {
  id: 'prism-text-spacing',
  selector:
    'p, li, td, th, dd, dt, span, a, label, h1, h2, h3, h4, h5, h6',
  tags: ['wcag2aa', 'wcag1412', 'prism-custom'],
  metadata: {
    description:
      'Ensure text elements support spacing adjustments without loss of content',
    help: 'Text spacing should be adjustable to at least WCAG 1.4.12 minimums',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/text-spacing',
  },
  all: [],
  any: ['prism-text-spacing-check'],
  none: [],
};

export const textSpacingCheck = {
  id: 'prism-text-spacing-check',
  evaluate(node: HTMLElement): boolean {
    const style = getComputedStyle(node);
    if (!node.textContent?.trim()) return true;
    const overflow = style.overflow;
    const overflowY = style.overflowY;
    const height = style.height;
    if (
      (overflow === 'hidden' || overflowY === 'hidden') &&
      height !== 'auto' &&
      height !== ''
    ) {
      const lineHeight =
        parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
      const containerHeight = parseFloat(height);
      const fontSize = parseFloat(style.fontSize);
      if (fontSize > 0 && containerHeight > 0) {
        const linesVisible = containerHeight / lineHeight;
        const textLen = node.textContent?.length || 0;
        const charsPerLine = node.offsetWidth / (fontSize * 0.6);
        const linesNeeded = textLen / Math.max(charsPerLine, 1);
        if (linesNeeded * 1.5 > linesVisible * 1.3) return false;
      }
    }
    return true;
  },
  metadata: {
    impact: 'serious',
    messages: {
      pass: 'Text spacing can be adjusted without content loss',
      fail: 'Text may be clipped when spacing is increased (overflow:hidden with fixed height)',
    },
  },
};
