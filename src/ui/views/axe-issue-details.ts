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
    <div style="padding: 18px 16px !important; background: white !important; border-bottom: 1px solid #E5E7EB !important;">
      <div style="display: flex !important; align-items: start !important; gap: 10px !important; margin-bottom: 14px !important;">
        ${ICON_ALERT}
        <h3 style="margin: 0 !important; font-size: 16px !important; font-weight: 600 !important; line-height: 1.5 !important; color: #1F2937 !important;">${escHtml(v.help)}</h3>
      </div>

      <div style="display: flex !important; align-items: center !important; gap: 8px !important; margin-bottom: 14px !important; flex-wrap: wrap !important;">
        ${(() => { const rt = RESULT_TYPE[v.resultType]; return `<span style="background: ${rt.bg} !important; color: ${rt.text} !important; border: 1px solid ${rt.border} !important; padding: 3px 8px !important; border-radius: 4px !important; font-weight: 600 !important; font-size: 11px !important;">${rt.icon} ${rt.label}</span>`; })()}
        <span style="background: ${WCAG_LEVEL[wcag.level]} !important; color: white !important; padding: 3px 10px !important; border-radius: 4px !important; font-weight: 700 !important; font-size: 12px !important;">${wcag.level}</span>
        <span style="font-size: 13px !important; color: #4B5563 !important;">${wcag.fullLabel || v.id}</span>
      </div>

      <p style="margin: 0 0 14px 0 !important; font-size: 13px !important; color: #6B7280 !important; line-height: 1.6 !important;">${escHtml(v.description)}</p>

      <div style="border: 1px solid #E5E7EB !important; border-radius: 8px !important; overflow: hidden !important; margin-bottom: 12px !important;">
        <div id="why-issue-toggle" style="padding: 12px 14px !important; cursor: pointer !important; display: flex !important; align-items: center !important; gap: 8px !important; background: #F9FAFB !important; transition: background 0.1s !important;">
          ${ICON_HELP}
          <span style="font-size: 13px !important; font-weight: 500 !important; color: #374151 !important;">Why is this an issue</span>
          <span id="why-chevron" style="margin-left: auto !important; transition: transform 0.2s !important; color: #6B7280 !important;">${ICON_CHEVRON_DOWN}</span>
        </div>
        <div id="why-issue-body" style="display: none !important; padding: 12px 14px !important; border-top: 1px solid #E5E7EB !important; font-size: 13px !important; color: #4B5563 !important; line-height: 1.6 !important;">
          ${renderFixSuggestions(v)}
        </div>
      </div>

      ${v.helpUrl ? `
        <a href="${v.helpUrl}" target="_blank" rel="noopener noreferrer" style="display: flex !important; align-items: center !important; gap: 6px !important; font-size: 13px !important; color: ${LINK} !important; text-decoration: none !important; font-weight: 500 !important;">
          ${ICON_EXTERNAL}
          Learn more at Deque University
        </a>
      ` : ''}
    </div>
  `;

  html += `
    <div style="padding: 14px 16px !important; background: white !important; border-bottom: 1px solid #E5E7EB !important; display: flex !important; align-items: center !important; gap: 8px !important;">
      <span style="font-size: 15px !important; font-weight: 600 !important; color: #1F2937 !important;">Occurrences</span>
      <span style="background: #EEF2FF !important; color: #6366F1 !important; padding: 3px 10px !important; border-radius: 12px !important; font-size: 13px !important; font-weight: 600 !important;">${v.nodes.length}</span>
    </div>
  `;

  html += `<div id="scroll-area" class="a11y-scroll-area" tabindex="0">`;

  v.nodes.forEach((node, idx) => {
    const context = getElementContext(node.element);
    let codeSnippet = node.html;
    if (codeSnippet.length > 120) codeSnippet = codeSnippet.substring(0, 120) + '...';

    html += `
      <div style="background: white !important; border: 1px solid #E5E7EB !important; border-radius: 8px !important; margin-bottom: 8px !important; overflow: hidden !important; transition: border-color 0.15s !important; box-shadow: 0 1px 2px rgba(0,0,0,0.04) !important;">
        <div class="occ-header" data-idx="${idx}" style="padding: 12px 14px !important; cursor: pointer !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">
          <span style="font-size: 13px !important; font-weight: 500 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; flex: 1 !important; color: #1F2937 !important;">${escHtml(context)}</span>
          <span class="occ-chevron" data-idx="${idx}" style="flex-shrink: 0 !important; transition: transform 0.2s !important; color: #6B7280 !important;">${ICON_CHEVRON_DOWN}</span>
        </div>
        <div class="occ-body" data-idx="${idx}" style="display: none !important; padding: 0 14px 12px 14px !important; border-top: 1px solid #F3F4F6 !important;">
          <div style="margin-top: 10px !important;">
            <div style="font-size: 11px !important; color: #4B5563 !important; margin-bottom: 4px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; line-height: 1.5 !important;">Selector</div>
            <code style="display: block !important; background: #F3F4F6 !important; padding: 8px 10px !important; border-radius: 6px !important; font-size: 12px !important; color: #374151 !important; word-break: break-all !important; line-height: 1.5 !important;">${escHtml(node.target.join(' > '))}</code>
          </div>
          <div style="margin-top: 10px !important;">
            <div style="font-size: 11px !important; color: #4B5563 !important; margin-bottom: 4px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.3px !important; line-height: 1.5 !important;">HTML</div>
            <code style="display: block !important; background: #FEF2F2 !important; padding: 8px 10px !important; border-radius: 6px !important; font-size: 12px !important; color: #DC2626 !important; word-break: break-all !important; line-height: 1.5 !important;">${escHtml(codeSnippet)}</code>
          </div>
          <button class="highlight-btn" data-idx="${idx}" style="margin-top: 10px !important; width: 100% !important; padding: 8px !important; background: #F5F3FF !important; border: 1px solid #C4B5FD !important; border-radius: 6px !important; cursor: pointer !important; font-size: 12px !important; color: ${HIGHLIGHT} !important; font-weight: 500 !important; transition: all 0.15s !important;">
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
    html += `<div style="margin-bottom: 8px !important;">`;
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Fix')) {
        html += `<div style="font-weight: 600 !important; margin-bottom: 6px !important; color: #1F2937 !important;">${escHtml(trimmed)}</div>`;
      } else {
        html += `<div style="padding-left: 14px !important; margin-bottom: 3px !important; color: #4B5563 !important;">&bull; ${escHtml(trimmed)}</div>`;
      }
    });
    html += `</div>`;
  }

  const allChecks = [...firstNode.any, ...firstNode.all, ...firstNode.none].filter(c => c.message);
  if (allChecks.length > 0 && !firstNode.failureSummary) {
    html += `<ul style="margin: 0 !important; padding-left: 18px !important;">`;
    allChecks.forEach(c => {
      html += `<li style="margin-bottom: 4px !important; color: #4B5563 !important;">${escHtml(c.message)}</li>`;
    });
    html += `</ul>`;
  }

  if (!firstNode.failureSummary && allChecks.length === 0) {
    html += `<p style="color: #4B5563 !important;">${escHtml(v.description)}</p>`;
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
      const isOpen = body.style.getPropertyValue('display') !== 'none';
      body.style.setProperty('display', isOpen ? 'none' : 'block', 'important');
      if (chevron) chevron.style.setProperty('transform', isOpen ? '' : 'rotate(180deg)', 'important');
    }
  });

  container.querySelectorAll('.occ-header').forEach(el => {
    el.addEventListener('click', () => {
      const idx = el.getAttribute('data-idx');
      const body = container.querySelector(`.occ-body[data-idx="${idx}"]`) as HTMLElement;
      const chevron = container.querySelector(`.occ-chevron[data-idx="${idx}"]`) as HTMLElement;
      if (body) {
        const isOpen = body.style.getPropertyValue('display') !== 'none';
        body.style.setProperty('display', isOpen ? 'none' : 'block', 'important');
        if (chevron) chevron.style.setProperty('transform', isOpen ? '' : 'rotate(180deg)', 'important');
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
