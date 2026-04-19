import type { AccNameEntry, AccNameResult } from './types';
import { computeAccessibleName as w3cName, computeAccessibleDescription as w3cDesc } from 'dom-accessibility-api';

const IMPLICIT_ROLES: Record<string, string> = {
  a: 'link', button: 'button', h1: 'heading', h2: 'heading', h3: 'heading',
  h4: 'heading', h5: 'heading', h6: 'heading', img: 'img', input: 'textbox',
  select: 'listbox', textarea: 'textbox', nav: 'navigation', main: 'main',
  header: 'banner', footer: 'contentinfo', aside: 'complementary', form: 'form',
  section: 'region', table: 'table', ul: 'list', ol: 'list', li: 'listitem',
  dialog: 'dialog', details: 'group', summary: 'button', meter: 'meter',
  progress: 'progressbar', output: 'status', fieldset: 'group',
};

const INPUT_ROLES: Record<string, string> = {
  checkbox: 'checkbox', radio: 'radio', range: 'slider', search: 'searchbox',
  email: 'textbox', tel: 'textbox', url: 'textbox', number: 'spinbutton',
  submit: 'button', reset: 'button', button: 'button', image: 'button',
};

function getImplicitRole(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (tag === 'input') {
    const type = (el as HTMLInputElement).type || 'text';
    return INPUT_ROLES[type] || 'textbox';
  }
  if (tag === 'a' && !el.hasAttribute('href')) return 'generic';
  return IMPLICIT_ROLES[tag] || '';
}

function computeRole(el: Element): string {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit.split(/\s+/)[0];
  return getImplicitRole(el);
}


function computeAccessibleName(el: Element): string {
  try {
    const name = w3cName(el).trim();
    return name.length > 120 ? name.substring(0, 117) + '...' : name;
  } catch {
    // Fallback for edge cases (detached nodes, etc.)
    const text = (el.textContent || '').trim();
    return text.length > 120 ? text.substring(0, 117) + '...' : text;
  }
}

function computeAccessibleDescription(el: Element): string {
  try {
    return w3cDesc(el).trim();
  } catch {
    return '';
  }
}

function getStates(el: Element): string[] {
  const states: string[] = [];

  if (el.getAttribute('aria-expanded') === 'true') states.push('expanded');
  else if (el.getAttribute('aria-expanded') === 'false') states.push('collapsed');
  if (el.getAttribute('aria-checked') === 'true') states.push('checked');
  else if (el.getAttribute('aria-checked') === 'mixed') states.push('mixed');
  if (el.getAttribute('aria-selected') === 'true') states.push('selected');
  if (el.getAttribute('aria-pressed') === 'true') states.push('pressed');
  if (el.getAttribute('aria-disabled') === 'true' || (el as HTMLElement).hasAttribute?.('disabled')) states.push('disabled');
  if (el.getAttribute('aria-required') === 'true' || (el as HTMLElement).hasAttribute?.('required')) states.push('required');
  if (el.getAttribute('aria-hidden') === 'true') states.push('hidden');
  if (el.getAttribute('aria-invalid') === 'true') states.push('invalid');
  if (el.getAttribute('aria-busy') === 'true') states.push('busy');
  if (el.getAttribute('aria-current')) states.push('current=' + el.getAttribute('aria-current'));
  if (el.getAttribute('aria-readonly') === 'true') states.push('readonly');

  const level = el.getAttribute('aria-level');
  if (level) states.push('level ' + level);
  else if (/^h[1-6]$/i.test(el.tagName)) states.push('level ' + el.tagName[1]);

  return states;
}

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function isSignificant(el: Element): boolean {
  const tag = el.tagName.toLowerCase();
  const role = computeRole(el);

  if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template' || tag === 'br') return false;

  if (role) return true;

  if (['a', 'button', 'input', 'select', 'textarea', 'img', 'video', 'audio', 'svg',
       'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'nav', 'main', 'header', 'footer',
       'aside', 'form', 'table', 'dialog', 'details', 'summary', 'fieldset',
       'iframe', 'object', 'embed', 'area', 'meter', 'progress', 'output'].includes(tag)) return true;

  if (el.hasAttribute('tabindex')) return true;

  return false;
}

