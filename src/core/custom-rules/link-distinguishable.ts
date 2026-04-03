export const linkDistinguishableRule = {
  id: 'prism-link-distinguishable',
  selector: 'a[href]',
  tags: ['wcag2a', 'wcag141', 'prism-custom'],
  metadata: {
    description:
      'Links must be visually distinguishable from surrounding text by more than color',
    help: 'Links in text should have underline or other non-color visual indicator',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color',
  },
  all: [],
  any: ['prism-link-distinguishable-check'],
  none: [],
};

export const linkDistinguishableCheck = {
  id: 'prism-link-distinguishable-check',
  evaluate(node: HTMLElement): boolean {
    const parent = node.parentElement;
    if (!parent) return true;
    const parentText = parent.textContent?.trim() || '';
    const nodeText = node.textContent?.trim() || '';
    if (!nodeText || parentText === nodeText) return true;
    const style = getComputedStyle(node);
    const textDec = style.textDecorationLine || style.textDecoration || '';
    if (textDec.includes('underline')) return true;
    const borderBottom = parseFloat(style.borderBottomWidth);
    if (borderBottom > 0 && style.borderBottomStyle !== 'none') return true;
    const outline = parseFloat(style.outlineWidth);
    if (outline > 0 && style.outlineStyle !== 'none') return true;
    const bgColor = style.backgroundColor;
    if (
      bgColor &&
      bgColor !== 'rgba(0, 0, 0, 0)' &&
      bgColor !== 'transparent'
    ) {
      const parentBg = getComputedStyle(parent).backgroundColor;
      if (bgColor !== parentBg) return true;
    }
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const parentWeight = parseInt(getComputedStyle(parent).fontWeight, 10) || 400;
    if (fontWeight - parentWeight >= 300) return true;
    return false;
  },
  metadata: {
    impact: 'serious',
    messages: {
      pass: 'Link is visually distinguishable from surrounding text',
      fail: 'Link relies on color alone to be distinguished from surrounding text',
    },
  },
};
