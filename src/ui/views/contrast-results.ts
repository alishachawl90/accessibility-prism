import type { ContrastIssue } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';

export function renderContrastResults(issues: ContrastIssue[]): string {
  let html = renderNavBar('Color Contrast', true, 'Back');

  const aaFails = issues.filter(i => !i.passesAA).length;
  html += `
    <div class="a11y-header-bar">
      <span style="color: #1F2937;">${issues.length} issue${issues.length !== 1 ? 's' : ''}</span>
      <span style="color: #DC2626;">${aaFails} AA failure${aaFails !== 1 ? 's' : ''}</span>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (issues.length === 0) {
    html += `<div style="text-align: center; padding: 24px; color: #15803D; font-size: 14px; font-weight: 500;">All text passes AA contrast requirements.</div>`;
  } else {
    issues.forEach((issue, idx) => {
      const sevColor = !issue.passesAA ? '#EF4444' : '#F97316';
      html += `
        <div class="contrast-card" data-idx="${idx}" style="background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${sevColor}; border-radius: 8px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 500; color: #1F2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">"${escHtml(issue.text)}"</span>
            <span style="background: ${sevColor}12; color: ${sevColor}; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; flex-shrink: 0; margin-left: 8px;">${issue.ratio}:1</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 18px; height: 18px; border-radius: 4px; background: ${issue.foreground}; border: 1px solid #E5E7EB;"></span>
              <span style="font-size: 11px; color: #6B7280; font-family: monospace;">${issue.foreground}</span>
            </div>
            <span style="color: #6B7280; font-size: 11px;">on</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 18px; height: 18px; border-radius: 4px; background: ${issue.background}; border: 1px solid #E5E7EB;"></span>
              <span style="font-size: 11px; color: #6B7280; font-family: monospace;">${issue.background}</span>
            </div>
          </div>
          <div style="display: flex; gap: 8px; font-size: 11px;">
            <span style="color: ${!issue.passesAA ? '#EF4444' : '#15803D'}; font-weight: 600;">${!issue.passesAA ? '&#10007;' : '&#10003;'} AA (${issue.requiredAA}:1)</span>
            <span style="color: ${!issue.passesAAA ? '#EF4444' : '#15803D'}; font-weight: 600;">${!issue.passesAAA ? '&#10007;' : '&#10003;'} AAA (${issue.requiredAAA}:1)</span>
            <span style="color: #6B7280;">${Math.round(issue.fontSize)}px${issue.isBold ? ' bold' : ''}${issue.isLargeText ? ' (large)' : ''}</span>
          </div>
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

export function attachContrastListeners(container: HTMLElement, issues: ContrastIssue[], actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.contrast-card').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    });
  });
  hoverListeners(container, '.contrast-card', '#6366F1');
}
