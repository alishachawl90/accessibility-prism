import type { FocusManagementIssue } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';

const TYPE_LABELS: Record<string, string> = {
  'no-focus-trap': 'Focus Not Trapped',
  'no-return-focus': 'No Return Focus',
  'no-escape-close': 'No Escape Key Handler',
  'missing-role-dialog': 'Missing Dialog Role',
  'missing-aria-label': 'Missing Dialog Label',
  'no-initial-focus': 'No Initial Focus',
};

export function renderFocusMgmtResults(issues: FocusManagementIssue[]): string {
  let html = renderNavBar('Focus Management', true, 'Back');

  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  html += `
    <div class="a11y-header-bar">
      <span style="color: #1F2937;">${issues.length} issue${issues.length !== 1 ? 's' : ''}</span>
      ${errors > 0 ? `<span style="color: #DC2626;">${errors} Error${errors !== 1 ? 's' : ''}</span>` : ''}
      ${warnings > 0 ? `<span style="color: #B45309;">${warnings} Warning${warnings !== 1 ? 's' : ''}</span>` : ''}
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (issues.length === 0) {
    html += `<div style="text-align: center; padding: 24px; color: #15803D; font-size: 14px; font-weight: 500;">No dialog/modal focus issues detected.</div>
      <div style="text-align: center; padding: 0 24px 24px; color: #6B7280; font-size: 12px;">Note: This analysis checks currently open dialogs. Open a modal and re-run to test it.</div>`;
  } else {
    issues.forEach((issue, idx) => {
      const sevColor = issue.severity === 'error' ? '#EF4444' : issue.severity === 'warning' ? '#F59E0B' : '#60A5FA';
      html += `
        <div class="focus-issue" data-idx="${idx}" style="background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${sevColor}; border-radius: 8px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="background: ${sevColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Info'}</span>
            <span style="font-size: 12px; font-weight: 600; color: #374151;">${TYPE_LABELS[issue.type] || issue.type}</span>
          </div>
          <p class="a11y-card-desc">${escHtml(issue.description)}</p>
          <div style="margin-top: 6px; font-size: 11px; color: #6B7280;">&lt;${escHtml(issue.element.tagName.toLowerCase())}&gt;</div>
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

export function attachFocusMgmtListeners(container: HTMLElement, issues: FocusManagementIssue[], actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.focus-issue').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.focus-issue', '#6366F1');
}
