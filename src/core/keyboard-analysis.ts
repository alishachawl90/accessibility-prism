import type { KeyboardIssue, ComponentCluster, ComponentTabFlow } from './types';
import { KB_TYPE_PRIORITY } from './types';

const focusableSelectors = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[onclick]',
  '[tabindex]',
  '[contenteditable="true"]'
];

function isExtensionElement(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

export function isFocusable(el: Element): boolean {
  if (el.matches('a[href], button, input, select, textarea')) return true;
  if (el.hasAttribute('tabindex')) return el.getAttribute('tabindex') !== '-1';
  return false;
}

function isVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  const cs = window.getComputedStyle(el);
  if (cs.display === 'none' || cs.visibility === 'hidden') return false;
  return true;
}

function isNativelyInteractive(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  if (['a', 'button', 'input', 'select', 'textarea'].includes(tag)) return true;
  if (el.getAttribute('contenteditable') === 'true') return true;
  return false;
}

function hasInteractiveRole(el: Element): boolean {
  const role = el.getAttribute('role');
  return !!role && ['button', 'link', 'tab', 'menuitem', 'menuitemcheckbox',
    'menuitemradio', 'option', 'switch', 'checkbox', 'radio',
    'combobox', 'textbox', 'slider', 'spinbutton', 'searchbox'].includes(role);
}

function getAccessibleName(el: Element): string {
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim();

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl?.textContent?.trim()) return labelEl.textContent.trim();
  }

  const title = el.getAttribute('title');
  if (title?.trim()) return title.trim();

  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
    const id = el.getAttribute('id');
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label?.textContent?.trim()) return label.textContent.trim();
    }
    const placeholder = el.getAttribute('placeholder');
    if (placeholder?.trim()) return placeholder.trim();
  }

  if (el.tagName === 'IMG') {
    const alt = el.getAttribute('alt');
    if (alt?.trim()) return alt.trim();
  }

  const imgInside = el.querySelector('img[alt]');
  if (imgInside) {
    const alt = imgInside.getAttribute('alt');
    if (alt?.trim()) return alt.trim();
  }

  const text = el.textContent?.trim();
  if (text) return text;

  return '';
}

export function analyzeKeyboardFlow(): KeyboardIssue[] {
  const issues: KeyboardIssue[] = [];

  checkSkipLink(issues);
  checkNotFocusable(issues);
  checkPositiveTabindex(issues);
  checkMouseOnlyHandlers(issues);
  checkTabVisualMismatch(issues);
  checkMissingFocusStyles(issues);
  checkFocusTrap(issues);
  checkPhantomFocus(issues);
  checkFocusableInAriaHidden(issues);
  checkNoAccessibleName(issues);
  checkDoubleTabStop(issues);

  issues.sort((a, b) => a.priority - b.priority);

  return issues;
}

function checkSkipLink(issues: KeyboardIssue[]) {
  const tabOrder = getTabOrder();
  const first3 = tabOrder.slice(0, 3);
  const hasSkip = first3.some(el => {
    if (el.tagName !== 'A') return false;
    const href = el.getAttribute('href') || '';
    const text = (el.textContent || '').toLowerCase();
    return /^#(main|content|maincontent|skip)/.test(href) || /skip/i.test(text);
  });

  if (!hasSkip && tabOrder.length > 3) {
    issues.push({
      element: document.body,
      type: 'missing-skip-link',
      severity: 'warning',
      priority: KB_TYPE_PRIORITY['missing-skip-link'],
      description: 'No "Skip to main content" link found among the first focusable elements. Keyboard users must tab through all navigation before reaching content.',
    });
  }
}

function checkNotFocusable(issues: KeyboardIssue[]) {
  const interactiveElements = Array.from(document.querySelectorAll(focusableSelectors.join(', ')));
  interactiveElements.forEach(el => {
    if (isExtensionElement(el)) return;
    if (!isVisible(el)) return;
    if (!isFocusable(el)) {
      issues.push({
        element: el,
        type: 'not-focusable',
        severity: 'error',
        priority: KB_TYPE_PRIORITY['not-focusable'],
        description: 'This interactive element cannot be reached via keyboard Tab navigation.',
      });
    }
  });
}

function checkPositiveTabindex(issues: KeyboardIssue[]) {
  const allTabindexed = Array.from(document.querySelectorAll('[tabindex]'));
  allTabindexed.forEach(el => {
    if (isExtensionElement(el)) return;
    if (!isVisible(el)) return;
    const ti = parseInt(el.getAttribute('tabindex') || '0', 10);
    if (ti > 0) {
      issues.push({
        element: el,
        type: 'positive-tabindex',
        severity: 'warning',
        priority: KB_TYPE_PRIORITY['positive-tabindex'],
        description: `Element has tabindex="${ti}". Positive tabindex values disrupt natural tab order and are an anti-pattern.`,
      });
    }
  });
}

