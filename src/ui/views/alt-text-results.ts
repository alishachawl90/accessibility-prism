import type { AltTextIssue } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';

const TYPE_LABELS: Record<string, string> = {
  'missing-alt': 'Missing Alt',
  'empty-alt-in-link': 'Empty Alt in Link',
  'suspicious-alt': 'Suspicious Alt Text',
  'long-alt': 'Alt Text Too Long',
  'decorative-with-role': 'Decorative Conflict',
};

export function renderAltTextResults(issues: AltTextIssue[]): string {
  let html = renderNavBar('Alt Text Audit', true, 'Back');

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
    html += `<div style="text-align: center; padding: 24px; color: #16A34A; font-size: 14px; font-weight: 500;">All images have appropriate alt text.</div>`;
  } else {
    issues.forEach((issue, idx) => {
      const sevColor = issue.severity === 'error' ? '#EF4444' : issue.severity === 'warning' ? '#F59E0B' : '#60A5FA';
      const src = (issue.element as HTMLImageElement).src || '';
      const filename = src.split('/').pop()?.split('?')[0] || '';
      html += `
        <div class="alt-card" data-idx="${idx}" style="background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${sevColor}; border-radius: 8px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="background: ${sevColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Info'}</span>
            <span style="font-size: 12px; font-weight: 600; color: #374151;">${TYPE_LABELS[issue.type] || issue.type}</span>
          </div>
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #374151; line-height: 1.5;">${escHtml(issue.description.substring(0, 160))}${issue.description.length > 160 ? '...' : ''}</p>
          <div style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #6B7280;">
            ${filename ? `<span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${escHtml(filename)}</span>` : ''}
            ${issue.currentAlt !== null ? `<span>alt="${escHtml(issue.currentAlt.substring(0, 40))}${issue.currentAlt.length > 40 ? '...' : ''}"</span>` : '<span>no alt attribute</span>'}
          </div>
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

export function attachAltTextListeners(container: HTMLElement, issues: AltTextIssue[], actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.alt-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.alt-card', '#6366F1');
}
