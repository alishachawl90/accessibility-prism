const REQUIRED_PARENTS: Record<string, string[]> = {
  listitem: ['list', 'directory'],
  menuitem: ['menu', 'menubar'],
  menuitemcheckbox: ['menu', 'menubar'],
  menuitemradio: ['menu', 'menubar'],
  tab: ['tablist'],
  treeitem: ['tree', 'group'],
  option: ['listbox', 'combobox', 'group'],
  row: ['table', 'grid', 'treegrid', 'rowgroup'],
  cell: ['row'],
  gridcell: ['row'],
  columnheader: ['row'],
  rowheader: ['row'],
  rowgroup: ['table', 'grid', 'treegrid'],
};

export const ariaRoleNestingRule = {
  id: 'prism-aria-nesting',
  selector: '[role]',
  tags: ['wcag2a', 'wcag412', 'prism-custom'],
  metadata: {
    description: 'ARIA roles must be nested according to the WAI-ARIA specification',
    help: 'Child roles must be contained within their required parent roles',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value',
  },
  all: [],
  any: ['prism-aria-nesting-check'],
  none: [],
};

export const ariaRoleNestingCheck = {
  id: 'prism-aria-nesting-check',
  evaluate(node: HTMLElement): boolean {
    const role = node.getAttribute('role');
    if (!role) return true;
    const requiredParents = REQUIRED_PARENTS[role];
    if (!requiredParents) return true;
    let parent = node.parentElement;
    while (parent) {
      const parentRole = parent.getAttribute('role') || getImplicitRole(parent);
      if (parentRole && requiredParents.includes(parentRole)) return true;
      parent = parent.parentElement;
    }
    return false;
  },
  metadata: {
    impact: 'critical',
    messages: {
      pass: 'ARIA role is properly nested within a valid parent role',
      fail: 'ARIA role is not nested within its required parent role',
    },
  },
};

function getImplicitRole(el: HTMLElement): string | null {
  const tag = el.tagName.toLowerCase();
  const map: Record<string, string> = {
    ul: 'list',
    ol: 'list',
    menu: 'menu',
    table: 'table',
    tr: 'row',
    thead: 'rowgroup',
    tbody: 'rowgroup',
    tfoot: 'rowgroup',
    td: 'cell',
    th: 'columnheader',
    select: 'listbox',
    nav: 'navigation',
  };
  return map[tag] || null;
}
