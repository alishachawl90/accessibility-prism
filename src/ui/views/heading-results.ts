import type { HeadingAnalysisResult } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';

const LEVEL_COLORS: Record<number, string> = {
  1: '#EF4444', 2: '#F97316', 3: '#F59E0B', 4: '#3B82F6', 5: '#8B5CF6', 6: '#6B7280',
};

export function renderHeadingResults(data: HeadingAnalysisResult): string {
  let html = renderNavBar('Heading Structure', true, 'Back');

  const issueCount = data.issues.length;
  const headingCount = data.headings.length;
  html += `
    <div class="a11y-header-bar">
      <span style="color: #1F2937;">${headingCount} heading${headingCount !== 1 ? 's' : ''}</span>
      <span style="color: ${issueCount > 0 ? '#EF4444' : '#16A34A'};">${issueCount} issue${issueCount !== 1 ? 's' : ''}</span>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (data.issues.length > 0) {
    html += `<div style="margin-bottom: 16px;">
      <div class="a11y-section-title">Issues</div>`;
    data.issues.forEach((issue, idx) => {
      const sevColor = issue.severity === 'error' ? '#EF4444' : issue.severity === 'warning' ? '#F59E0B' : '#60A5FA';
      html += `
        <div class="heading-issue" data-idx="${idx}" class="a11y-card" style="border-left-color: ${sevColor} !important; ${issue.element ? 'cursor: pointer;' : ''} ">
          <div class="a11y-card-header">
            <span style="background: ${sevColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Info'}</span>
            <span style="font-size: 12px; color: #6B7280;">${issue.type.replace(/-/g, ' ')}</span>
          </div>
          <p class="a11y-card-desc">${escHtml(issue.description)}</p>
        </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="a11y-section-title">Heading Tree</div>`;

  if (data.headings.length === 0) {
    html += `<div class="a11y-empty-state">No headings found on this page.</div>`;
  } else {
    data.headings.forEach((h, idx) => {
      const indent = (h.level - 1) * 20;
      const color = LEVEL_COLORS[h.level] || '#6B7280';
      const hasIssue = data.issues.some(i => i.element === h.element);
      html += `
        <div class="heading-node" data-idx="${idx}" style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; padding-left: ${12 + indent}px; margin-bottom: 4px; background: white; border: 1px solid ${hasIssue ? '#FCA5A5' : '#E5E7EB'}; border-left: 3px solid ${color}; border-radius: 8px; cursor: pointer; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; flex-shrink: 0;">H${h.level}</span>
          <span style="font-size: 13px; color: #1F2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${escHtml(h.text) || '<em style="color: #6B7280;">empty</em>'}</span>
          ${hasIssue ? '<span style="color: #DC2626; font-size: 12px; flex-shrink: 0;">&#9888;</span>' : ''}
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

export function attachHeadingListeners(container: HTMLElement, data: HeadingAnalysisResult, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.heading-node').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const heading = data.headings[idx];
      if (heading) actions.onHighlight([heading.element]);
    });
  });
  hoverListeners(container, '.heading-node', '#6366F1');

  container.querySelectorAll('.heading-issue').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = data.issues[idx];
      if (issue?.element) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.heading-issue[style*="cursor: pointer"]', '#6366F1');
}