function checkMouseOnlyHandlers(issues: KeyboardIssue[]) {
  const mouseOnly = Array.from(document.querySelectorAll('div[onclick], span[onclick]'));
  mouseOnly.forEach(el => {
    if (isExtensionElement(el)) return;
    if (!isVisible(el)) return;
    const hasRole = el.hasAttribute('role');
    const hasTabindex = el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
    if (!hasRole || !hasTabindex) {
      issues.push({
        element: el,
        type: 'mouse-only-handler',
        severity: 'error',
        priority: KB_TYPE_PRIORITY['mouse-only-handler'],
        description: 'This element has an onclick handler but lacks role="button" and/or tabindex, making it unreachable to keyboard and screen reader users.',
      });
    }
  });
}

function checkTabVisualMismatch(issues: KeyboardIssue[]) {
  const tabOrder = getTabOrder();
  const THRESHOLD_PX = 200;

  for (let i = 0; i < tabOrder.length - 1; i++) {
    const curr = tabOrder[i].getBoundingClientRect();
    const next = tabOrder[i + 1].getBoundingClientRect();

    if (next.top < curr.top - THRESHOLD_PX) {
      issues.push({
        element: tabOrder[i + 1],
        type: 'tab-visual-mismatch',
        severity: 'warning',
        priority: KB_TYPE_PRIORITY['tab-visual-mismatch'],
        description: `Tab order jumps backward on the page: this element (position ~${Math.round(next.top)}px from top) follows an element at ~${Math.round(curr.top)}px. Users may be disoriented.`,
      });
    }
  }
}

function checkMissingFocusStyles(issues: KeyboardIssue[]) {
  const tabOrder = getTabOrder();
  const sampled = tabOrder.slice(0, 30);

  sampled.forEach(el => {
    const cs = window.getComputedStyle(el);
    const outlineStyle = cs.outlineStyle;
    const outlineWidth = parseFloat(cs.outlineWidth) || 0;

    if (outlineStyle === 'none' || outlineWidth === 0) {
      const hasShadow = cs.boxShadow !== 'none' && cs.boxShadow !== '';
      const hasBorder = cs.borderStyle !== 'none' && cs.borderStyle !== '';
      if (!hasShadow && !hasBorder) {
        issues.push({
          element: el,
          type: 'missing-focus-style',
          severity: 'info',
          priority: KB_TYPE_PRIORITY['missing-focus-style'],
          description: 'This element may lack visible focus indicator. Outline is suppressed and no compensating box-shadow or border was detected.',
        });
      }
    }
  });
}

function checkFocusTrap(issues: KeyboardIssue[]) {
  const openDialogs = Array.from(document.querySelectorAll('dialog[open], [role="dialog"]'));
  openDialogs.forEach(dialog => {
    const isOpen = dialog.tagName === 'DIALOG'
      ? (dialog as HTMLDialogElement).open
      : !dialog.hasAttribute('aria-hidden') || dialog.getAttribute('aria-hidden') !== 'true';

    if (!isOpen) return;

    const focusableInside = dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableInside.length === 0) return;

    const allFocusable = document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    let outsideCount = 0;
    allFocusable.forEach(el => {
      if (!dialog.contains(el) && isVisible(el)) {
        const parent = el.closest('[inert], [aria-hidden="true"]');
        if (!parent) outsideCount++;
      }
    });

    if (outsideCount > 0) {
      issues.push({
        element: dialog,
        type: 'focus-trap-missing',
        severity: 'error',
        priority: KB_TYPE_PRIORITY['focus-trap-missing'],
        description: `An open dialog/modal was found with ${outsideCount} focusable element(s) outside it that are not inert or hidden.`,
      });
    }
  });
}

function checkPhantomFocus(issues: KeyboardIssue[]) {
  const focusable = Array.from(document.querySelectorAll('[tabindex="0"]'));
  focusable.forEach(el => {
    if (isExtensionElement(el)) return;
    if (!isVisible(el)) return;
    if (isNativelyInteractive(el)) return;
    if (hasInteractiveRole(el)) return;

    const hasOnclick = el.hasAttribute('onclick');
    const hasKeyHandler = el.hasAttribute('onkeydown') || el.hasAttribute('onkeypress') || el.hasAttribute('onkeyup');

    if (hasOnclick || hasKeyHandler) return;

    const clickableAncestor = el.closest('a[href], button, [onclick], [role="link"], [role="button"]');

    if (clickableAncestor) {
      issues.push({
        element: el,
        type: 'redundant-focus',
        severity: 'warning',
        priority: KB_TYPE_PRIORITY['redundant-focus'],
        description: `This element has tabindex="0" but no keyboard handler, and sits inside a clickable ${clickableAncestor.tagName.toLowerCase()}. Remove tabindex or move it to the interactive ancestor.`,
      });
    } else {
      issues.push({
        element: el,
        type: 'phantom-focus',
        severity: 'error',
        priority: KB_TYPE_PRIORITY['phantom-focus'],
        description: `This non-interactive element has tabindex="0" but no click or keyboard handler. Keyboard users will tab to it and pressing Enter does nothing.`,
      });
    }
  });
}

