import type { AxeViolation } from '../../core/types';
import { parseWcagInfo, getElementContext } from '../../utils/wcag-map';
import { escHtml } from '../../utils/escape';
import { WCAG_LEVEL, HIGHLIGHT, LINK, RESULT_TYPE } from '../tokens';
import { ICON_ALERT, ICON_HELP, ICON_EXTERNAL, ICON_CHEVRON_DOWN } from '../icons';
import { renderNavBar } from './helpers';
import { generateFixSuggestion } from '../../utils/fix-suggestions';

export function renderAxeIssueDetails(v: AxeViolation): string {
  const wcag = parseWcagInfo(v.tags);

  let html = renderNavBar('', true, 'Issues overview');

  html += `
    <div style="padding: 18px 16px; background: white; border-bottom: 1px solid #E5E7EB;">
      <div style="display: flex; align-items: start; gap: 10px; margin-bottom: 14px;">
        ${ICON_ALERT}
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; line-height: 1.5; color: #1F2937;">${escHtml(v.help)}</h3>
      </div>

      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">
        ${(() => { const rt = RESULT_TYPE[v.resultType]; return `<span style="background: ${rt.bg}; color: ${rt.text}; border: 1px solid ${rt.border}; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px;">${rt.icon} ${rt.label}</span>`; })()}
        <span style="background: ${WCAG_LEVEL[wcag.level]}; color: white; padding: 3px 10px; border-radius: 4px; font-weight: 700; font-size: 12px;">${wcag.level}</span>
        <span style="font-size: 13px; color: #4B5563;">${wcag.fullLabel || v.id}</span>
      </div>

      <p style="margin: 0 0 14px 0; font-size: 13px; color: #6B7280; line-height: 1.6;">${escHtml(v.description)}</p>

      <div style="border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
        <div id="why-issue-toggle" style="padding: 12px 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #F9FAFB; transition: background 0.1s;">
          ${ICON_HELP}
          <span style="font-size: 13px; font-weight: 500; color: #374151;">Why is this an issue</span>
          <span id="why-chevron" style="margin-left: auto; transition: transform 0.2s; color: #6B7280;">${ICON_CHEVRON_DOWN}</span>
        </div>
        <div id="why-issue-body" style="display: none; padding: 12px 14px; border-top: 1px solid #E5E7EB; font-size: 13px; color: #4B5563; line-height: 1.6;">
          ${renderFixSuggestions(v)}
        </div>
      </div>

      ${v.helpUrl ? `
        <a href="${v.helpUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; gap: 6px; font-size: 13px; color: ${LINK}; text-decoration: none; font-weight: 500;">
          ${ICON_EXTERNAL}
          Learn more at Deque University
        </a>
      ` : ''}
    </div>
  `;

  html += `
    <div style="padding: 14px 16px; background: white; border-bottom: 1px solid #E5E7EB; display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 15px; font-weight: 600; color: #1F2937;">Occurrences</span>
      <span style="background: #EEF2FF; color: #6366F1; padding: 3px 10px; border-radius: 12px; font-size: 13px; font-weight: 600;">${v.nodes.length}</span>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area">`;

  v.nodes.forEach((node, idx) => {
    const context = getElementContext(node.element);
    let codeSnippet = node.html;
    if (codeSnippet.length > 120) codeSnippet = codeSnippet.substring(0, 120) + '...';

    html += `
      <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 8px; overflow: hidden; transition: border-color 0.15s; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
        <div class="occ-header" data-idx="${idx}" style="padding: 12px 14px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; color: #1F2937;">${escHtml(context)}</span>
          <span class="occ-chevron" data-idx="${idx}" style="flex-shrink: 0; transition: transform 0.2s; color: #6B7280;">${ICON_CHEVRON_DOWN}</span>
        </div>
        <div class="occ-body" data-idx="${idx}" style="display: none; padding: 0 14px 12px 14px; border-top: 1px solid #F3F4F6;">
          <div style="margin-top: 10px;">
            <div style="font-size: 11px; color: #4B5563; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.5;">Selector</div>
            <code style="display: block; background: #F3F4F6; padding: 8px 10px; border-radius: 6px; font-size: 12px; color: #374151; word-break: break-all; line-height: 1.5;">${escHtml(node.target.join(' > '))}</code>
          </div>
          <div style="margin-top: 10px;">
            <div style="font-size: 11px; color: #4B5563; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1.5;">HTML</div>
            <code style="display: block; background: #FEF2F2; padding: 8px 10px; border-radius: 6px; font-size: 12px; color: #DC2626; word-break: break-all; line-height: 1.5;">${escHtml(codeSnippet)}</code>
          </div>
          <button class="highlight-btn" data-idx="${idx}" style="margin-top: 10px; width: 100%; padding: 8px; background: #F5F3FF; border: 1px solid #C4B5FD; border-radius: 6px; cursor: pointer; font-size: 12px; color: ${HIGHLIGHT}; font-weight: 500; transition: all 0.15s;">
            Highlight on page
          </button>
          ${generateFixSuggestion(v, idx)}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function renderFixSuggestions(v: AxeViolation): string {
  const firstNode = v.nodes[0];
  if (!firstNode) return '<p>No fix information available.</p>';

  let html = '';

  if (firstNode.failureSummary) {
    const lines = firstNode.failureSummary.split('\n').filter(l => l.trim());
    html += `<div style="margin-bottom: 8px;">`;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Fix')) {
        html += `<div style="font-weight: 600; margin-bottom: 6px; color: #1F2937;">${escHtml(trimmed)}</div>`;
      } else {
        html += `<div style="padding-left: 14px; margin-bottom: 3px; color: #4B5563;">&bull; ${escHtml(trimmed)}</div>`;
      }
    });
    html += `</div>`;
  }

  const allChecks = [...firstNode.any, ...firstNode.all, ...firstNode.none].filter(c => c.message);
  if (allChecks.length > 0 && !firstNode.failureSummary) {
    html += `<ul style="margin: 0; padding-left: 18px;">`;
    allChecks.forEach(c => {
      html += `<li style="margin-bottom: 4px; color: #4B5563;">${escHtml(c.message)}</li>`;
    });
    html += `</ul>`;
  }

  if (!firstNode.failureSummary && allChecks.length === 0) {
    html += `<p style="color: #4B5563;">${escHtml(v.description)}</p>`;
  }

  return html;
}

export function attachAxeDetailsListeners(container: HTMLElement, violation: AxeViolation, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());

  container.querySelector('#why-issue-toggle')?.addEventListener('click', () => {
    const body = container.querySelector('#why-issue-body') as HTMLElement;
    const chevron = container.querySelector('#why-chevron') as HTMLElement;
    if (body) {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    }
  });

  container.querySelectorAll('.occ-header').forEach(el => {
    el.addEventListener('click', () => {
      const idx = el.getAttribute('data-idx');
      const body = container.querySelector(`.occ-body[data-idx="${idx}"]`) as HTMLElement;
      const chevron = container.querySelector(`.occ-chevron[data-idx="${idx}"]`) as HTMLElement;
      if (body) {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
      }
    });
  });

  container.querySelectorAll('.highlight-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(el.getAttribute('data-idx') || '0', 10);
      const nodeInfo = violation.nodes[idx];
      if (nodeInfo?.element) actions.onHighlight([nodeInfo.element]);
    });
  });
}
