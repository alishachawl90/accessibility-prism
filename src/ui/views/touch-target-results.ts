import type { TouchTargetIssue } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';

function getContext(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = el.textContent?.trim().substring(0, 40) || '';
  const ariaLabel = el.getAttribute('aria-label');
  return ariaLabel || text || tag;
}

export function renderTouchTargetResults(issues: TouchTargetIssue[]): string {
  let html = renderNavBar('Touch Targets', true, 'Back');

  const aaFails = issues.filter(i => i.level === 'AA').length;
  const aaaFails = issues.filter(i => i.level === 'AAA').length;
  html += `
    <div class="a11y-header-bar">
      <span style="color: #1F2937;">${issues.length} undersized</span>
      ${aaFails > 0 ? `<span style="color: #DC2626;">${aaFails} below 24px (AA)</span>` : ''}
      ${aaaFails > 0 ? `<span style="color: #B45309;">${aaaFails} below 44px (AAA)</span>` : ''}
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (issues.length === 0) {
    html += `<div style="text-align: center; padding: 24px; color: #16A34A; font-size: 14px; font-weight: 500;">All interactive elements meet touch target size requirements.</div>`;
  } else {
    issues.forEach((issue, idx) => {
      const sevColor = issue.severity === 'error' ? '#EF4444' : '#F59E0B';
      const context = getContext(issue.element);
      html += `
        <div class="touch-card" data-idx="${idx}" style="background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${sevColor}; border-radius: 8px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 13px; font-weight: 500; color: #1F2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${escHtml(context)}</span>
            <span style="background: ${sevColor}12; color: ${sevColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; flex-shrink: 0; margin-left: 8px;">${issue.width}x${issue.height}px</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; font-size: 12px;">
            <span style="color: ${sevColor}; font-weight: 600;">${issue.level}</span>
            <span style="color: #6B7280;">Min: ${issue.minRequired}x${issue.minRequired}px</span>
            <span style="color: #6B7280;">&lt;${escHtml(issue.element.tagName.toLowerCase())}&gt;</span>
          </div>
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

export function attachTouchTargetListeners(container: HTMLElement, issues: TouchTargetIssue[], actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.touch-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.touch-card', '#6366F1');
}