function checkFocusableInAriaHidden(issues: KeyboardIssue[]) {
  const selectors = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const ariaHiddenRoots = Array.from(document.querySelectorAll('[aria-hidden="true"]'));

  ariaHiddenRoots.forEach(root => {
    if (isExtensionElement(root)) return;
    const focusableInside = Array.from(root.querySelectorAll(selectors));
    focusableInside.forEach(el => {
      if (!isVisible(el)) return;
      if ((el as HTMLInputElement).disabled) return;
      issues.push({
        element: el,
        type: 'focusable-in-aria-hidden',
        severity: 'error',
        priority: KB_TYPE_PRIORITY['focusable-in-aria-hidden'],
        description: 'This focusable element is inside an aria-hidden="true" container. It will receive focus but be invisible to screen readers.',
      });
    });
  });
}

function checkNoAccessibleName(issues: KeyboardIssue[]) {
  const tabOrder = getTabOrder();
  tabOrder.forEach(el => {
    if (isExtensionElement(el)) return;
    const name = getAccessibleName(el);
    if (!name) {
      issues.push({
        element: el,
        type: 'no-accessible-name',
        severity: 'error',
        priority: KB_TYPE_PRIORITY['no-accessible-name'],
        description: 'This focusable element has no accessible name. Screen readers will announce its role with no label.',
      });
    }
  });
}

function checkDoubleTabStop(issues: KeyboardIssue[]) {
  const tabOrder = getTabOrder();
  tabOrder.forEach(el => {
    if (isExtensionElement(el)) return;
    if (!isNativelyInteractive(el)) return;

    const parent = el.parentElement;
    if (!parent) return;

    if (parent.matches('a[href], button') && isFocusable(parent) && parent !== el) {
      issues.push({
        element: el,
        type: 'double-tab-stop',
        severity: 'warning',
        priority: KB_TYPE_PRIORITY['double-tab-stop'],
        description: `This ${el.tagName.toLowerCase()} is nested inside a focusable ${parent.tagName.toLowerCase()}, creating a redundant tab stop.`,
      });
    }
  });
}

export function getTabOrder(): Element[] {
  const allFocusable = Array.from(
    document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')
  ).filter(el => {
    if (isExtensionElement(el)) return false;
    if (!isVisible(el)) return false;
    if (el.hasAttribute('tabindex') && el.getAttribute('tabindex') === '-1') return false;
    if ((el as HTMLInputElement).disabled) return false;
    return true;
  });

  const withPositiveTabindex: { el: Element; ti: number }[] = [];
  const naturalOrder: Element[] = [];

  allFocusable.forEach(el => {
    const ti = parseInt(el.getAttribute('tabindex') || '0', 10);
    if (ti > 0) {
      withPositiveTabindex.push({ el, ti });
    } else {
      naturalOrder.push(el);
    }
  });

  withPositiveTabindex.sort((a, b) => a.ti - b.ti);
  return [...withPositiveTabindex.map(item => item.el), ...naturalOrder];
}

export function analyzeComponentTabFlows(
  components: Map<string, ComponentCluster>,
  globalTabOrder: Element[],
  allIssues: KeyboardIssue[]
): ComponentTabFlow[] {
  const flows: ComponentTabFlow[] = [];

  components.forEach(cluster => {
    const instances = cluster.elements.map(root => {
      const focusable = globalTabOrder.filter(el => root.contains(el));
      if (focusable.length === 0) return null;

      const firstIdx = globalTabOrder.indexOf(focusable[0]);
      const lastIdx = globalTabOrder.indexOf(focusable[focusable.length - 1]);

      const entryFrom = firstIdx > 0 ? globalTabOrder[firstIdx - 1] : null;
      const exitTo = lastIdx < globalTabOrder.length - 1 ? globalTabOrder[lastIdx + 1] : null;

      const issues = allIssues.filter(issue => root.contains(issue.element));

      return { root, focusable, entryFrom, exitTo, issues };
    }).filter((inst): inst is NonNullable<typeof inst> => inst !== null);

    if (instances.length > 0) {
      flows.push({ component: cluster, instances });
    }
  });

  flows.sort((a, b) => {
    const aTotal = a.instances.reduce((s, i) => s + i.focusable.length, 0);
    const bTotal = b.instances.reduce((s, i) => s + i.focusable.length, 0);
    return bTotal - aTotal;
  });

  return flows;
}
