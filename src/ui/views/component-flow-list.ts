import type { ComponentTabFlow } from '../../core/types';
import { escHtml } from '../../utils/escape';
import {
  renderResultsPage,
  renderIssueCard,
  attachResultsPageListeners,
} from './results-template';

export function renderComponentFlowList(flows: ComponentTabFlow[]): string {
  const totalInstances = flows.reduce((s, f) => s + f.instances.length, 0);
  const totalIssues = flows.reduce((s, f) => s + f.instances.reduce((si, inst) => si + inst.issues.length, 0), 0);

  const cardsHtml = flows.map((flow, idx) => {
    const totalFocusable = flow.instances.reduce((s, inst) => s + inst.focusable.length, 0);
    const flowIssues = flow.instances.reduce((s, inst) => s + inst.issues.length, 0);
    const issueRatio = totalFocusable > 0 ? flowIssues / totalFocusable : 0;

    let borderColor = '#16A34A';
    if (issueRatio > 0.5) borderColor = '#EF4444';
    else if (issueRatio > 0.25) borderColor = '#F59E0B';
    else if (flowIssues > 0) borderColor = '#D97706';

    const badgeHtml = `
      <span class="a11y-badge" style="background: ${borderColor} !important; color: white !important;">
        ${flow.instances.length} inst
      </span>`;

    const pillsHtml = `
      <div style="display: flex !important; gap: 6px !important; flex-wrap: wrap !important; margin-top: 4px !important;">
        <span style="background: #EEF2FF !important; color: #6366F1 !important; padding: 2px 8px !important; border-radius: 12px !important; font-size: 11px !important; font-weight: 600 !important;">
          ${totalFocusable} tab stop${totalFocusable !== 1 ? 's' : ''}
        </span>
        ${flowIssues > 0
          ? `<span style="background: #FEF2F2 !important; color: #DC2626 !important; padding: 2px 8px !important; border-radius: 12px !important; font-size: 11px !important; font-weight: 600 !important;">${flowIssues} issue${flowIssues !== 1 ? 's' : ''}</span>`
          : `<span style="background: #F0FDF4 !important; color: #15803D !important; padding: 2px 8px !important; border-radius: 12px !important; font-size: 11px !important; font-weight: 500 !important;">No issues</span>`
        }
      </div>`;

    return renderIssueCard({
      idx,
      borderColor,
      badgeHtml,
      titleHtml: escHtml(flow.component.name),
      descriptionHtml: pillsHtml,
      selector: `Component: ${escHtml(flow.component.name)}`,
      snippet: `${flow.instances.length} instance(s), ${totalFocusable} focusable elements`,
    });
  }).join('');

  const infoBanner = `
    <div style="padding: 10px 16px !important; background: #EFF6FF !important; border-bottom: 1px solid #BFDBFE !important; font-size: 12px !important; color: #1E40AF !important; line-height: 1.5 !important; margin-bottom: 12px !important;">
      Select a component to inspect its keyboard tab flow, entry/exit points, and internal issues.
    </div>`;

  return renderResultsPage({
    title: 'Component Keyboard Flows',
    backLabel: 'Back',
    stats: [
      { value: flows.length, label: flows.length === 1 ? 'component' : 'components' },
      { value: totalInstances, label: 'instances' },
      { value: totalIssues, label: totalIssues === 1 ? 'issue' : 'issues', color: totalIssues > 0 ? '#EF4444' : '#16A34A' },
    ],
    bodyHtml: flows.length === 0 ? '' : infoBanner + cardsHtml,
    emptyMessage: flows.length === 0 ? 'No focusable components detected.' : undefined,
  });
}

export function attachFlowListListeners(
  container: HTMLElement,
  _flows: ComponentTabFlow[],
  actions: { onBack: () => void; onSelectFlow: (idx: number) => void },
): void {
  attachResultsPageListeners(container, {
    onBack: actions.onBack,
    onHighlight: (idx) => actions.onSelectFlow(idx),
  });
}
