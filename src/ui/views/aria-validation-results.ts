import type { AriaValidationResult, AriaIssue } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';
const TYPE_LABELS: Record<string, string> = {
  'invalid-role': 'Invalid Role',
  'redundant-role': 'Redundant Role',
  'missing-required-prop': 'Missing Required Property',
  'broken-reference': 'Broken Reference',
  'hidden-focusable': 'Hidden but Focusable',
  'presentation-conflict': 'Presentation Conflict',
  'invalid-value': 'Invalid Value',
  'positive-tabindex': 'Positive Tabindex',
};

export function renderAriaResults(result: AriaValidationResult): string {
  let html = renderNavBar('ARIA Validation', true, 'Back');

  html += `
    <div class="a11y-header-bar">
      <span class="a11y-text-secondary">${result.issues.length} issue${result.issues.length !== 1 ? 's' : ''}</span>
      ${result.errorCount > 0 ? `<span class="a11y-text-error">${result.errorCount} Error${result.errorCount !== 1 ? 's' : ''}</span>` : ''}
      ${result.warningCount > 0 ? `<span class="a11y-text-warning">${result.warningCount} Warning${result.warningCount !== 1 ? 's' : ''}</span>` : ''}
      ${result.issues.length - result.errorCount - result.warningCount > 0 ? `<span class="a11y-text-info">${result.issues.length - result.errorCount - result.warningCount} Info</span>` : ''}
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (result.issues.length === 0) {
    html += `<div style="text-align: center !important; padding: 24px !important; color: #16A34A !important; font-size: 14px !important; font-weight: 500 !important;">No ARIA issues found. Well done!</div>`;
  } else {
    const grouped = new Map<string, AriaIssue[]>();
    result.issues.forEach(issue => {
      const key = issue.type;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(issue);
    });

    let cardIdx = 0;
    grouped.forEach((issues, type) => {
      const label = TYPE_LABELS[type] || type;
      const sevColor = issues[0].severity === 'error' ? '#EF4444' : issues[0].severity === 'warning' ? '#F59E0B' : '#60A5FA';

      html += `<div style="font-size: 12px !important; font-weight: 600 !important; color: ${sevColor} !important; margin: 12px 0 6px 0 !important; display: flex !important; align-items: center !important; gap: 6px !important;">
        <span>${escHtml(label)}</span>
        <span style="background: ${sevColor}14 !important; color: ${sevColor} !important; padding: 1px 8px !important; border-radius: 10px !important; font-size: 11px !important;">${issues.length}</span>
      </div>`;

      issues.forEach(issue => {
        const tag = issue.element.tagName.toLowerCase();
        html += `
          <div class="aria-card" data-idx="${cardIdx}" style="background: white !important; border: 1px solid #E5E7EB !important; border-left: 3px solid ${sevColor} !important; border-radius: 8px !important; padding: 12px 14px !important; margin-bottom: 6px !important; cursor: pointer !important; transition: border-color 0.15s !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">
            <p class="a11y-card-desc">${escHtml(issue.description)}</p>
            <code style="font-size: 11px !important; color: #6B7280 !important; margin-top: 4px !important; display: block !important; font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;">&lt;${escHtml(tag)}${issue.element.id ? ` id="${escHtml(issue.element.id)}"` : ''}${issue.element.getAttribute('role') ? ` role="${escHtml(issue.element.getAttribute('role')!)}"` : ''}&gt;</code>
          </div>
        `;
        cardIdx++;
      });
    });
  }

  html += `</div>`;
  return html;
}

export function attachAriaListeners(container: HTMLElement, result: AriaValidationResult, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.aria-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = result.issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.aria-card', '#6366F1');
}
