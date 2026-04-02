import type { ComponentTabFlow } from '../../core/types';
import { KB_TYPE_LABELS } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { getElementContext } from '../../utils/wcag-map';
import { SEV, DISABLED_BG, DISABLED_TEXT, DISABLED_BORDER } from '../tokens';
import { renderNavBar, renderSeverityBadge, renderPriorityBadge, hoverListeners } from './helpers';

export function renderComponentFlowDetail(flow: ComponentTabFlow, instanceIdx: number): string {
  const inst = flow.instances[instanceIdx];
  if (!inst) return `<div>No instance data</div>`;

  const total = flow.instances.length;
  const hasPrev = instanceIdx > 0;
  const hasNext = instanceIdx < total - 1;

  let html = renderNavBar(flow.component.name, true, 'Components');

  // Instance navigation
  const activeBtn = `background: white; border: 1px solid #D1D5DB; color: #374151; cursor: pointer; font-weight: 500;`;
  const disabledBtn = `background: ${DISABLED_BG}; border: 1px solid ${DISABLED_BORDER}; color: ${DISABLED_TEXT}; cursor: not-allowed; opacity: 0.5;`;

  html += `
    <div style="padding: 12px 16px; background: white; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center;">
      <button id="btn-prev-inst" ${!hasPrev ? 'disabled' : ''} style="padding: 5px 12px; border-radius: 6px; font-size: 12px; ${hasPrev ? activeBtn : disabledBtn}">
        &laquo; Prev
      </button>
      <span style="font-size: 13px; font-weight: 600; color: #1F2937;">
        Instance <span style="color: #6366F1;">${instanceIdx + 1}</span> / ${total}
      </span>
      <button id="btn-next-inst" ${!hasNext ? 'disabled' : ''} style="padding: 5px 12px; border-radius: 6px; font-size: 12px; ${hasNext ? activeBtn : disabledBtn}">
        Next &raquo;
      </button>
    </div>
  `;

  // Entry/Exit summary
  const entryCtx = inst.entryFrom ? getElementContext(inst.entryFrom) : 'Page start';
  const exitCtx = inst.exitTo ? getElementContext(inst.exitTo) : 'Page end';

  html += `
    <div style="padding: 10px 16px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
      <div style="display: flex; gap: 12px;">
        <div style="flex: 1; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 8px 10px;">
          <div style="font-size: 11px; color: #15803D; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; line-height: 1.5;">&#9654; Entry from</div>
          <div style="font-size: 12px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escHtml(entryCtx)}</div>
        </div>
        <div style="flex: 1; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 8px 10px;">
          <div style="font-size: 11px; color: #B91C1C; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; line-height: 1.5;">&#9632; Exit to</div>
          <div style="font-size: 12px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escHtml(exitCtx)}</div>
        </div>
      </div>
    </div>
  `;

  html += `<div id="scroll-area" style="padding: 12px 16px; background: #F9FAFB; overflow-y: auto; flex: 1;">`;

  // Tab flow steps
  html += `<div style="margin-bottom: 16px;">
    <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #374151;">Tab Flow (${inst.focusable.length} stops)</h3>
  `;

  inst.focusable.forEach((el, idx) => {
    const context = getElementContext(el);
    const hasIssue = inst.issues.some(i => i.element === el);
    const borderColor = hasIssue ? '#EF4444' : '#16A34A';
    const dotBg = hasIssue ? '#EF4444' : '#16A34A';

    html += `
      <div class="flow-step" data-step="${idx}" style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; margin-bottom: 4px; background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${borderColor}; border-radius: 6px; cursor: pointer; transition: border-color 0.15s;">
        <span style="background: ${dotBg}; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">
          ${idx + 1}
        </span>
        <span style="font-size: 12px; color: #374151; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
          ${escHtml(context)}
        </span>
        ${hasIssue ? `<span style="color: #DC2626; font-size: 11px; flex-shrink: 0;">&#9888;</span>` : ''}
      </div>
    `;
  });

  html += `</div>`;

  // Issues in this instance
  if (inst.issues.length > 0) {
    html += `
      <div style="margin-bottom: 16px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #374151;">Issues (${inst.issues.length})</h3>
    `;

    inst.issues.forEach((issue, iIdx) => {
      const s = SEV[issue.severity];

      html += `
        <div class="flow-issue" data-iidx="${iIdx}" style="background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${s.badge}; border-radius: 6px; padding: 10px; margin-bottom: 6px; cursor: pointer; transition: border-color 0.15s;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; font-weight: 600; color: #374151;">${escHtml(KB_TYPE_LABELS[issue.type])}</span>
            <div style="display: flex; gap: 4px;">
              ${renderPriorityBadge(issue.priority)}
              ${renderSeverityBadge(issue.severity)}
            </div>
          </div>
          <p style="margin: 0; font-size: 11px; color: #6B7280; line-height: 1.5;">${escHtml(issue.description.substring(0, 120))}${issue.description.length > 120 ? '...' : ''}</p>
        </div>
      `;
    });

    html += `</div>`;
  } else {
    html += `
      <div style="padding: 12px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; text-align: center;">
        <span style="color: #16A34A; font-weight: 500; font-size: 13px;">&#10003; No keyboard issues in this instance</span>
      </div>
    `;
  }

  // Consistency across instances
  if (flow.instances.length > 1) {
    html += renderConsistencySection(flow);
  }

  html += `</div>`;
  return html;
}

function renderConsistencySection(flow: ComponentTabFlow): string {
  const counts = flow.instances.map(i => i.focusable.length);
  const issueCounts = flow.instances.map(i => i.issues.length);
  const allSame = counts.every(c => c === counts[0]);
  const allIssuesSame = issueCounts.every(c => c === issueCounts[0]);

  let bgColor = '#F0FDF4';
  let borderColor = '#BBF7D0';
  let textColor = '#16A34A';
  let icon = '&#10003;';
  let message = 'All instances have consistent tab flow and issue counts.';

  if (!allSame || !allIssuesSame) {
    bgColor = '#FFFBEB';
    borderColor = '#FDE68A';
    textColor = '#92400E';
    icon = '&#9888;';
    message = `Inconsistency: tab stops vary (${Math.min(...counts)}-${Math.max(...counts)}), issues vary (${Math.min(...issueCounts)}-${Math.max(...issueCounts)}).`;
  }

  return `
    <div style="margin-top: 16px;">
      <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #374151;">Instance Consistency</h3>
      <div style="padding: 12px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px;">
        <span style="font-size: 13px; color: ${textColor}; font-weight: 500;">${icon} ${message}</span>
      </div>
    </div>
  `;
}

export function attachFlowDetailListeners(container: HTMLElement, flow: ComponentTabFlow, instanceIdx: number, actions: {
  onBack: () => void;
  onHighlight: (els: Element[]) => void;
  onPrev: () => void;
  onNext: () => void;
  onShowFlow: (flow: ComponentTabFlow, idx: number) => void;
}): void {
  container.querySelector('#btn-back')?.addEventListener('click', () => actions.onBack());
  container.querySelector('#btn-prev-inst')?.addEventListener('click', () => {
    if (instanceIdx > 0) actions.onPrev();
  });
  container.querySelector('#btn-next-inst')?.addEventListener('click', () => {
    if (instanceIdx < flow.instances.length - 1) actions.onNext();
  });

  const inst = flow.instances[instanceIdx];
  if (inst) {
    actions.onShowFlow(flow, instanceIdx);

    container.querySelectorAll('.flow-step').forEach(el => {
      el.addEventListener('click', () => {
        const step = parseInt(el.getAttribute('data-step') || '0', 10);
        if (inst.focusable[step]) actions.onHighlight([inst.focusable[step]]);
      });
    });

    container.querySelectorAll('.flow-issue').forEach(el => {
      el.addEventListener('click', () => {
        const iidx = parseInt(el.getAttribute('data-iidx') || '0', 10);
        if (inst.issues[iidx]) actions.onHighlight([inst.issues[iidx].element]);
      });
    });
  }

  hoverListeners(container, '.flow-step', '#6366F1');
  hoverListeners(container, '.flow-issue', '#6366F1');
}
