import type { ComponentTabFlow, KeyboardIssue } from '../../core/types';
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

function renderInlineIssue(issue: KeyboardIssue): string {
  const s = SEV[issue.severity];
  return `
    <div style="margin-top: 8px !important; padding: 10px !important; background: ${s.bg} !important; border: 1px solid ${s.border} !important; border-radius: 6px !important;">
      <div style="display: flex !important; gap: 6px !important; align-items: center !important; margin-bottom: 4px !important; flex-wrap: wrap !important;">
        ${renderSeverityBadge(issue.severity)}
        ${renderPriorityBadge(issue.priority)}
        <span style="font-size: 11px !important; font-weight: 600 !important; color: #4B5563 !important;">${escHtml(KB_TYPE_LABELS[issue.type])}</span>
      </div>
      <div style="font-size: 12px !important; color: #374151 !important; line-height: 1.5 !important;">${escHtml(issue.description)}</div>
    </div>`;
}

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

  let bodyHtml = '';

  // Unified tab flow — each step shows its issue inline when expanded
  bodyHtml += `
    <div style="margin-bottom: 18px !important;">
      <div style="padding: 8px 4px 10px !important; font-weight: 600 !important; font-size: 14px !important; color: #1F2937 !important; border-bottom: 1px solid #E5E7EB !important;">
        Tab Flow (${inst.focusable.length} stops${inst.issues.length > 0 ? `, ${inst.issues.length} issue${inst.issues.length !== 1 ? 's' : ''}` : ''})
      </div>
      <div style="display: flex !important; flex-direction: column !important; gap: 8px !important; margin-top: 10px !important;">`;

  inst.focusable.forEach((el, i) => {
    const context = getElementContext(el);
    const matchingIssues = inst.issues.filter(iss => iss.element === el);
    const hasIssue = matchingIssues.length > 0;
    const borderColor = hasIssue ? '#EF4444' : '#16A34A';
    const dotBg = hasIssue ? '#EF4444' : '#16A34A';

    const extraBodyHtml = matchingIssues.length > 0
      ? matchingIssues.map(renderInlineIssue).join('')
      : '';

    bodyHtml += renderIssueCard({
      idx: i,
      borderColor,
      badgeHtml: `<span style="background: ${dotBg} !important; color: white !important; width: 22px !important; height: 22px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; font-weight: 700 !important; font-size: 11px !important; flex-shrink: 0 !important;">${i + 1}</span>`,
      titleHtml: escHtml(context),
      descriptionHtml: hasIssue
        ? `<span style="color: #DC2626 !important; font-size: 11px !important;">&#9888; ${matchingIssues.length} issue${matchingIssues.length !== 1 ? 's' : ''} — ${escHtml(matchingIssues.map(iss => KB_TYPE_LABELS[iss.type]).join(', '))}</span>`
        : undefined,
      selector: getCssSelector(el),
      snippet: getSnippet(el),
      extraBodyHtml,
    });
  });

  bodyHtml += `</div></div>`;

  if (inst.issues.length === 0) {
    bodyHtml += `
      <div style="padding: 12px !important; background: #F0FDF4 !important; border: 1px solid #BBF7D0 !important; border-radius: 8px !important; text-align: center !important; margin-bottom: 16px !important;">
        <span style="color: #16A34A !important; font-weight: 500 !important; font-size: 13px !important;">&#10003; No keyboard issues in this instance</span>
      </div>`;
  }

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

  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => {
      if (inst && inst.focusable[idx]) actions.onHighlight([inst.focusable[idx]]);
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