/**
 * Mirrors browser AX-tree pruning: returns false if the element (or any ancestor)
 * is hidden via display:none, visibility:hidden/collapse, the `hidden` attribute,
 * or `inert`. Screen readers (JAWS, NVDA, VoiceOver, ChromeVox) all skip these
 * because the browser excludes them from the accessibility tree.
 *
 * Intentionally allows opacity:0 and off-screen positioning (left:-9999px etc.)
 * — these are the standard "visually-hidden / sr-only" patterns and remain in
 * the AX tree, so screen readers do announce them.
 */
function isVisible(el: Element): boolean {
  // Prefer the native API when available — it implements the same pruning rules
  // browsers use to build the accessibility tree, including ancestor checks.
  const elAny = el as Element & {
    checkVisibility?: (opts?: { checkOpacity?: boolean; checkVisibilityCSS?: boolean; visibilityProperty?: boolean; contentVisibilityAuto?: boolean }) => boolean;
  };
  if (typeof elAny.checkVisibility === 'function') {
    return elAny.checkVisibility({
      checkOpacity: false,
      checkVisibilityCSS: true,
      visibilityProperty: true,
      contentVisibilityAuto: true,
    });
  }

  // Fallback: walk up the ancestor chain checking display, visibility, hidden, inert.
  let node: Element | null = el;
  while (node && node.nodeType === 1) {
    if ((node as HTMLElement).hasAttribute('hidden')) return false;
    if ((node as HTMLElement).hasAttribute('inert')) return false;
    const style = getComputedStyle(node);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    node = node.parentElement;
  }
  return true;
}

export type AccNameSeverity = 'error' | 'warning' | 'pass';

function evaluateEntry(entry: AccNameEntry): AccNameSeverity {
  if (entry.role === 'presentation' || entry.role === 'none') return 'pass';
  if (entry.ariaHidden) return 'pass';

  // AX-tree sourced entries have no DOM element reference — evaluate by role only.
  if (!entry.element) {
    const needsNameAx = ['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio',
      'slider', 'spinbutton', 'combobox', 'listbox', 'heading', 'img'];
    if (needsNameAx.includes(entry.role) && !entry.name) return 'error';
    return 'pass';
  }

  const tag = entry.element.tagName.toLowerCase();
  const needsName = ['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio',
    'slider', 'spinbutton', 'combobox', 'listbox', 'switch', 'tab', 'treeitem',
    'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'img', 'heading',
    'navigation', 'main', 'complementary', 'banner', 'contentinfo', 'form',
    'region', 'dialog', 'alertdialog', 'progressbar', 'meter', 'status'];

  if (tag === 'img' && entry.element.getAttribute('alt') === '') return 'pass';

  if (needsName.includes(entry.role) && !entry.name) return 'error';
  if (!entry.name && entry.element.hasAttribute('tabindex')) return 'warning';

  return 'pass';
}

function buildAnnouncement(entry: AccNameEntry): string {
  const parts: string[] = [];
  if (entry.name) parts.push(`"${entry.name}"`);
  if (entry.role && entry.role !== 'generic' && entry.role !== 'presentation' && entry.role !== 'none') {
    parts.push(entry.role);
  }
  if (entry.states.length > 0) parts.push(entry.states.join(', '));
  if (entry.description) parts.push(`— ${entry.description}`);
  return parts.join(', ') || '(empty announcement)';
}

// Tags that carry visible text content and should be read aloud by a screen reader
// even though they have no interactive or landmark role.
const SR_TEXT_TAGS = new Set(['p', 'li', 'dt', 'dd', 'blockquote', 'figcaption', 'caption']);

function isSignificantForSr(el: Element): boolean {
  if (isSignificant(el)) return true;
  const tag = el.tagName.toLowerCase();
  if (SR_TEXT_TAGS.has(tag)) {
    return (el.textContent || '').trim().length > 0;
  }
  return false;
}

