import type { AriaIssue, AriaValidationResult } from './types';

const VALID_ROLES = new Set([
  'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
  'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition',
  'dialog', 'directory', 'document', 'feed', 'figure', 'form', 'generic', 'grid',
  'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox', 'listitem',
  'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
  'menuitemradio', 'meter', 'navigation', 'none', 'note', 'option', 'presentation',
  'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
  'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status',
  'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term', 'textbox', 'timer',
  'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem',
]);

const REQUIRED_PROPS: Record<string, string[]> = {
  checkbox: ['aria-checked'],
  combobox: ['aria-expanded'],
  heading: ['aria-level'],
  meter: ['aria-valuenow'],
  option: ['aria-selected'],
  radio: ['aria-checked'],
  scrollbar: ['aria-controls', 'aria-valuenow'],
  separator: [],
  slider: ['aria-valuenow'],
  spinbutton: ['aria-valuenow'],
  switch: ['aria-checked'],
};

const HEADINGS_IMPLICIT_LEVEL: Record<string, string> = {
  h1: '1', h2: '2', h3: '3', h4: '4', h5: '5', h6: '6',
};

const REDUNDANT_ROLES: Record<string, string> = {
  button: 'button', a: 'link', nav: 'navigation', main: 'main',
  header: 'banner', footer: 'contentinfo', aside: 'complementary',
  form: 'form', table: 'table', ul: 'list', ol: 'list', li: 'listitem',
  img: 'img', dialog: 'dialog', summary: 'button', input: 'textbox',
  select: 'listbox', textarea: 'textbox', details: 'group',
  fieldset: 'group', meter: 'meter', progress: 'progressbar', output: 'status',
  section: 'region', article: 'article',
};

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function getFocusable(root: Element): Element[] {
  const sel = 'a[href], button, input, select, textarea, [tabindex]';
  return Array.from(root.querySelectorAll(sel)).filter(el => {
    const ti = el.getAttribute('tabindex');
    return ti !== '-1' && !(el as HTMLElement).hidden;
  });
}

export function validateAria(root?: Element | Document): AriaValidationResult {
  const issues: AriaIssue[] = [];
  const all = (root ?? document).querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby], [aria-controls], [aria-owns], [aria-expanded], [aria-checked], [aria-hidden], [aria-live], [aria-valuenow], [aria-required], [aria-invalid], [aria-haspopup], [aria-current], [aria-selected], [aria-pressed], [aria-disabled]');

  all.forEach(el => {
    if (isExtension(el)) return;

    const role = el.getAttribute('role');
    const tag = el.tagName.toLowerCase();

    // 1. Invalid role
    if (role) {
      const roles = role.split(/\s+/);
      roles.forEach(r => {
        if (!VALID_ROLES.has(r)) {
          issues.push({
            element: el, type: 'invalid-role', severity: 'error',
            description: `Invalid ARIA role "${r}". Not a recognized WAI-ARIA role.`,
          });
        }
      });
    }

    // 2. Redundant role
    if (role && REDUNDANT_ROLES[tag] === role) {
      issues.push({
        element: el, type: 'redundant-role', severity: 'info',
        description: `Redundant role="${role}" on <${tag}>. This element already has this role implicitly.`,
      });
    }

    // 3. Missing required properties
    const effectiveRole = role?.split(/\s+/)[0] || '';
    if (effectiveRole && REQUIRED_PROPS[effectiveRole]) {
      REQUIRED_PROPS[effectiveRole].forEach(prop => {
        if (effectiveRole === 'heading' && !el.hasAttribute(prop) && HEADINGS_IMPLICIT_LEVEL[tag]) return;
        if (!el.hasAttribute(prop)) {
          issues.push({
            element: el, type: 'missing-required-prop', severity: 'error',
            description: `Role "${effectiveRole}" requires ${prop}, but it is missing.`,
          });
        }
      });
    }

    // 4. Broken aria-labelledby / aria-describedby / aria-controls / aria-owns references
    ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-errormessage', 'aria-flowto'].forEach(attr => {
      const val = el.getAttribute(attr);
      if (!val) return;
      val.split(/\s+/).forEach(id => {
        if (!document.getElementById(id)) {
          issues.push({
            element: el, type: 'broken-reference', severity: 'error',
            description: `${attr}="${id}" references an element that does not exist in the DOM.`,
          });
        }
      });
    });

    // 5. aria-hidden on focusable element
    if (el.getAttribute('aria-hidden') === 'true') {
      const focusable = getFocusable(el);
      const selfFocusable = el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
      if (selfFocusable || focusable.length > 0) {
        issues.push({
          element: el, type: 'hidden-focusable', severity: 'error',
          description: `aria-hidden="true" hides this from screen readers, but it${selfFocusable ? '' : ' contains elements that'} can receive keyboard focus. Users will focus invisible content.`,
        });
      }
    }

    // 6. role="presentation"/"none" on focusable or elements with global ARIA
    if (role === 'presentation' || role === 'none') {
      const hasFocus = el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
      const focusTag = ['a', 'button', 'input', 'select', 'textarea'].includes(tag);
      if (hasFocus || focusTag) {
        issues.push({
          element: el, type: 'presentation-conflict', severity: 'warning',
          description: `role="${role}" removes semantics, but <${tag}> is focusable. The presentation role will be ignored by browsers, causing confusion.`,
        });
      }
    }

    // 7. Invalid aria-* attribute values
    const boolAttrs = ['aria-hidden', 'aria-disabled', 'aria-required', 'aria-readonly', 'aria-busy', 'aria-atomic', 'aria-modal'];
    boolAttrs.forEach(attr => {
      const val = el.getAttribute(attr);
      if (val && val !== 'true' && val !== 'false') {
        issues.push({
          element: el, type: 'invalid-value', severity: 'warning',
          description: `${attr}="${val}" is not a valid boolean value. Use "true" or "false".`,
        });
      }
    });

    const tristate = el.getAttribute('aria-checked');
    if (tristate && !['true', 'false', 'mixed'].includes(tristate)) {
      issues.push({
        element: el, type: 'invalid-value', severity: 'warning',
        description: `aria-checked="${tristate}" is invalid. Use "true", "false", or "mixed".`,
      });
    }

    // 8. Tabindex > 0
    const tabindex = el.getAttribute('tabindex');
    if (tabindex && parseInt(tabindex, 10) > 0) {
      issues.push({
        element: el, type: 'positive-tabindex', severity: 'warning',
        description: `tabindex="${tabindex}" disrupts natural tab order. Use tabindex="0" or "-1" instead.`,
      });
    }
  });

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  return { issues, errorCount: errors, warningCount: warnings };
}
