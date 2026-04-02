import type { FormLabelsResult } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';
import { BORDER } from '../tokens';

const TYPE_LABELS: Record<string, string> = {
  'missing-label': 'No Label',
  'placeholder-only': 'Placeholder Only',
  'title-only': 'Title Only',
  'missing-fieldset-legend': 'Missing Legend',
  'ungrouped-radio': 'Ungrouped Radio/Checkbox',
};

export function renderFormLabelsResults(result: FormLabelsResult): string {
  let html = renderNavBar('Form Labels Audit', true, 'Back');

  const coverage = result.totalControls > 0 ? Math.round((result.labeledControls / result.totalControls) * 100) : 100;
  const errors = result.issues.filter(i => i.severity === 'error').length;
  const warnings = result.issues.filter(i => i.severity === 'warning').length;
  const coverageColor = coverage >= 90 ? '#15803D' : coverage >= 70 ? '#F59E0B' : '#EF4444';

  html += `
    <div style="padding: 12px 16px !important; background: white !important; border-bottom: 1px solid ${BORDER} !important; display: flex !important; gap: 16px !important; font-size: 13px !important; font-weight: 600 !important; align-items: center !important; flex-wrap: wrap !important;">
      <span class="a11y-text-secondary">${result.totalControls} controls</span>
      <span style="color: ${coverageColor} !important;">${coverage}% labeled</span>
      ${errors > 0 ? `<span class="a11y-text-error">${errors} Error${errors !== 1 ? 's' : ''}</span>` : ''}
      ${warnings > 0 ? `<span class="a11y-text-warning">${warnings} Warning${warnings !== 1 ? 's' : ''}</span>` : ''}
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (result.issues.length === 0) {
    html += `<div class="a11y-empty-success">All form controls are properly labeled!</div>`;
  } else {
    result.issues.forEach((issue, idx) => {
      const sevColor = issue.severity === 'error' ? '#EF4444' : issue.severity === 'warning' ? '#F59E0B' : '#60A5FA';
      const sevLabel = issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Info';
      const typeLabel = TYPE_LABELS[issue.type] || issue.type;

      html += `
        <div class="form-card" data-idx="${idx}" class="a11y-card" style="border-left-color: ${sevColor} !important; cursor: pointer !important;">
          <div class="a11y-card-header">
            <span class="a11y-badge-sm" style="background: ${sevColor} !important; color: white !important;">${sevLabel}</span>
            <span class="a11y-card-title">${escHtml(typeLabel)}</span>
            <code class="a11y-code">${escHtml(issue.fieldType)}</code>
          </div>
          <p class="a11y-card-desc">${escHtml(issue.description.substring(0, 180))}${issue.description.length > 180 ? '...' : ''}</p>
        </div>
      `;
    });
  }

  html += `</div>`;
  return html;
}

export function attachFormLabelsListeners(container: HTMLElement, result: FormLabelsResult, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.form-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = result.issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.form-card', '#6366F1');
}
