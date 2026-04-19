import type { FormLabelIssue, FormLabelsResult } from './types';

function isExtension(el: Element): boolean {
  return !!el.closest('#a11y-analyzer-panel') || !!el.closest('#a11y-analyzer-overlay');
}

function isVisible(el: Element): boolean {
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

function hasExplicitLabel(el: Element): { found: boolean; method: string; text: string } {
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const parts = labelledBy.split(/\s+/).map(id => document.getElementById(id)?.textContent?.trim() || '').filter(Boolean);
    if (parts.length > 0) return { found: true, method: 'aria-labelledby', text: parts.join(' ') };
  }

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel?.trim()) return { found: true, method: 'aria-label', text: ariaLabel.trim() };

  const id = el.id;
  if (id) {
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return { found: true, method: '<label for>', text: label.textContent.trim() };
  }

  const wrapping = el.closest('label');
  if (wrapping) {
    const clone = wrapping.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('input, select, textarea, button').forEach(c => c.remove());
    const text = clone.textContent?.trim();
    if (text) return { found: true, method: 'wrapping <label>', text };
  }

  const title = el.getAttribute('title');
  if (title?.trim()) return { found: true, method: 'title attribute', text: title.trim() };

  return { found: false, method: '', text: '' };
}

export function analyzeFormLabels(root?: Element | Document): FormLabelsResult {
  const issues: FormLabelIssue[] = [];
  const controls = (root ?? document).querySelectorAll('input, select, textarea');
  let totalControls = 0;
  let labeledControls = 0;

  controls.forEach(el => {
    if (isExtension(el)) return;
    if (!isVisible(el)) return;

    const tag = el.tagName.toLowerCase();
    const type = (el as HTMLInputElement).type || 'text';

    if (['hidden', 'submit', 'reset', 'button', 'image'].includes(type)) return;
    if (el.getAttribute('aria-hidden') === 'true') return;

    totalControls++;

    const label = hasExplicitLabel(el);
    const placeholder = el.getAttribute('placeholder')?.trim() || '';
    const fieldName = tag === 'input' ? `<input type="${type}">` : `<${tag}>`;

    if (!label.found) {
      if (placeholder) {
        issues.push({
          element: el, type: 'placeholder-only', severity: 'warning',
          description: `${fieldName} uses placeholder "${placeholder}" as its only label. Placeholders disappear on input and are not reliably announced.`,
          labelMethod: 'placeholder only',
          fieldType: type,
        });
      } else {
        issues.push({
          element: el, type: 'missing-label', severity: 'error',
          description: `${fieldName} has no accessible label. Screen readers will announce it as an unlabeled control.`,
          labelMethod: 'none',
          fieldType: type,
        });
      }
    } else {
      labeledControls++;

      if (label.method === 'title attribute') {
        issues.push({
          element: el, type: 'title-only', severity: 'info',
          description: `${fieldName} is labeled only by title="${label.text}". Prefer <label> or aria-label for better screen reader support.`,
          labelMethod: label.method,
          fieldType: type,
        });
      }
    }

    const group = el.closest('fieldset');
    if (group && !group.querySelector('legend')?.textContent?.trim()) {
      const fieldsetLabel = group.getAttribute('aria-label') || group.getAttribute('aria-labelledby');
      if (!fieldsetLabel) {
        const already = issues.find(i => i.type === 'missing-fieldset-legend' && i.element === group);
        if (!already) {
          issues.push({
            element: group, type: 'missing-fieldset-legend', severity: 'warning',
            description: `<fieldset> has no <legend> or aria-label. Grouped controls won't have a group name for screen readers.`,
            labelMethod: 'none',
            fieldType: 'fieldset',
          });
        }
      }
    }

    if (type === 'radio' || type === 'checkbox') {
      const name = (el as HTMLInputElement).name;
      if (name) {
        const siblings = document.querySelectorAll(`input[name="${CSS.escape(name)}"]`);
        if (siblings.length > 1 && !el.closest('fieldset')) {
          const already = issues.find(i => i.type === 'ungrouped-radio' && (i.element as HTMLInputElement).name === name);
          if (!already) {
            issues.push({
              element: el, type: 'ungrouped-radio', severity: 'warning',
              description: `Radio/checkbox group "${name}" is not wrapped in <fieldset> with <legend>. Screen readers can't identify the group.`,
              labelMethod: label.method || 'none',
              fieldType: type,
            });
          }
        }
      }
    }
  });

  return { issues, totalControls, labeledControls };
}
