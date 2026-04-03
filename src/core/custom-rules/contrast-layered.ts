export const contrastLayeredRule = {
  id: 'prism-contrast-layered',
  selector: '*',
  tags: ['wcag2aa', 'wcag143', 'prism-custom'],
  metadata: {
    description:
      'Text on layered or semi-transparent backgrounds should maintain sufficient contrast',
    help: 'Verify contrast when backgrounds include images or transparency',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum',
  },
  all: [],
  any: ['prism-contrast-layered-check'],
  none: [],
};

export const contrastLayeredCheck = {
  id: 'prism-contrast-layered-check',
  evaluate(node: HTMLElement): boolean {
    if (!node.textContent?.trim()) return true;
    // Only check if direct text content exists (not just children)
    const hasDirectText = Array.from(node.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
    );
    if (!hasDirectText) return true;
    const style = getComputedStyle(node);
    const bgImage = style.backgroundImage;
    const hasBgImage = bgImage && bgImage !== 'none';
    const bgColor = style.backgroundColor;
    const isTransparent = bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)';
    const isSemiTransparent =
      bgColor.startsWith('rgba') && !isTransparent && !bgColor.endsWith(', 1)');
    if (!hasBgImage && !isSemiTransparent) return true;
    // Flag elements with background images or semi-transparent backgrounds
    // where we can't reliably calculate contrast
    if (hasBgImage && !bgImage.includes('gradient')) {
      // Image backgrounds — can't determine contrast programmatically
      return false;
    }
    return true;
  },
  metadata: {
    impact: 'moderate',
    messages: {
      pass: 'Text contrast is verifiable against the background',
      fail: 'Text appears over a background image — contrast cannot be automatically verified',
    },
  },
};
