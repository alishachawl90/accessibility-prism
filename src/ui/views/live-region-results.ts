import type { LiveRegionResult } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { ICON_CHEVRON_DOWN } from '../icons';
import { HIGHLIGHT } from '../tokens';
import { renderNavBar, hoverListeners } from './helpers';

const LIVE_COLORS: Record<string, string> = {
  assertive: '#EF4444', polite: '#2563EB', off: '#6B7280',
};

function getSelector(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls = el.className && typeof el.className === 'string'
    ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
    : '';
  return `${tag}${id}${cls}`;
}

function getSnippet(el: Element): string {
  const html = el.outerHTML;
  return html.length > 120 ? html.substring(0, 120) + '...' : html;
}

export function renderLiveRegionResults(data: LiveRegionResult): string {
  let html = renderNavBar('Live Regions', true, 'Back');

  html += `
    <div class="a11y-header-bar">
      <span style="color: #1F2937;">${data.regions.length} region${data.regions.length !== 1 ? 's' : ''}</span>
      <span style="color: ${data.issues.length > 0 ? '#F59E0B' : '#16A34A'};">${data.issues.length} issue${data.issues.length !== 1 ? 's' : ''}</span>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  if (data.issues.length > 0) {
    html += `<div style="margin-bottom: 16px;">
      <div class="a11y-section-title">Issues</div>`;
    data.issues.forEach((issue, idx) => {
      const sevColor = issue.severity === 'error' ? '#EF4444' : issue.severity === 'warning' ? '#F59E0B' : '#60A5FA';
      const selector = getSelector(issue.element);
      const snippet = getSnippet(issue.element);

      html += `
        <div style="background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${sevColor}; border-radius: 8px; margin-bottom: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div class="lr-issue-header" data-idx="${idx}" style="padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="background: ${sevColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${issue.severity === 'error' ? 'Error' : issue.severity === 'warning' ? 'Warning' : 'Info'}</span>
              </div>
              <p style="margin: 0; font-size: 13px; color: #374151; line-height: 1.5;">${escHtml(issue.description)}</p>
            </div>
            <span class="lr-issue-chevron" data-idx="${idx}" style="flex-shrink: 0; transition: transform 0.2s; color: #6B7280; margin-left: 8px;">${ICON_CHEVRON_DOWN}</span>
          </div>
          <div class="lr-issue-body" data-idx="${idx}" style="display: none; padding: 0 14px 12px 14px; border-top: 1px solid #F3F4F6;">
            <div style="margin-top: 10px;">
              <div style="font-size: 11px; color: #4B5563; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.5;">Selector</div>
              <code style="display: block; background: #F3F4F6; padding: 8px 10px; border-radius: 6px; font-size: 12px; color: #374151; word-break: break-all; line-height: 1.5;">${escHtml(selector)}</code>
            </div>
            <div style="margin-top: 10px;">
              <div style="font-size: 11px; color: #4B5563; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.5;">HTML</div>
              <code style="display: block; background: #FEF2F2; padding: 8px 10px; border-radius: 6px; font-size: 12px; color: #DC2626; word-break: break-all; line-height: 1.5;">${escHtml(snippet)}</code>
            </div>
            <button class="lr-highlight-issue" data-idx="${idx}" style="margin-top: 10px; width: 100%; padding: 8px; background: #F5F3FF; border: 1px solid #C4B5FD; border-radius: 6px; cursor: pointer; font-size: 12px; color: ${HIGHLIGHT}; font-weight: 500; transition: all 0.15s;">
              Highlight on page
            </button>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  html += `<div class="a11y-section-title">Detected Regions</div>`;

  if (data.regions.length === 0) {
    html += `<div class="a11y-empty-state">No live regions found on this page.</div>`;
  } else {
    data.regions.forEach((region, idx) => {
      const color = LIVE_COLORS[region.ariaLive] || '#6B7280';
      const content = region.element.textContent?.trim().substring(0, 80) || '';
      const selector = getSelector(region.element);
      const snippet = getSnippet(region.element);

      html += `
        <div style="background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${color}; border-radius: 8px; margin-bottom: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
          <div class="lr-region-header" data-idx="${idx}" style="padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1; min-width: 0;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">aria-live="${escHtml(region.ariaLive)}"</span>
                <span style="font-size: 12px; color: #6B7280;">${escHtml(region.role)}</span>
              </div>
              ${content ? `<p style="margin: 0; font-size: 12px; color: #374151; line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escHtml(content)}</p>` : `<p style="margin: 0; font-size: 12px; color: #6B7280; font-style: italic;">empty</p>`}
            </div>
            <span class="lr-region-chevron" data-idx="${idx}" style="flex-shrink: 0; transition: transform 0.2s; color: #6B7280; margin-left: 8px;">${ICON_CHEVRON_DOWN}</span>
          </div>
          <div class="lr-region-body" data-idx="${idx}" style="display: none; padding: 0 14px 12px 14px; border-top: 1px solid #F3F4F6;">
            <div style="margin-top: 10px;">
              <div style="font-size: 11px; color: #4B5563; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.5;">Selector</div>
              <code style="display: block; background: #F3F4F6; padding: 8px 10px; border-radius: 6px; font-size: 12px; color: #374151; word-break: break-all; line-height: 1.5;">${escHtml(selector)}</code>
            </div>
            <div style="margin-top: 10px;">
              <div style="font-size: 11px; color: #4B5563; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.5;">HTML</div>
              <code style="display: block; background: #F3F4F6; padding: 8px 10px; border-radius: 6px; font-size: 12px; color: #374151; word-break: break-all; line-height: 1.5;">${escHtml(snippet)}</code>
            </div>
            <button class="lr-highlight-region" data-idx="${idx}" style="margin-top: 10px; width: 100%; padding: 8px; background: #F5F3FF; border: 1px solid #C4B5FD; border-radius: 6px; cursor: pointer; font-size: 12px; color: ${HIGHLIGHT}; font-weight: 500; transition: all 0.15s;">
              Highlight on page
            </button>
          </div>
        </div>`;
    });
  }

  html += `</div>`;
  return html;
}

export function attachLiveRegionListeners(container: HTMLElement, data: LiveRegionResult, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  function wireExpandable(headerClass: string, bodyClass: string, chevronClass: string) {
    container.querySelectorAll(`.${headerClass}`).forEach(el => {
      el.addEventListener('click', () => {
        const idx = el.getAttribute('data-idx') || '0';
        const body = container.querySelector(`.${bodyClass}[data-idx="${idx}"]`) as HTMLElement;
        const chevron = container.querySelector(`.${chevronClass}[data-idx="${idx}"]`) as HTMLElement;
        if (body && chevron) {
          const open = body.style.display !== 'none';
          body.style.display = open ? 'none' : 'block';
          chevron.style.transform = open ? '' : 'rotate(180deg)';
        }
      });
    });
  }

  wireExpandable('lr-issue-header', 'lr-issue-body', 'lr-issue-chevron');
  wireExpandable('lr-region-header', 'lr-region-body', 'lr-region-chevron');

  container.querySelectorAll('.lr-highlight-issue').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const issue = data.issues[idx];
      if (issue) actions.onHighlight([issue.element]);
    });
  });

  container.querySelectorAll('.lr-highlight-region').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const region = data.regions[idx];
      if (region) actions.onHighlight([region.element]);
    });
  });

  hoverListeners(container, '.lr-region-header', '#6366F1');
  hoverListeners(container, '.lr-issue-header', '#6366F1');
}
