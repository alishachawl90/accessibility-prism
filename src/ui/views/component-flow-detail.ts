import type { ComponentTabFlow } from '../../core/types';
import { KB_TYPE_LABELS } from '../../core/types';
import { escHtml } from '../../utils/escape';
import { getElementContext } from '../../utils/wcag-map';
import { SEV, DISABLED_BG, DISABLED_TEXT, DISABLED_BORDER } from '../tokens';
import {
  renderResultsPage,
  renderIssueCard,
  renderSeverityBadge,
  getCssSelector,
  getSnippet,
  attachResultsPageListeners,
} from './results-template';
import { renderPriorityBadge } from './helpers';

export function renderComponentFlowDetail(flow: ComponentTabFlow, instanceIdx: number): string {
  const inst = flow.instances[instanceIdx];
  if (!inst) return `<div>No instance data</div>`;

  const total = flow.instances.length;
  const hasPrev = instanceIdx > 0;
  const hasNext = instanceIdx < total - 1;

  const entryCtx = inst.entryFrom ? getElementContext(inst.entryFrom) : 'Page start';
  const exitCtx = inst.exitTo ? getElementContext(inst.exitTo) : 'Page end';

  const activeBtn = `background: white !important; border: 1px solid #D1D5DB !important; color: #374151 !important; cursor: pointer !important; font-weight: 500 !important;`;
  const disabledBtn = `background: ${DISABLED_BG} !important; border: 1px solid ${DISABLED_BORDER} !important; color: ${DISABLED_TEXT} !important; cursor: not-allowed !important; opacity: 0.5 !important;`;

  const toolbarHtml = `
    <div style="display: flex !important; justify-content: space-between !important; align-items: center !important; width: 100% !important;">
      <button data-toolbar-action="prev-inst" ${!hasPrev ? 'disabled' : ''} style="padding: 5px 12px !important; border-radius: 6px !important; font-size: 12px !important; ${hasPrev ? activeBtn : disabledBtn}">
        &laquo; Prev
      </button>
      <span style="font-size: 13px !important; font-weight: 600 !important; color: #1F2937 !important;">
        Instance <span style="color: #6366F1 !important;">${instanceIdx + 1}</span> / ${total}
      </span>
      <button data-toolbar-action="next-inst" ${!hasNext ? 'disabled' : ''} style="padding: 5px 12px !important; border-radius: 6px !important; font-size: 12px !important; ${hasNext ? activeBtn : disabledBtn}">
        Next &raquo;
      </button>
    </div>
    <div style="display: flex !important; gap: 12px !important; margin-top: 10px !important; width: 100% !important;">
      <div style="flex: 1 !important; background: #F0FDF4 !important; border: 1px solid #BBF7D0 !important; border-radius: 6px !important; padding: 8px 10px !important;">
        <div style="font-size: 11px !important; color: #15803D !important; font-weight: 700 !important; text-transform: uppercase !important; margin-bottom: 2px !important; line-height: 1.5 !important;">&#9654; Entry from</div>
        <div style="font-size: 12px !important; color: #374151 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;">${escHtml(entryCtx)}</div>
      </div>
      <div style="flex: 1 !important; background: #FEF2F2 !important; border: 1px solid #FECACA !important; border-radius: 6px !important; padding: 8px 10px !important;">
        <div style="font-size: 11px !important; color: #B91C1C !important; font-weight: 700 !important; text-transform: uppercase !important; margin-bottom: 2px !important; line-height: 1.5 !important;">&#9632; Exit to</div>
        <div style="font-size: 12px !important; color: #374151 !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;">${escHtml(exitCtx)}</div>
      </div>
    </div>`;

  const flatItems: Array<{ type: 'step' | 'issue'; element: Element }> = [];

  let bodyHtml = '';

  // Tab flow steps section
  bodyHtml += `
    <div style="margin-bottom: 18px !important;">
      <div style="padding: 8px 4px 10px !important; font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important; border-bottom: 1px solid #E5E7EB !important;">Tab Flow (${inst.focusable.length} stops)</div>
      <div style="display: flex !important; flex-direction: column !important; gap: 8px !important; margin-top: 10px !important;">`;

  inst.focusable.forEach((el, i) => {
    const idx = flatItems.length;
    flatItems.push({ type: 'step', element: el });
    const context = getElementContext(el);
    const hasIssue = inst.issues.some(iss => iss.element === el);
    const borderColor = hasIssue ? '#EF4444' : '#16A34A';
    const dotBg = hasIssue ? '#EF4444' : '#16A34A';

    bodyHtml += renderIssueCard({
      idx,
      borderColor,
      badgeHtml: `<span style="background: ${dotBg} !important; color: white !important; width: 22px !important; height: 22px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 700 !important; font-size: 11px !important; flex-shrink: 0 !important;">${i + 1}</span>`,
      titleHtml: escHtml(context),
      descriptionHtml: hasIssue ? `<span style="color: #DC2626 !important; font-size: 11px !important;">&#9888; Has keyboard issue</span>` : undefined,
      selector: getCssSelector(el),
      snippet: getSnippet(el),
    });
  });

  bodyHtml += `</div></div>`;

  // Issues section
  if (inst.issues.length > 0) {
    bodyHtml += `
      <div style="margin-bottom: 18px !important;">
        <div style="padding: 8px 4px 10px !important; font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important; border-bottom: 1px solid #E5E7EB !important;">Issues (${inst.issues.length})</div>
        <div style="display: flex !important; flex-direction: column !important; gap: 8px !important; margin-top: 10px !important;">`;

    inst.issues.forEach(issue => {
      const idx = flatItems.length;
      flatItems.push({ type: 'issue', element: issue.element });
      const s = SEV[issue.severity];

      bodyHtml += renderIssueCard({
        idx,
        borderColor: s.badge,
        badgeHtml: `
          <div style="display: flex !important; flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; flex-shrink: 0 !important;">
            ${renderSeverityBadge(issue.severity)}
            ${renderPriorityBadge(issue.priority)}
          </div>`,
        titleHtml: escHtml(KB_TYPE_LABELS[issue.type]),
        descriptionHtml: escHtml(issue.description.substring(0, 220)) + (issue.description.length > 220 ? '…' : ''),
        selector: getCssSelector(issue.element),
        snippet: getSnippet(issue.element),
      });
    });

    bodyHtml += `</div></div>`;
  } else {
    bodyHtml += `
      <div style="padding: 12px !important; background: #F0FDF4 !important; border: 1px solid #BBF7D0 !important; border-radius: 8px !important; text-align: center !important; margin-bottom: 16px !important;">
        <span style="color: #16A34A !important; font-weight: 500 !important; font-size: 13px !important;">&#10003; No keyboard issues in this instance</span>
      </div>`;
  }

  // Consistency section
  if (flow.instances.length > 1) {
    bodyHtml += renderConsistencySection(flow);
  }

  return renderResultsPage({
    title: flow.component.name,
    backLabel: 'Components',
    stats: [
      { value: inst.focusable.length, label: inst.focusable.length === 1 ? 'tab stop' : 'tab stops' },
      { value: inst.issues.length, label: inst.issues.length === 1 ? 'issue' : 'issues', color: inst.issues.length > 0 ? '#EF4444' : '#16A34A' },
    ],
    toolbarHtml,
    bodyHtml,
  });
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
    <div style="margin-top: 16px !important;">
      <div style="padding: 8px 4px 10px !important; font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important; border-bottom: 1px solid #E5E7EB !important;">Instance Consistency</div>
      <div style="padding: 12px !important; background: ${bgColor} !important; border: 1px solid ${borderColor} !important; border-radius: 8px !important; margin-top: 10px !important;">
        <span style="font-size: 13px !important; color: ${textColor} !important; font-weight: 500 !important;">${icon} ${message}</span>
      </div>
    </div>`;
}

export function attachFlowDetailListeners(
  container: HTMLElement,
  flow: ComponentTabFlow,
  instanceIdx: number,
  actions: {
    onBack: () => void;
    onHighlight: (els: Element[]) => void;
    onPrev: () => void;
    onNext: () => void;
    onShowFlow: (flow: ComponentTabFlow, idx: number) => void;
  },
): void {
  const inst = flow.instances[instanceIdx];
  const flatItems: Array<{ type: 'step' | 'issue'; element: Element }> = [];
  if (inst) {
    inst.focusable.forEach(el => flatItems.push({ type: 'step', element: el }));
    inst.issues.forEach(issue => flatItems.push({ type: 'issue', element: issue.element }));
  }

  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => {
      const item = flatItems[idx];
      if (item) actions.onHighlight([item.element]);
    },
    onToolbarAction: (action) => {
      if (action === 'prev-inst' && instanceIdx > 0) actions.onPrev();
      if (action === 'next-inst' && instanceIdx < flow.instances.length - 1) actions.onNext();
    },
  });

  if (inst) {
    actions.onShowFlow(flow, instanceIdx);
  }
}
