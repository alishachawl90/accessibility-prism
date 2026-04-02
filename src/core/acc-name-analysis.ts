import type { AccNameEntry, AccNameResult } from './types';

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

function getTextFromLabelledBy(el: Element): string | null {
  const ids = el.getAttribute('aria-labelledby');
  if (!ids) return null;
  const parts = ids.split(/\s+/).map(id => {
    const ref = document.getElementById(id);
    return ref ? (ref.textContent || '').trim() : '';
  }).filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

function getAssociatedLabel(el: Element): string | null {
  if (!(el instanceof HTMLElement)) return null;
  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label) return (label.textContent || '').trim();
  }
  const parent = el.closest('label');
  if (parent) {
    const clone = parent.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input, select, textarea').forEach(c => c.remove());
    const text = (clone.textContent || '').trim();
    if (text) return text;
  }
  return null;
}

function computeAccessibleName(el: Element): string {
  const labelledBy = getTextFromLabelledBy(el);
  if (labelledBy) return labelledBy;

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel?.trim()) return ariaLabel.trim();

  const tag = el.tagName.toLowerCase();

  if (['input', 'select', 'textarea'].includes(tag)) {
    const label = getAssociatedLabel(el);
    if (label) return label;
    const placeholder = el.getAttribute('placeholder');
    if (placeholder?.trim()) return placeholder.trim();
  }

  if (tag === 'img' || tag === 'area') {
    const alt = el.getAttribute('alt');
    if (alt?.trim()) return alt.trim();
  }

  if (tag === 'input' && ['submit', 'reset', 'button', 'image'].includes((el as HTMLInputElement).type)) {
    const val = (el as HTMLInputElement).value;
    if (val?.trim()) return val.trim();
  }

  if (['a', 'button', 'summary', 'legend', 'caption', 'figcaption', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    const text = (el.textContent || '').trim();
    if (text) return text.length > 80 ? text.substring(0, 77) + '...' : text;
  }

  const title = el.getAttribute('title');
  if (title?.trim()) return title.trim();

  if (tag === 'fieldset') {
    const legend = el.querySelector('legend');
    if (legend?.textContent?.trim()) return legend.textContent.trim();
  }

  if (tag === 'table') {
    const caption = el.querySelector('caption');
    if (caption?.textContent?.trim()) return caption.textContent.trim();
  }

  if (tag === 'figure') {
    const figcaption = el.querySelector('figcaption');
    if (figcaption?.textContent?.trim()) return figcaption.textContent.trim();
  }

  const text = (el.textContent || '').trim();
  if (text) return text.length > 80 ? text.substring(0, 77) + '...' : text;

  return '';
}

function computeAccessibleDescription(el: Element): string {
  const describedBy = el.getAttribute('aria-describedby');
  if (!describedBy) return '';
  const parts = describedBy.split(/\s+/).map(id => {
    const ref = document.getElementById(id);
    return ref ? (ref.textContent || '').trim() : '';
  }).filter(Boolean);
  return parts.join(' ');
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

function isVisible(el: Element): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

export type AccNameSeverity = 'error' | 'warning' | 'pass';

function evaluateEntry(entry: AccNameEntry): AccNameSeverity {
  if (entry.role === 'presentation' || entry.role === 'none') return 'pass';
  if (entry.ariaHidden) return 'pass';

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

export function analyzeAccessibleNames(): AccNameResult {
  const entries: AccNameEntry[] = [];
  const selector = 'a, button, input, select, textarea, img, svg[role="img"], h1, h2, h3, h4, h5, h6, nav, main, header, footer, aside, form, section, table, dialog, details, summary, fieldset, iframe, object, embed, area, meter, progress, output, [role], [tabindex], [aria-label], [aria-labelledby]';

  const elements = document.querySelectorAll(selector);
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