/**
 * Builds an element list that mirrors what a screen reader actually traverses —
 * includes plain text containers (p, li, etc.) in addition to the semantic/interactive
 * elements captured by analyzeAccessibleNames().
 */
export function analyzeForSrWalkthrough(root?: Element | Document): AccNameResult {
  const entries: AccNameEntry[] = [];
  const selector = [
    'a, button, input, select, textarea, img, svg[role="img"]',
    'h1, h2, h3, h4, h5, h6',
    'p, li, blockquote, figcaption, dt, dd, caption',
    'nav, main, header, footer, aside, form, section, table, dialog',
    'details, summary, fieldset, iframe, object, embed, area, meter, progress, output',
    '[role], [tabindex], [aria-label], [aria-labelledby]',
  ].join(', ');

  const elements = (root ?? document).querySelectorAll(selector);
  elements.forEach(el => {
    if (isExtension(el) || !isSignificantForSr(el)) return;
    if (!isVisible(el)) return;

    // Real screen readers (JAWS, NVDA, VoiceOver, ChromeVox) skip aria-hidden subtrees
    // because the browser excludes them from the accessibility tree. Mirror that here.
    // (analyzeAccessibleNames() below intentionally keeps these so the audit can flag
    // aria-hidden focusable elements as a violation — different use case.)
    const ariaHidden = el.getAttribute('aria-hidden') === 'true' || !!el.closest('[aria-hidden="true"]');
    if (ariaHidden) return;

    const role = computeRole(el);
    // W3C AccName algorithm returns empty for text-container elements like <p>, <li>, <blockquote>.
    // For the SR walkthrough (NOT the accessible names audit), fall back to textContent so that
    // plain prose is included in the step list — screen readers do read this content.
    let name = computeAccessibleName(el);
    const tag = el.tagName.toLowerCase();
    if (!name && SR_TEXT_TAGS.has(tag)) {
      name = (el.textContent || '').trim();
      if (name.length > 120) name = name.substring(0, 117) + '…';
    }
    const description = computeAccessibleDescription(el);
    const states = getStates(el);

    const entry: AccNameEntry = { element: el, role, name, description, states, ariaHidden: false };
    entry.severity = evaluateEntry(entry);
    entry.announcement = buildAnnouncement(entry);
    entries.push(entry);
  });

  const issues = entries.filter(e => e.severity === 'error').length;
  const warnings = entries.filter(e => e.severity === 'warning').length;

  return { entries, issueCount: issues, warningCount: warnings };
}

export function analyzeAccessibleNames(root?: Element | Document): AccNameResult {
  const entries: AccNameEntry[] = [];
  const selector = 'a, button, input, select, textarea, img, svg[role="img"], h1, h2, h3, h4, h5, h6, nav, main, header, footer, aside, form, section, table, dialog, details, summary, fieldset, iframe, object, embed, area, meter, progress, output, [role], [tabindex], [aria-label], [aria-labelledby]';

  const elements = (root ?? document).querySelectorAll(selector);
  elements.forEach(el => {
    if (isExtension(el) || !isSignificant(el)) return;
    const visible = isVisible(el);
    const ariaHidden = el.getAttribute('aria-hidden') === 'true' || !!el.closest('[aria-hidden="true"]');

    if (!visible && !ariaHidden) return;

    const role = computeRole(el);
    const name = computeAccessibleName(el);
    const description = computeAccessibleDescription(el);
    const states = getStates(el);

    const entry: AccNameEntry = { element: el, role, name, description, states, ariaHidden };
    entry.severity = evaluateEntry(entry);
    entry.announcement = buildAnnouncement(entry);
    entries.push(entry);
  });

  const issues = entries.filter(e => e.severity === 'error').length;
  const warnings = entries.filter(e => e.severity === 'warning').length;

  return { entries, issueCount: issues, warningCount: warnings };
}
