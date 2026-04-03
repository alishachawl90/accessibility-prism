export const presentationalChildrenRule = {
  id: 'prism-presentational-children',
  selector:
    '[role="button"], [role="img"], [role="progressbar"], [role="slider"], [role="checkbox"], [role="switch"], [role="math"], [role="separator"], [role="scrollbar"]',
  tags: ['wcag2a', 'wcag412', 'prism-custom'],
  metadata: {
    description:
      'Elements whose role makes children presentational should not contain interactive content',
    help: 'Children of presentational-role elements lose their semantic meaning',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
  },
  all: [],
  any: ['prism-presentational-children-check'],
  none: [],
};

export const presentationalChildrenCheck = {
  id: 'prism-presentational-children-check',
  evaluate(node: HTMLElement): boolean {
    const interactive = node.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [role="button"], [role="link"], [role="textbox"], [role="combobox"]',
    );
    // Filter out the node itself
    for (const child of interactive) {
      if (
        child !== node &&
        !child.closest('[role="presentation"]') &&
        !child.closest('[role="none"]')
      ) {
        return false;
      }
    }
    return true;
  },
  metadata: {
    impact: 'serious',
    messages: {
      pass: 'No interactive children found in presentational-role element',
      fail: 'Presentational-role element contains interactive children that lose their semantics',
    },
  },
};
