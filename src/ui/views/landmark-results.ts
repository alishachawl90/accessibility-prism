import type { LandmarkAnalysisResult } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { renderNavBar, hoverListeners } from './helpers';

const ROLE_COLORS: Record<string, string> = {
  banner: '#6366F1', navigation: '#F59E0B', main: '#16A34A', complementary: '#7C3AED',
  contentinfo: '#0891B2', search: '#D97706', form: '#2563EB', region: '#6B7280',
};

export function renderLandmarkResults(data: LandmarkAnalysisResult): string {
  let html = renderNavBar('Landmark Overview', true, 'Back');

  const issueCount = data.issues.length;
  html += `
    <div class="a11y-header-bar">
      <span style="color: #1F2937;">${data.landmarks.length} landmark${data.landmarks.length !== 1 ? 's' : ''}</span>
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
        <div class="landmark-issue" data-idx="${idx}" class="a11y-card" style="border-left-color: ${sevColor} !important; ${issue.element ? 'cursor: pointer;' : ''} ">
          <div class="a11y-card-header">
            <span style="background: ${sevColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Info'}</span>
          </div>
          <p class="a11y-card-desc">${escHtml(issue.description)}</p>
        </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="a11y-section-title">Page Landmarks</div>`;

  if (data.landmarks.length === 0) {
    html += `<div class="a11y-empty-state">No landmarks found on this page.</div>`;
  } else {
    data.landmarks.forEach((lm, idx) => {
      const color = ROLE_COLORS[lm.role] || '#6B7280';
      html += `
        <div class="landmark-node" data-idx="${idx}" class="a11y-card a11y-flex-center" style="border-left-color: ${color} !important; gap: 10px !important; cursor: pointer !important; margin-bottom: 6px !important;">
          <span style="background: ${color}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; flex-shrink: 0;">${escHtml(lm.role)}</span>
          <span style="font-size: 13px; color: #1F2937; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
            ${lm.label ? escHtml(lm.label) : `<span style="color: #6B7280; font-style: italic;">no label</span>`}
          </span>
          <span style="font-size: 11px; color: #6B7280; flex-shrink: 0;">&lt;${escHtml(lm.element.tagName.toLowerCase())}&gt;</span>
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

export function attachLandmarkListeners(container: HTMLElement, data: LandmarkAnalysisResult, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelectorAll('.landmark-node').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const lm = data.landmarks[idx];
      if (lm) actions.onHighlight([lm.element]);
    });
  });
  hoverListeners(container, '.landmark-node', '#6366F1');

  container.querySelectorAll('.landmark-issue').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = data.issues[idx];
      if (issue?.element) actions.onHighlight([issue.element]);
    });
  });
}
